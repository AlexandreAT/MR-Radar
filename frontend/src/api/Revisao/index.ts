import { GetJson } from "src/services";
import { ConfiguracaoDashboard, EscopoMergeRequest, ListaMergeRequestsAbertos, ParametrosBuscaRevisao, RevisaoMergeRequest } from "./types";

/**
 * Busca a configuração do backend, sem o token.
 * @returns URL do GitLab, valores padrão da tela e problemas de configuração.
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
 * Busca os comentários de revisão de um Merge Request.
 * @param parametros Projeto, Merge Request e filtros escolhidos na tela.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Merge Request, contagem por situação e comentários já com o trecho de código.
 */
export async function GetComentariosRevisao(parametros: ParametrosBuscaRevisao, sinal?: AbortSignal): Promise<RevisaoMergeRequest> {
    const caminho = `/merge-request/${encodeURIComponent(parametros.projetoId)}/${encodeURIComponent(parametros.mrIid)}/open-discussions`;

    return GetJson<RevisaoMergeRequest>(caminho, { status: parametros.status }, sinal);
}
