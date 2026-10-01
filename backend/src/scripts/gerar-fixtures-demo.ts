import { AddressInfo } from "net";
import fs from "fs";
import http from "http";
import path from "path";
import { Express } from "express";
import { criarAplicacao } from "../Aplicacao";
import { CONFIGURACAO_PADRAO, ConfiguracaoApp, LIMITE, Provedor } from "../configuracao/types";
import { DiaUtil } from "../models/Horas/types";

/**
 * Sobe o backend de verdade com o provedor Demo (sem nenhum arquivo .env) numa porta efêmera,
 * grava a resposta de um conjunto fixo e conhecido de consultas como fixtures estáticas em
 * `frontend/public/demo-data/`, e monta o manifesto que o frontend usa para achar cada uma.
 *
 * Roda com `npm run fixtures:demo`, dentro de `backend/`. Não precisa de `.env` nenhum, e nem chega
 * a ler o que existir: `criarAplicacao` vem de `Aplicacao.ts`, que não carrega configuração (só o
 * `index.ts`, ponto de entrada do servidor, faz isso), e o ClienteDemo não lê nenhuma variável de
 * ambiente nem faz chamada de rede.
 */

/** Pasta onde as fixtures estáticas são gravadas. */
const PASTA_DESTINO: string = path.resolve(__dirname, "../../../frontend/public/demo-data");

/** Projeto e Merge Request usados nas consultas fixas desta geração. */
const PROJETO_DEMO = "42";
const MR_DEMO_IID = "7";

/** Uma consulta a ser gravada: caminho, parâmetros e o nome do arquivo de destino. */
interface ConsultaFixture {
    caminho: string;
    parametros: Record<string, string>;
    arquivo: string;
}

/** A lista completa e fixa de consultas que a demonstração precisa suportar. */
const CONSULTAS: ConsultaFixture[] = [
    { caminho: "/configuracao", parametros: {}, arquivo: "configuracao.json" },
    { caminho: "/merge-requests", parametros: { escopo: "criados_por_mim" }, arquivo: "merge-requests-criados.json" },
    { caminho: "/merge-requests", parametros: { escopo: "atribuidos_a_mim" }, arquivo: "merge-requests-atribuidos.json" },
    { caminho: "/merge-requests/pesquisar", parametros: { termo: "relatorios" }, arquivo: "pesquisa-aberto.json" },
    { caminho: "/merge-requests/encerrados", parametros: { escopo: "criados_por_mim", pagina: "1" }, arquivo: "encerrados-criados-p1.json" },
    { caminho: "/merge-requests/encerrados", parametros: { escopo: "criados_por_mim", pagina: "2" }, arquivo: "encerrados-criados-p2.json" },
    { caminho: "/merge-requests/encerrados", parametros: { escopo: "atribuidos_a_mim", pagina: "1" }, arquivo: "encerrados-atribuidos-p1.json" },
    { caminho: "/merge-requests/encerrados/pesquisar", parametros: { termo: "login", pagina: "1" }, arquivo: "pesquisa-encerrado.json" },
    { caminho: `/merge-request/${PROJETO_DEMO}/${MR_DEMO_IID}/open-discussions`, parametros: { status: "abertos" }, arquivo: "discussoes-abertos.json" },
    { caminho: `/merge-request/${PROJETO_DEMO}/${MR_DEMO_IID}/open-discussions`, parametros: { status: "resolvidos" }, arquivo: "discussoes-resolvidos.json" },
    { caminho: `/merge-request/${PROJETO_DEMO}/${MR_DEMO_IID}/open-discussions`, parametros: { status: "todos" }, arquivo: "discussoes-todos.json" },
    { caminho: `/merge-request/${PROJETO_DEMO}/${MR_DEMO_IID}/arquivos-alterados`, parametros: { pagina: "1" }, arquivo: "arquivos-alterados.json" },
    { caminho: "/horas", parametros: {}, arquivo: "horas.json" },
];

/**
 * Faz uma consulta GET simples e devolve o corpo já convertido. Node 16 não tem fetch global —
 * por isso o `http` nativo, do mesmo jeito que o próprio backend já faz.
 * @param url Endereço completo da consulta.
 * @returns Corpo da resposta já convertido.
 */
function getJson(url: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
        http
            .get(url, (resposta) => {
                let corpo = "";

                resposta.on("data", (pedaco: Buffer) => {
                    corpo += pedaco.toString("utf8");
                });
                resposta.on("end", () => {
                    try {
                        resolve(JSON.parse(corpo));
                    } catch (erro) {
                        reject(erro);
                    }
                });
            })
            .on("error", reject);
    });
}

/**
 * Monta a mesma chave que o frontend usa para procurar no manifesto: o caminho mais a query
 * string, com os parâmetros em ordem alfabética.
 * @param caminho Caminho da consulta.
 * @param parametros Parâmetros de query string.
 * @returns Chave estável.
 */
