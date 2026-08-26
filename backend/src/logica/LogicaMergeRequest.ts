import { ClienteGitLab } from "../integracao/gitlab/ClienteGitLab";
import { EscopoGitLab, MergeRequestListaGitLab, PaginaGitLab } from "../integracao/gitlab/types";
import { EscopoMergeRequest, ListaMergeRequestsAbertos, MergeRequestAberto } from "../models/Revisao/types";
import { ConverterAutor } from "./LogicaComentario";

/** Escopo da API do GitLab correspondente a cada escopo exibido na tela. */
const ESCOPO_GITLAB: Record<EscopoMergeRequest, EscopoGitLab> = {
    [EscopoMergeRequest.CriadosPorMim]: EscopoGitLab.CriadosPorMim,
    [EscopoMergeRequest.AtribuidosAMim]: EscopoGitLab.AtribuidosAMim,
};

/** Separador entre o caminho do projeto e o IID na referência do GitLab. */
const SEPARADOR_REFERENCIA = "!";

/** Monta a lista de Merge Requests abertos que o usuário vê ao abrir o dashboard. */
export class LogicaMergeRequest {
    private readonly cliente: ClienteGitLab;

    /**
     * @param cliente Cliente somente leitura da API do GitLab.
     */
    constructor(cliente: ClienteGitLab) {
        this.cliente = cliente;
    }

    /**
     * Lista os Merge Requests abertos do usuário dono do token.
     * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
     * @returns Merge Requests já no formato usado pela tela, do mais recente para o mais antigo.
     */
    public async GetAbertos(escopo: EscopoMergeRequest): Promise<ListaMergeRequestsAbertos> {
        const pagina: PaginaGitLab<MergeRequestListaGitLab> = await this.cliente.GetMergeRequestsAbertos(ESCOPO_GITLAB[escopo]);

        return {
            escopo,
            mergeRequests: pagina.itens.map(converterMergeRequestAberto),
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: pagina.truncada,
        };
    }
}

/**
 * Converte um Merge Request da listagem do GitLab para o formato da tela.
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Merge Request pronto para o seletor.
 */
function converterMergeRequestAberto(mergeRequest: MergeRequestListaGitLab): MergeRequestAberto {
    return {
        projetoId: String(mergeRequest.project_id),
        caminhoProjeto: getCaminhoProjeto(mergeRequest),
        iid: mergeRequest.iid,
        titulo: mergeRequest.title,
        url: mergeRequest.web_url,
        rascunho: mergeRequest.draft ?? mergeRequest.work_in_progress ?? false,
        branchOrigem: mergeRequest.source_branch,
        branchDestino: mergeRequest.target_branch,
        atualizadoEm: mergeRequest.updated_at,
        autor: ConverterAutor(mergeRequest.author),
        temThreadsAbertas: getTemThreadsAbertas(mergeRequest),
        totalComentarios: mergeRequest.user_notes_count ?? 0,
    };
}

/**
 * Lê o caminho do projeto a partir da referência completa, como "grupo/projeto!123".
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Caminho do projeto ou o ID numérico quando a referência não vier.
 */
function getCaminhoProjeto(mergeRequest: MergeRequestListaGitLab): string {
    const referenciaCompleta: string = mergeRequest.references?.full ?? "";

    return referenciaCompleta.split(SEPARADOR_REFERENCIA)[0] || String(mergeRequest.project_id);
}

/**
 * Indica se o Merge Request ainda tem threads de revisão sem resolver.
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Verdadeiro, falso, ou nulo quando a instância do GitLab não informa esse dado.
 */
function getTemThreadsAbertas(mergeRequest: MergeRequestListaGitLab): boolean | null {
    const resolvidas: boolean | null | undefined = mergeRequest.blocking_discussions_resolved;

    return resolvidas === undefined || resolvidas === null ? null : !resolvidas;
}
