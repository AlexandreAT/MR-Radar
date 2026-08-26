import { ConfiguracaoApp } from "../configuracao/types";
import { ClienteGitLab } from "../integracao/gitlab/ClienteGitLab";
import { MergeRequestGitLab } from "../integracao/gitlab/types";
import { ComentarioRevisao, ParametrosConsultaRevisao, RevisaoMergeRequest } from "../models/Revisao/types";
import { MapearComLimite } from "../utilidades/Colecoes";
import { ConverterMergeRequest, ConverterParaComentario, FiltrarPorStatus, GetContagem, NormalizarDiscussoes, OrdenarComentarios } from "./LogicaComentario";
import { LogicaTrechoCodigo } from "./LogicaTrechoCodigo";
import { DiscussaoNormalizada, ResultadoTrecho } from "./types";

/** Reúne os dados de revisão de um Merge Request para exibição no dashboard. */
export class LogicaRevisao {
    private readonly cliente: ClienteGitLab;
    private readonly logicaTrechoCodigo: LogicaTrechoCodigo;
    private readonly configuracao: ConfiguracaoApp;

    /**
     * @param cliente Cliente somente leitura da API do GitLab.
     * @param logicaTrechoCodigo Responsável por montar o trecho de código de cada comentário.
     * @param configuracao Configuração da aplicação.
     */
    constructor(cliente: ClienteGitLab, logicaTrechoCodigo: LogicaTrechoCodigo, configuracao: ConfiguracaoApp) {
        this.cliente = cliente;
        this.logicaTrechoCodigo = logicaTrechoCodigo;
        this.configuracao = configuracao;
    }

    /**
     * Busca os comentários de revisão de um Merge Request, já com o trecho de código de cada um.
     * @param parametros Projeto, Merge Request e filtros da consulta.
     * @returns Merge Request, contagem por situação e comentários ordenados por arquivo e linha.
     */
    public async GetRevisao(parametros: ParametrosConsultaRevisao): Promise<RevisaoMergeRequest> {
        const [mergeRequest, paginaDiscussoes] = await Promise.all([
            this.cliente.GetMergeRequest(parametros.projetoId, parametros.mrIid),
            this.cliente.GetDiscussoes(parametros.projetoId, parametros.mrIid),
        ]);

        const normalizadas: DiscussaoNormalizada[] = NormalizarDiscussoes(paginaDiscussoes.itens, this.configuracao.autoresIgnorados);
        const selecionadas: DiscussaoNormalizada[] = FiltrarPorStatus(normalizadas, parametros.status);
        const comentarios: ComentarioRevisao[] = await this.montarComentarios(selecionadas, parametros, mergeRequest);

        return {
            mergeRequest: ConverterMergeRequest(mergeRequest),
            contagem: GetContagem(normalizadas),
            comentarios: OrdenarComentarios(comentarios),
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: paginaDiscussoes.truncada,
        };
    }

    /**
     * Busca o trecho de código de cada thread e monta os comentários exibidos na tela.
     * @param selecionadas Threads que passaram pelo filtro de status.
     * @param parametros Parâmetros da consulta em andamento.
     * @param mergeRequest Merge Request devolvido pelo GitLab.
     * @returns Comentários prontos para o frontend.
     */
    private async montarComentarios(selecionadas: DiscussaoNormalizada[], parametros: ParametrosConsultaRevisao, mergeRequest: MergeRequestGitLab): Promise<ComentarioRevisao[]> {
        const trechos: ResultadoTrecho[] = await MapearComLimite(selecionadas, this.configuracao.consultasSimultaneas, (normalizada) =>
            this.logicaTrechoCodigo.GetTrecho(parametros.projetoId, normalizada.posicao, parametros.linhasContexto),
        );

        return selecionadas.map((normalizada, indice) => ConverterParaComentario(normalizada, mergeRequest.web_url, trechos[indice]));
    }
}