function montarChave(caminho: string, parametros: Record<string, string>): string {
    const query = new URLSearchParams();

    Object.keys(parametros)
        .sort()
        .forEach((chave) => query.set(chave, parametros[chave]));

    const queryTexto: string = query.toString();

    return `${caminho}${queryTexto ? `?${queryTexto}` : ""}`;
}

/**
 * Remove as datas absolutas da resposta de Horas, trocando por dias da semana — a mesma fixture
 * serve para qualquer dia em que a demonstração for visitada. `ResolverDatasDemoHoras`, no
 * frontend, faz o caminho inverso.
 * @param bruto Resposta real de `/api/horas`, capturada agora.
 * @returns Mesma resposta, sem nenhuma data absoluta.
 */
function tornarHorasRelativo(bruto: Record<string, unknown>): unknown {
    const horasPorDia = bruto.horasPorDia as { dia: DiaUtil; data: string; horas: number; completo: boolean; porIssue: unknown; temComentario: boolean }[];
    const issues = bruto.issues as { diasComCommit: string[]; [chave: string]: unknown }[];
    const diaUtilPorData = new Map<string, DiaUtil>(horasPorDia.map((dia) => [dia.data, dia.dia]));

    return {
        horasPorDia: horasPorDia.map((dia) => ({ dia: dia.dia, horas: dia.horas, completo: dia.completo, porIssue: dia.porIssue, temComentario: dia.temComentario })),
        horasLancadas: bruto.horasLancadas,
        horasEsperadas: bruto.horasEsperadas,
        horasFaltando: bruto.horasFaltando,
        horasPorDiaEsperadas: bruto.horasPorDiaEsperadas,
        horasNoFimDeSemana: bruto.horasNoFimDeSemana,
        issues: issues.map((issue) => ({
            ...issue,
            diasComCommit: issue.diasComCommit.map((data) => diaUtilPorData.get(data)).filter((dia): dia is DiaUtil => Boolean(dia)),
        })),
        paginacaoTruncada: bruto.paginacaoTruncada,
    };
}

/**
 * Sobe a aplicação numa porta efêmera e devolve a URL base pronta para consultar.
 * @returns URL base do servidor e a função para encerrá-lo.
 */
async function subirServidorDemo(): Promise<{ urlBase: string; encerrar: () => Promise<void> }> {
    const configuracaoDemo: ConfiguracaoApp = {
        provedor: Provedor.Demo,
        urlBase: "",
        token: "",
        porta: 0,
        host: "127.0.0.1",
        linhasContexto: CONFIGURACAO_PADRAO.LINHAS_CONTEXTO,
        timeoutRequisicaoMs: CONFIGURACAO_PADRAO.TIMEOUT_REQUISICAO_MS,
        maxPaginas: CONFIGURACAO_PADRAO.MAX_PAGINAS,
        tempoCacheArquivoMs: 0,
        tamanhoMaxArquivoBytes: LIMITE.TAMANHO_MAX_ARQUIVO_BYTES,
        consultasSimultaneas: LIMITE.CONSULTAS_SIMULTANEAS,
        arquivosEnvCarregados: [],
        autoresIgnorados: [],
    };

    const aplicacao: Express = criarAplicacao(configuracaoDemo);
    const servidor: http.Server = await new Promise((resolve) => {
        const instancia: http.Server = aplicacao.listen(0, "127.0.0.1", () => resolve(instancia));
    });

    const endereco = servidor.address() as AddressInfo;

    return {
        urlBase: `http://127.0.0.1:${endereco.port}/api`,
        encerrar: () => new Promise((resolve, reject) => servidor.close((erro) => (erro ? reject(erro) : resolve()))),
    };
}

/**
 * Gera todas as fixtures e o manifesto.
 * @returns Nada.
 */
async function gerar(): Promise<void> {
    fs.mkdirSync(PASTA_DESTINO, { recursive: true });

    const { urlBase, encerrar } = await subirServidorDemo();
    const manifesto: Record<string, string> = {};

    try {
        for (const consulta of CONSULTAS) {
            const url = `${urlBase}${consulta.caminho}?${new URLSearchParams(consulta.parametros).toString()}`;
            const corpo: unknown = await getJson(url);
            const pronto: unknown = consulta.caminho === "/horas" ? tornarHorasRelativo(corpo as Record<string, unknown>) : corpo;

            fs.writeFileSync(path.join(PASTA_DESTINO, consulta.arquivo), JSON.stringify(pronto, null, 2));
            manifesto[montarChave(consulta.caminho, consulta.parametros)] = consulta.arquivo;

            console.log(`✓ ${consulta.arquivo}`);
        }

        fs.writeFileSync(path.join(PASTA_DESTINO, "manifest.json"), JSON.stringify(manifesto, null, 2));
        console.log(`✓ manifest.json (${Object.keys(manifesto).length} entradas)`);
    } finally {
        await encerrar();
    }
}

gerar().catch((erro) => {
    console.error("Falha ao gerar as fixtures da demonstração:", erro);
    process.exitCode = 1;
});
