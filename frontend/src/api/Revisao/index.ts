import { GetJson } from "src/services";
import {
    ConfiguracaoDashboard,
    EscopoMergeRequest,
    ListaMergeRequestsAbertos,
    PaginaArquivosAlterados,
    PaginaMergeRequestsEncerrados,
    ParametrosBuscaRevisao,
    ResultadoPesquisaMergeRequests,
    RevisaoMergeRequest,
} from "./types";

/**
 * Busca a configuração do backend, sem o token.
 * @returns URL do provedor, valores padrão da tela e problemas de configuração.
 */
export async function GetConfiguracaoDashboard(): Promise<ConfiguracaoDashboard> {
    return GetJson<ConfiguracaoDashboard>("/configuracao");
}

/**
 * Busca os Merge Requests abertos do usuário dono do token.
 * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Merge Requests abertos, do mais recente para o mais antigo.
 */
export async function GetMeusMergeRequests(escopo: EscopoMergeRequest, sinal?: AbortSignal): Promise<ListaMergeRequestsAbertos> {
    return GetJson<ListaMergeRequestsAbertos>("/merge-requests", { escopo }, sinal);
}

/**
 * Pesquisa Merge Requests abertos pelo título, entre todos os que o token enxerga — não só os
 * criados ou atribuídos ao dono do token.
 * @param termo Texto pesquisado no título.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Merge Requests encontrados, do mais recente para o mais antigo.
 */
export async function BuscarMergeRequests(termo: string, sinal?: AbortSignal): Promise<ResultadoPesquisaMergeRequests> {
    return GetJson<ResultadoPesquisaMergeRequests>("/merge-requests/pesquisar", { termo }, sinal);
}

/**
 * Busca os Merge Requests encerrados (fechados ou mesclados) do usuário dono do token, com
 * paginação real.
 * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
 * @param pagina Página pedida, a partir de 1.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Página de Merge Requests encerrados, do mais recente para o mais antigo.
 */
export async function GetMeusMergeRequestsEncerrados(escopo: EscopoMergeRequest, pagina: number, sinal?: AbortSignal): Promise<PaginaMergeRequestsEncerrados> {
    return GetJson<PaginaMergeRequestsEncerrados>("/merge-requests/encerrados", { escopo, pagina: String(pagina) }, sinal);
}

/**
 * Pesquisa Merge Requests encerrados (fechados ou mesclados) pelo título, entre todos os que o
 * token enxerga, com paginação real.
 * @param termo Texto pesquisado no título.
 * @param pagina Página pedida, a partir de 1.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Página de Merge Requests encontrados, do mais recente para o mais antigo.
 */
export async function BuscarMergeRequestsEncerrados(termo: string, pagina: number, sinal?: AbortSignal): Promise<PaginaMergeRequestsEncerrados> {
    return GetJson<PaginaMergeRequestsEncerrados>("/merge-requests/encerrados/pesquisar", { termo, pagina: String(pagina) }, sinal);
}

/**
 * Busca os comentários de revisão de um Merge Request.
 * @param parametros Projeto, Merge Request e filtros escolhidos na tela.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Merge Request, contagem por situação e comentários já com o trecho de código.
 */
export async function GetComentariosRevisao(parametros: ParametrosBuscaRevisao, sinal?: AbortSignal): Promise<RevisaoMergeRequest> {
    const caminho = `/merge-request/${encodeURIComponent(parametros.projetoId)}/${encodeURIComponent(parametros.mrIid)}/open-discussions`;

    return GetJson<RevisaoMergeRequest>(caminho, { status: parametros.status }, sinal);
}

/**
 * Busca uma página dos arquivos alterados de um Merge Request.
 * @param projetoId Identificador do projeto/repositório.
 * @param mrIid Identificador do Merge Request dentro do projeto.
 * @param pagina Página desejada, a partir de 1.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Arquivos da página e indicação de próxima página/total, quando o provedor informa.
 */
export async function GetArquivosAlterados(projetoId: string, mrIid: string, pagina: number, sinal?: AbortSignal): Promise<PaginaArquivosAlterados> {
    const caminho = `/merge-request/${encodeURIComponent(projetoId)}/${encodeURIComponent(mrIid)}/arquivos-alterados`;

    return GetJson<PaginaArquivosAlterados>(caminho, { pagina: String(pagina) }, sinal);
}
