import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

/**
 * Sobe o backend e o frontend juntos, sem depender de nenhum pacote extra.
 * Encerra os dois quando o terminal recebe Ctrl+C.
 */

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EH_WINDOWS = process.platform === "win32";

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

const processos = SERVICOS.map(iniciarServico);

process.on("SIGINT", () => {
    encerrar(processos);
    process.exit(0);
});
