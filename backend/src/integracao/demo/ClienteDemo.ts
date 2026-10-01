import { ConfiguracaoApp, LIMITE } from "../../configuracao/types";
import { DiscussaoNormalizada } from "../../logica/types";
import { EscopoMergeRequest, MergeRequestAberto, MergeRequestResumo, PaginaArquivosAlterados } from "../../models/Revisao/types";
import { PaginarLista } from "../../utilidades/Colecoes";
import { StatusHttp } from "../../utilidades/types";
import { ClienteHoras } from "../ClienteHoras";
import { ClienteRevisao } from "../ClienteRevisao";
import { CodigoErroProvedor, ErroProvedor } from "../ErroProvedor";
import { CommitGitLab, EventoGitLab, IssueGitLab, MergeRequestRelacionadoGitLab, NotaGitLab, UsuarioGitLab } from "../gitlab/types";
import { PaginaNumerada, PaginaResultado } from "../types";
import {
    ARQUIVOS_ALTERADOS,
    ARQUIVOS_FICTICIOS,
    COMMITS_POR_MR,
    DISCUSSOES_MR_ABERTO,
    EVENTOS_DE_COMENTARIO,
    ISSUES_ATRIBUIDAS,
    MR_ABERTO,
    MR_ABERTO_IID,
    MRS_ENCERRADOS_ATRIBUIDOS_A_MIM,
    MRS_ENCERRADOS_CRIADOS_POR_MIM,
    NOTAS_POR_ISSUE,
    PROJETO_DEMO,
    RELACIONADOS_POR_ISSUE,
    RESUMO_MR_ABERTO,
    TERMO_PESQUISA_ABERTO,
    TERMO_PESQUISA_ENCERRADO,
    USUARIO_DEMO,
} from "./fixtures";

/**
 * Adapter de demonstração: implementa `ClienteRevisao` e `ClienteHoras` com dados 100% fictícios,
 * sem nenhuma chamada de rede. Existe para provar que a arquitetura de ports-and-adapters aceita
 * um terceiro provedor sem tocar em nenhuma linha de `logica/`, e para alimentar a vitrine pública
 * do projeto (ver `scripts/gerar-fixtures-demo.ts`).
 */
