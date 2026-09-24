import { execSync, spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Sobe o backend e o frontend juntos, sem depender de nenhum pacote extra.
 * Encerra os dois quando o terminal recebe Ctrl+C.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EH_WINDOWS = process.platform === "win32";

/** Porta padrão de cada serviço — usada para liberar a porta antes de subir. */
const PORTA_PADRAO = { backend: 3001, frontend: 5173 };

/** Serviços que sobem em paralelo. */
const SERVICOS = [
    { nome: "backend", pasta: "backend", cor: "\u001b[36m" },
    { nome: "frontend", pasta: "frontend", cor: "\u001b[35m" },
];

const RESET_COR = "\u001b[0m";

/**
 * Confere se as dependências dos dois projetos já foram instaladas.
 * @returns Verdadeiro quando está tudo pronto para subir.
 */
function dependenciasInstaladas() {
    const faltando = SERVICOS.filter((servico) => !fs.existsSync(path.join(RAIZ, servico.pasta, "node_modules")));

    if (!faltando.length)
        return true;

    console.error(`Faltam instalar as dependências de: ${faltando.map((servico) => servico.pasta).join(", ")}.`);
    console.error("Rode primeiro: npm run setup");

    return false;
}

/**
 * Avisa quando o arquivo .env ainda não existe.
 * @returns Nada.
 */
function avisarEnvAusente() {
    if (fs.existsSync(path.join(RAIZ, "backend", ".env")))
        return;

    console.warn("Aviso: backend/.env ainda não existe. Copie backend/.env.example e preencha GITLAB_URL e GITLAB_TOKEN.");
}

/**
 * Lê a porta configurada no backend/.env (variável PORT), se houver.
 * @returns Porta configurada, ou a padrão do backend quando a variável não estiver definida.
 */
function lerPortaDoBackend() {
    const caminhoEnv = path.join(RAIZ, "backend", ".env");

    if (!fs.existsSync(caminhoEnv))
        return PORTA_PADRAO.backend;

    const linhaPorta = fs
        .readFileSync(caminhoEnv, "utf8")
        .split("\n")
        .find((linha) => /^PORT=/.test(linha.trim()));
    const porta = linhaPorta ? Number.parseInt(linhaPorta.split("=")[1], 10) : NaN;

    return Number.isFinite(porta) ? porta : PORTA_PADRAO.backend;
}

/**
 * Mata qualquer processo que já esteja escutando a porta informada, sobrevivente de uma sessão
 * anterior que não terminou direito — no Windows, fechar o terminal sem Ctrl+C (ou o ts-node-dev
 * já ter respawnado o processo algumas vezes) pode deixar um processo preso na porta, ignorando
 * qualquer mudança feita depois no .env. Silencioso quando a porta já está livre.
 * @param porta Porta a liberar.
 * @param nome Nome do serviço, só para a mensagem.
 * @returns Nada.
 */
function liberarPorta(porta, nome) {
    try {
        if (EH_WINDOWS) {
            const saida = execSync("netstat -ano", { encoding: "utf8" });
            const pids = new Set(
                saida
                    .split("\n")
                    .map((linha) => linha.trim().split(/\s+/))
                    .filter((colunas) => colunas[0] === "TCP" && colunas[3] === "LISTENING" && colunas[1]?.endsWith(`:${porta}`))
                    .map((colunas) => colunas[4])
                    .filter(Boolean),
            );

            pids.forEach((pid) => matarPid(`taskkill /F /PID ${pid}`, porta, nome, pid));
        } else {
            const saida = execSync(`lsof -ti tcp:${porta}`, { encoding: "utf8" }).trim();

            if (!saida)
                return;

            saida.split("\n").forEach((pid) => matarPid(`kill -9 ${pid}`, porta, nome, pid));
        }
    } catch {
        // netstat/lsof não encontrou nada escutando a porta — nada a liberar.
    }
}

/**
 * Executa o comando que mata um PID específico, avisando o que foi feito.
 * @param comando Comando de encerramento já montado.
 * @param porta Porta que estava ocupada, só para a mensagem.
 * @param nome Nome do serviço, só para a mensagem.
 * @param pid PID encerrado, só para a mensagem.
 * @returns Nada.
 */
function matarPid(comando, porta, nome, pid) {
    try {
        execSync(comando, { stdio: "ignore" });
        console.warn(`Porta ${porta} (${nome}) estava ocupada por um processo de uma sessão anterior (PID ${pid}) — encerrado.`);
    } catch {
        // Processo já não existia mais quando tentamos matar — sem problema.
    }
}

/**
 * Sobe um serviço e repassa a saída dele com um prefixo colorido.
 * @param servico Serviço a ser iniciado.
 * @returns Processo criado.
 */
function iniciarServico(servico) {
    const processo = spawn("npm", ["run", "dev"], {
        cwd: path.join(RAIZ, servico.pasta),
        shell: true,
        stdio: ["ignore", "pipe", "pipe"],
    });

    const prefixo = `${servico.cor}[${servico.nome}]${RESET_COR} `;
    processo.stdout.on("data", (dados) => escreverComPrefixo(prefixo, dados, process.stdout));
    processo.stderr.on("data", (dados) => escreverComPrefixo(prefixo, dados, process.stderr));
    processo.on("exit", (codigo) => console.log(`${prefixo}encerrado com código ${codigo}`));

    return processo;
}

/**
 * Escreve a saída de um serviço com o prefixo do seu nome.
 * @param prefixo Prefixo colorido do serviço.
 * @param dados Bloco de saída recebido.
 * @param destino Fluxo de saída do terminal.
 * @returns Nada.
 */
function escreverComPrefixo(prefixo, dados, destino) {
    String(dados)
        .split("\n")
        .filter((linha) => linha.trim())
        .forEach((linha) => destino.write(`${prefixo}${linha}\n`));
}

/**
 * Encerra os processos filhos, inclusive os netos criados pelo npm no Windows.
 * @param processos Processos iniciados.
 * @returns Nada.
 */
function encerrar(processos) {
    processos.forEach((processo) => {
        if (processo.exitCode !== null || !processo.pid)
            return;

        if (EH_WINDOWS)
            spawn("taskkill", ["/pid", String(processo.pid), "/t", "/f"], { stdio: "ignore", shell: true });
        else
            processo.kill("SIGTERM");
    });
}

if (!dependenciasInstaladas())
    process.exit(1);

avisarEnvAusente();

liberarPorta(lerPortaDoBackend(), "backend");
liberarPorta(PORTA_PADRAO.frontend, "frontend");

const processos = SERVICOS.map(iniciarServico);

process.on("SIGINT", () => {
    encerrar(processos);
    process.exit(0);
});
