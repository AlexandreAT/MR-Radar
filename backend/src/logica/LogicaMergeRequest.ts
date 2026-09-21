import { ClienteRevisao } from "../integracao/ClienteRevisao";
import { PaginaNumerada, PaginaResultado } from "../integracao/types";
import { EscopoMergeRequest, ListaMergeRequestsAbertos, MergeRequestAberto, PaginaMergeRequestsEncerrados, ResultadoPesquisaMergeRequests } from "../models/Revisao/types";

/** Monta a lista de Merge Requests abertos que o usuário vê ao abrir o dashboard. */
export class LogicaMergeRequest {
    private readonly cliente: ClienteRevisao;

    /**
     * @param cliente Cliente somente leitura do provedor configurado.
     */
    constructor(cliente: ClienteRevisao) {
        this.cliente = cliente;
    }

    /**
     * Lista os Merge Requests abertos do usuário dono do token.
     * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
     * @returns Merge Requests já no formato usado pela tela, do mais recente para o mais antigo.
     */
    public async GetAbertos(escopo: EscopoMergeRequest): Promise<ListaMergeRequestsAbertos> {
        const pagina: PaginaResultado<MergeRequestAberto> = await this.cliente.GetMergeRequestsAbertos(escopo);

        return {
            escopo,
            mergeRequests: pagina.itens,
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: pagina.truncada,
        };
    }

    /**
     * Pesquisa Merge Requests abertos pelo título, entre todos os que o token enxerga.
     * @param termo Texto pesquisado no título, já validado como não vazio.
     * @returns Merge Requests encontrados, do mais recente para o mais antigo.
     */
    public async Buscar(termo: string): Promise<ResultadoPesquisaMergeRequests> {
        const pagina: PaginaResultado<MergeRequestAberto> = await this.cliente.BuscarMergeRequests(termo);

        return {
            termo,
            mergeRequests: pagina.itens,
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: pagina.truncada,
        };
    }

    /**
     * Lista os Merge Requests encerrados (fechados ou mesclados) do usuário dono do token.
     * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Merge Requests encerrados, do mais recente para o mais antigo.
     */
    public async GetEncerrados(escopo: EscopoMergeRequest, pagina: number): Promise<PaginaMergeRequestsEncerrados> {
        const resultado: PaginaNumerada<MergeRequestAberto> = await this.cliente.GetMergeRequestsEncerrados(escopo, pagina);

        return montarPaginaEncerrados(resultado);
    }

    /**
     * Pesquisa Merge Requests encerrados (fechados ou mesclados) pelo título, entre todos os que o
     * token enxerga.
     * @param termo Texto pesquisado no título, já validado como não vazio.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Merge Requests encontrados, do mais recente para o mais antigo.
     */
    public async BuscarEncerrados(termo: string, pagina: number): Promise<PaginaMergeRequestsEncerrados> {
        const resultado: PaginaNumerada<MergeRequestAberto> = await this.cliente.BuscarMergeRequestsEncerrados(termo, pagina);

        return montarPaginaEncerrados(resultado);
    }
}

/**
 * Monta a resposta de uma página de Merge Requests encerrados, no formato usado pela tela.
 * @param resultado Página já resolvida pelo cliente do provedor.
 * @returns Página pronta para a tela, com o instante da consulta.
 */
function montarPaginaEncerrados(resultado: PaginaNumerada<MergeRequestAberto>): PaginaMergeRequestsEncerrados {
    return {
        mergeRequests: resultado.itens,
        pagina: resultado.pagina,
        totalPaginas: resultado.totalPaginas,
        totalItens: resultado.totalItens,
        consultadoEm: new Date().toISOString(),
        truncada: resultado.truncada,
    };
}
