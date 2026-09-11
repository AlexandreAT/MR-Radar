import { ConfiguracaoApp } from "../configuracao/types";
import { ClienteRevisao } from "../integracao/ClienteRevisao";
import { ComentarioRevisao, PaginaArquivosAlterados, ParametrosConsultaRevisao, RevisaoMergeRequest } from "../models/Revisao/types";
import { MapearComLimite } from "../utilidades/Colecoes";
import { ConverterParaComentario, FiltrarPorStatus, GetContagem, OrdenarComentarios } from "./LogicaComentario";
import { LogicaTrechoCodigo } from "./LogicaTrechoCodigo";
import { DiscussaoNormalizada, ResultadoTrecho } from "./types";

/** Reúne os dados de revisão de um Merge Request para exibição no dashboard. */
export class LogicaRevisao {
    private readonly cliente: ClienteRevisao;
    private readonly logicaTrechoCodigo: LogicaTrechoCodigo;
    private readonly configuracao: ConfiguracaoApp;

    /**
     * @param cliente Cliente somente leitura do provedor configurado.
     * @param logicaTrechoCodigo Responsável por montar o trecho de código de cada comentário.
     * @param configuracao Configuração da aplicação.
     */
    constructor(cliente: ClienteRevisao, logicaTrechoCodigo: LogicaTrechoCodigo, configuracao: ConfiguracaoApp) {
        this.cliente = cliente;
        this.logicaTrechoCodigo = logicaTrechoCodigo;
        this.configuracao = configuracao;
    }

    /**
     * Busca os comentários de revisão de um Merge Request, já com o trecho de código de cada um.
     * @param parametros Projeto, Merge Request e filtros da consulta.
     * @returns Merge Request, contagem por situação e comentários do mais novo para o mais antigo.
     */
    public async GetRevisao(parametros: ParametrosConsultaRevisao): Promise<RevisaoMergeRequest> {
        const [mergeRequest, paginaDiscussoes] = await Promise.all([
            this.cliente.GetMergeRequest(parametros.projetoId, parametros.mrIid),
            this.cliente.GetDiscussoes(parametros.projetoId, parametros.mrIid),
        ]);

        const selecionadas: DiscussaoNormalizada[] = FiltrarPorStatus(paginaDiscussoes.itens, parametros.status);
        const comentarios: ComentarioRevisao[] = await this.montarComentarios(selecionadas, parametros);

        return {
            mergeRequest,
            contagem: GetContagem(paginaDiscussoes.itens),
            comentarios: OrdenarComentarios(comentarios),
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: paginaDiscussoes.truncada,
            avisos: paginaDiscussoes.avisos,
        };
    }

    /**
     * Busca uma página dos arquivos alterados de um Merge Request.
     * @param projetoId Identificador do projeto/repositório.
     * @param mrIid Identificador do Merge Request dentro do projeto.
     * @param pagina Página desejada, a partir de 1.
     * @returns Arquivos da página e indicação de próxima página/total, quando o provedor informa.
     */
    public async GetArquivosAlterados(projetoId: string, mrIid: string, pagina: number): Promise<PaginaArquivosAlterados> {
        return this.cliente.GetArquivosAlterados(projetoId, mrIid, pagina);
    }

    /**
     * Busca o trecho de código de cada thread e monta os comentários exibidos na tela.
     * @param selecionadas Threads que passaram pelo filtro de status.
     * @param parametros Parâmetros da consulta em andamento.
     * @returns Comentários prontos para o frontend.
     */
    private async montarComentarios(selecionadas: DiscussaoNormalizada[], parametros: ParametrosConsultaRevisao): Promise<ComentarioRevisao[]> {
        const trechos: ResultadoTrecho[] = await MapearComLimite(selecionadas, this.configuracao.consultasSimultaneas, (normalizada) =>
            this.logicaTrechoCodigo.GetTrecho(parametros.projetoId, normalizada.posicao, parametros.linhasContexto),
        );

        return selecionadas.map((normalizada, indice) => ConverterParaComentario(normalizada, trechos[indice]));
    }
}
