import https from "https";
import { ConfiguracaoApp } from "../../configuracao/types";
import { StatusHttp } from "../../utilidades/types";
import { CodigoErroProvedor, ErroProvedor } from "../ErroProvedor";
import { API_GITHUB } from "./types";

/**
 * ÚNICO PONTO DO PROJETO QUE FAZ POST.
 *
 * O resto do backend é somente GET por construção (integracao/http/ExecutarGet.ts fixa o método e
 * não aceita corpo). Esta exceção existe porque o status resolvido/não resolvido de uma thread de
 * review só existe na API GraphQL do GitHub, que aceita apenas POST — mesmo para consulta.
 *
 * O isolamento é proposital e deve ser mantido:
 *   1. Este arquivo NÃO importa o transporte compartilhado, e monta o POST sozinho — assim nenhum
 *      outro caminho do app ganha, por tabela, a capacidade de enviar corpo.
 *   2. Não existe função genérica aqui: a única exportada resolve UMA pergunta e não aceita texto
 *      de consulta como parâmetro. Uma segunda operação exigiria escrever outra função inteira,
 *      o que passa por revisão, em vez de acrescentar um valor a um enum.
 *   3. O texto da consulta é constante deste módulo, e é conferido antes de sair (ver GUARDA).
 *
 * Nada fora de integracao/github/ deve importar este arquivo.
 */

/** Consulta de leitura, fixa. Nenhum texto vindo de fora entra nela. */
const CONSULTA_STATUS_RESOLUCAO = `
query($dono: String!, $nome: String!, $numero: Int!, $porPagina: Int!, $comentariosPorThread: Int!, $cursor: String) {
  repository(owner: $dono, name: $nome) {
    pullRequest(number: $numero) {
      reviewThreads(first: $porPagina, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          isResolved
          comments(first: $comentariosPorThread) { nodes { databaseId } }
        }
      }
    }
  }
}`;

/** Palavra que jamais pode aparecer na consulta: é a marca de uma operação de escrita. */
const GUARDA_OPERACAO_DE_ESCRITA = /\bmutation\b/i;

/** Endereço da API GraphQL no github.com público. */
const GRAPHQL_PUBLICO = "https://api.github.com/graphql";

/** Sufixo da API REST no GitHub Enterprise Server, trocado pelo do GraphQL. */
const SUFIXO_REST_ENTERPRISE = "/api/v3";

/** Sufixo da API GraphQL no GitHub Enterprise Server. */
const SUFIXO_GRAPHQL_ENTERPRISE = "/api/graphql";

/** Quantas threads são pedidas por página. */
const THREADS_POR_PAGINA = 100;

/**
 * Quantos comentários de cada thread são lidos. Todos os ids são necessários: o dashboard
 * descarta comentários de bot, então a thread dele pode estar chaveada por qualquer um deles,
 * e não necessariamente pelo primeiro que o GitHub devolve.
 */
const COMENTARIOS_POR_THREAD = 100;

/** Teto de páginas lidas, para uma consulta nunca virar um laço sem fim. */
const MAX_PAGINAS_GRAPHQL = 20;

/** Nó de thread como o GraphQL devolve. */
interface ThreadGraphQL {
    isResolved: boolean;
    comments: { nodes: { databaseId: number | null }[] };
}

/** Resposta da consulta de status de resolução. */
interface RespostaGraphQL {
    data?: {
        repository?: {
            pullRequest?: {
                reviewThreads?: {
                    pageInfo: { hasNextPage: boolean; endCursor: string | null };
                    nodes: ThreadGraphQL[];
                };
            } | null;
        } | null;
    };
    errors?: { message?: string }[];
}

/**
 * Descobre quais threads de review de um Pull Request estão resolvidas.
 *
 * O resultado é indexado pelo id REST de CADA comentário da thread, e não só pelo primeiro: o
 * ConversorGitHub descarta comentários de bot, então a thread dele costuma ficar chaveada por uma
 * resposta humana, e não pelo comentário que abriu a conversa.
 * @param configuracao Configuração da aplicação, de onde saem token, URL e tempo limite.
 * @param dono Dono do repositório.
 * @param nome Nome do repositório.
 * @param numero Número do Pull Request.
 * @returns Mapa de id de comentário para "a thread dele está resolvida".
 */