export class ClienteDemo implements ClienteRevisao, ClienteHoras {
    /**
     * @param _configuracao Configuração da aplicação — recebida só para manter a mesma assinatura
     * dos outros dois adapters; o modo demo não lê nenhum valor dela.
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(_configuracao: ConfiguracaoApp) {}

    /**
     * @inheritdoc
     */
    public async GetMergeRequest(projetoId: string, mrIid: string): Promise<MergeRequestResumo> {
        this.garantirQueEhOMrDemo(projetoId, mrIid);

        return RESUMO_MR_ABERTO;
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetMergeRequestsAbertos(_escopo: EscopoMergeRequest): Promise<PaginaResultado<MergeRequestAberto>> {
        return { itens: [MR_ABERTO], truncada: false };
    }

    /**
     * @inheritdoc
     */
    public async BuscarMergeRequests(termo: string): Promise<PaginaResultado<MergeRequestAberto>> {
        const bate: boolean = termo.toLowerCase().includes(TERMO_PESQUISA_ABERTO) || MR_ABERTO.titulo.toLowerCase().includes(termo.toLowerCase());

        return { itens: bate ? [MR_ABERTO] : [], truncada: false };
    }

    /**
     * @inheritdoc
     */
    public async GetMergeRequestsEncerrados(escopo: EscopoMergeRequest, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>> {
        const todos: MergeRequestAberto[] = escopo === EscopoMergeRequest.CriadosPorMim ? MRS_ENCERRADOS_CRIADOS_POR_MIM : MRS_ENCERRADOS_ATRIBUIDOS_A_MIM;
        const recorte = PaginarLista(todos, pagina, LIMITE.MERGE_REQUESTS_ENCERRADOS_POR_PAGINA);

        return { itens: recorte.itens, pagina: recorte.pagina, totalPaginas: recorte.totalPaginas, totalItens: todos.length, truncada: false };
    }

    /**
     * @inheritdoc
     */
    public async BuscarMergeRequestsEncerrados(termo: string, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>> {
        const termoNormalizado: string = termo.toLowerCase();
        const encontrados: MergeRequestAberto[] = termoNormalizado.includes(TERMO_PESQUISA_ENCERRADO)
            ? MRS_ENCERRADOS_CRIADOS_POR_MIM.filter((mr) => mr.titulo.toLowerCase().includes(TERMO_PESQUISA_ENCERRADO))
            : MRS_ENCERRADOS_CRIADOS_POR_MIM.filter((mr) => mr.titulo.toLowerCase().includes(termoNormalizado));
        const recorte = PaginarLista(encontrados, pagina, LIMITE.MERGE_REQUESTS_ENCERRADOS_POR_PAGINA);

        return { itens: recorte.itens, pagina: recorte.pagina, totalPaginas: recorte.totalPaginas, totalItens: encontrados.length, truncada: false };
    }

    /**
     * @inheritdoc
     */
    public async GetDiscussoes(projetoId: string, mrIid: string): Promise<PaginaResultado<DiscussaoNormalizada>> {
        this.garantirQueEhOMrDemo(projetoId, mrIid);

        return { itens: DISCUSSOES_MR_ABERTO, truncada: false };
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetArquivoBruto(_projetoId: string, caminhoArquivo: string, _ref: string): Promise<string> {
        const conteudo: string | undefined = ARQUIVOS_FICTICIOS[caminhoArquivo];

        if (conteudo === undefined)
            throw new ErroProvedor(CodigoErroProvedor.NaoEncontrado, `O arquivo "${caminhoArquivo}" não foi encontrado nesta demonstração.`, StatusHttp.NaoEncontrado);

        return conteudo;
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetArquivosAlterados(projetoId: string, mrIid: string, _pagina: number): Promise<PaginaArquivosAlterados> {
        this.garantirQueEhOMrDemo(projetoId, mrIid);

        return { itens: ARQUIVOS_ALTERADOS, proximaPagina: null, totalArquivos: ARQUIVOS_ALTERADOS.length };
    }

    /**
     * @inheritdoc
     */
    public async GetUsuarioAtual(): Promise<UsuarioGitLab> {
        return USUARIO_DEMO;
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetIssuesAtribuidas(_atualizadasApos: string): Promise<PaginaResultado<IssueGitLab>> {
        return { itens: ISSUES_ATRIBUIDAS, truncada: false };
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetNotasIssue(_projetoId: number, issueIid: number): Promise<PaginaResultado<NotaGitLab>> {
        return { itens: NOTAS_POR_ISSUE[issueIid] ?? [], truncada: false };
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetMergeRequestsRelacionados(_projetoId: number, issueIid: number): Promise<PaginaResultado<MergeRequestRelacionadoGitLab>> {
        return { itens: RELACIONADOS_POR_ISSUE[issueIid] ?? [], truncada: false };
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetCommitsRecentes(_projetoId: number, mrIid: number, _desde: string): Promise<PaginaResultado<CommitGitLab>> {
        return { itens: COMMITS_POR_MR[mrIid] ?? [], truncada: false };
    }

    /**
     * @inheritdoc
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public async GetEventosDeComentario(_apos: string): Promise<PaginaResultado<EventoGitLab>> {
        return { itens: EVENTOS_DE_COMENTARIO, truncada: false };
    }

    /**
     * Confere se o projeto e o Merge Request pedidos são os da demonstração — qualquer outro
     * valor (alguém digitando manualmente) responde como "não encontrado", igual um provedor real.
     * @param projetoId Projeto informado.
     * @param mrIid Merge Request informado.
     * @returns Nada — lança um erro quando não bate.
     */
    private garantirQueEhOMrDemo(projetoId: string, mrIid: string): void {
        if (projetoId === PROJETO_DEMO && mrIid === String(MR_ABERTO_IID))
            return;

        throw new ErroProvedor(CodigoErroProvedor.NaoEncontrado, "Este Merge Request não existe nesta demonstração.", StatusHttp.NaoEncontrado, "Escolha o Merge Request que já aparece na lista.");
    }
}
