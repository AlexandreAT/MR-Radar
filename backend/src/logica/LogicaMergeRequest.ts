import { ClienteRevisao } from "../integracao/ClienteRevisao";
import { PaginaResultado } from "../integracao/types";
import { EscopoMergeRequest, ListaMergeRequestsAbertos, MergeRequestAberto, ResultadoPesquisaMergeRequests } from "../models/Revisao/types";

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
}