export async function GetStatusResolucaoDasThreads(configuracao: ConfiguracaoApp, dono: string, nome: string, numero: number): Promise<Map<number, boolean>> {
    const porComentarioRaiz = new Map<number, boolean>();
    let cursor: string | null = null;

    for (let pagina = 0; pagina < MAX_PAGINAS_GRAPHQL; pagina += 1) {
        const resposta: RespostaGraphQL = await consultar(configuracao, { dono, nome, numero, porPagina: THREADS_POR_PAGINA, comentariosPorThread: COMENTARIOS_POR_THREAD, cursor });
        const threads = resposta.data?.repository?.pullRequest?.reviewThreads;

        if (!threads)
            return porComentarioRaiz;

        threads.nodes.forEach((thread) => {
            (thread.comments?.nodes ?? []).forEach((comentario) => {
                if (comentario.databaseId !== null && comentario.databaseId !== undefined)
                    porComentarioRaiz.set(comentario.databaseId, thread.isResolved);
            });
        });

        if (!threads.pageInfo.hasNextPage)
            return porComentarioRaiz;

        cursor = threads.pageInfo.endCursor;
    }

    return porComentarioRaiz;
}

/**
 * Envia a consulta fixa e devolve o corpo já convertido.
 * @param configuracao Configuração da aplicação.
 * @param variaveis Variáveis da consulta.
 * @returns Corpo da resposta do GraphQL.
 */
function consultar(configuracao: ConfiguracaoApp, variaveis: Record<string, string | number | null>): Promise<RespostaGraphQL> {
    // Cinto e suspensório: a consulta é constante deste módulo, mas se algum dia alguém editar o
    // texto para incluir uma operação de escrita, a chamada morre aqui em vez de sair pela rede.
    if (GUARDA_OPERACAO_DE_ESCRITA.test(CONSULTA_STATUS_RESOLUCAO))
        throw new ErroProvedor(CodigoErroProvedor.ConfiguracaoInvalida, "A consulta de status de resolução não é somente leitura.", StatusHttp.ErroInterno);

    const corpo: string = JSON.stringify({ query: CONSULTA_STATUS_RESOLUCAO, variables: variaveis });

    return new Promise<RespostaGraphQL>((resolver, rejeitar) => {
        const requisicao = https.request(
            new URL(getUrlGraphQL(configuracao.urlBase)),
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${configuracao.token}`,
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(corpo),
                    "User-Agent": API_GITHUB.USER_AGENT,
                },
            },
            (resposta) => {
                const partes: Buffer[] = [];

                resposta.on("data", (parte: Buffer) => partes.push(parte));
                resposta.on("end", () => {
                    const texto: string = Buffer.concat(partes).toString("utf8");

                    if ((resposta.statusCode ?? 0) >= StatusHttp.RequisicaoInvalida) {
                        rejeitar(new ErroProvedor(CodigoErroProvedor.RespostaInesperada, "O GitHub recusou a consulta de status de resolução.", StatusHttp.GatewayInvalido));
                        return;
                    }

                    try {
                        resolver(JSON.parse(texto) as RespostaGraphQL);
                    } catch {
                        rejeitar(new ErroProvedor(CodigoErroProvedor.RespostaInesperada, "O GitHub devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido));
                    }
                });
            },
        );

        requisicao.setTimeout(configuracao.timeoutRequisicaoMs, () => {
            requisicao.destroy(new ErroProvedor(CodigoErroProvedor.TempoEsgotado, "O GitHub não respondeu a tempo.", StatusHttp.TempoEsgotado));
        });

        requisicao.on("error", (erro: Error) => rejeitar(erro instanceof ErroProvedor ? erro : new ErroProvedor(CodigoErroProvedor.FalhaRede, "Não foi possível consultar o status de resolução.", StatusHttp.GatewayInvalido)));
        requisicao.write(corpo);
        requisicao.end();
    });
}

/**
 * Descobre o endereço do GraphQL a partir da URL base da API REST.
 * @param urlBase URL base da API REST do provedor.
 * @returns Endereço do GraphQL.
 */
function getUrlGraphQL(urlBase: string): string {
    if (!urlBase.endsWith(SUFIXO_REST_ENTERPRISE))
        return GRAPHQL_PUBLICO;

    return urlBase.slice(0, -SUFIXO_REST_ENTERPRISE.length) + SUFIXO_GRAPHQL_ENTERPRISE;
}
