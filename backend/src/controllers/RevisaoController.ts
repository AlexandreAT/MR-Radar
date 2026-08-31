import { Request, Response, Router } from "express";
import { ConfiguracaoApp, LIMITE } from "../configuracao/types";
import { GarantirConfiguracaoValida, ValidarConfiguracao } from "../configuracao/Configuracao";
import { ErroGitLab } from "../integracao/gitlab/ErroGitLab";
import { CodigoErroGitLab } from "../integracao/gitlab/types";
import { LogicaMergeRequest } from "../logica/LogicaMergeRequest";
import { LogicaRevisao } from "../logica/LogicaRevisao";
import { ConfiguracaoDashboard, EscopoMergeRequest, ListaMergeRequestsAbertos, ParametrosConsultaRevisao, RevisaoMergeRequest, StatusFiltro } from "../models/Revisao/types";
import { Envolver } from "../utilidades/Assincrono";
import { StatusHttp } from "../utilidades/types";

/** Formato aceito para o identificador do projeto: ID numérico ou caminho do repositório. */
const PROJETO_VALIDO = /^[A-Za-z0-9._\-/]{1,200}$/;

/** Formato aceito para o IID do Merge Request. */
const MR_IID_VALIDO = /^\d{1,10}$/;

/** Nomes dos parâmetros aceitos na query string. */
enum ParametroConsulta {
    Status = "status",
    LinhasContexto = "contexto",
    Escopo = "escopo",
}

/**
 * Registra as rotas de consulta de revisão.
 * @param logicaRevisao Lógica que monta os dados de revisão de um Merge Request.
 * @param logicaMergeRequest Lógica que lista os Merge Requests abertos do usuário.
 * @param configuracao Configuração da aplicação.
 * @returns Router do Express com as rotas prontas.
 */
export function CriarRotasRevisao(logicaRevisao: LogicaRevisao, logicaMergeRequest: LogicaMergeRequest, configuracao: ConfiguracaoApp): Router {
    const rotas = Router();

    rotas.get("/configuracao", (_requisicao: Request, resposta: Response) => {
        resposta.json(montarConfiguracaoDashboard(configuracao));
    });

    rotas.get(
        "/merge-requests",
        Envolver(async (requisicao: Request, resposta: Response) => {
            GarantirConfiguracaoValida(configuracao);

            const lista: ListaMergeRequestsAbertos = await logicaMergeRequest.GetAbertos(lerEscopo(requisicao));

            resposta.json(lista);
        }),
    );

    rotas.get(
        "/merge-request/:projectId/:mrIid/open-discussions",
        Envolver(async (requisicao: Request, resposta: Response) => {
            GarantirConfiguracaoValida(configuracao);

            const parametros: ParametrosConsultaRevisao = lerParametros(requisicao, configuracao);
            const revisao: RevisaoMergeRequest = await logicaRevisao.GetRevisao(parametros);

            resposta.json(revisao);
        }),
    );

    return rotas;
}

/**
 * Monta os dados de configuração que o frontend precisa conhecer, sem expor o token.
 * @param configuracao Configuração da aplicação.
 * @returns Configuração enxuta para a tela.
 */
function montarConfiguracaoDashboard(configuracao: ConfiguracaoApp): ConfiguracaoDashboard {
    return {
        urlGitLab: configuracao.urlGitLab,
        tokenConfigurado: Boolean(configuracao.token),
        linhasContexto: configuracao.linhasContexto,
        somenteLeitura: true,
        problemas: ValidarConfiguracao(configuracao),
    };
}

/**
 * Lê e valida os parâmetros da consulta de comentários.
 * @param requisicao Requisição recebida.
 * @param configuracao Configuração da aplicação, usada para os valores padrão.
 * @returns Parâmetros já validados.
 */
function lerParametros(requisicao: Request, configuracao: ConfiguracaoApp): ParametrosConsultaRevisao {
    const projetoId: string = String(requisicao.params.projectId ?? "").trim();
    const mrIid: string = String(requisicao.params.mrIid ?? "").trim();

    if (!PROJETO_VALIDO.test(projetoId))
        throw new ErroGitLab(CodigoErroGitLab.ParametroInvalido, "O Project ID informado não é válido.", StatusHttp.RequisicaoInvalida, "Use o ID numérico do projeto ou o caminho completo, como grupo/subgrupo/projeto.");

    if (!MR_IID_VALIDO.test(mrIid))
        throw new ErroGitLab(CodigoErroGitLab.ParametroInvalido, "O IID do Merge Request informado não é válido.", StatusHttp.RequisicaoInvalida, "Informe apenas o número que aparece na URL do Merge Request.");

    return {
        projetoId,
        mrIid,
        status: lerStatus(requisicao),
        linhasContexto: lerLinhasContexto(requisicao, configuracao),
    };
}

/**
 * Lê o filtro de status da query string.
 * @param requisicao Requisição recebida.
 * @returns Status pedido ou o filtro de comentários abertos.
 */
function lerStatus(requisicao: Request): StatusFiltro {
    const valor = String(requisicao.query[ParametroConsulta.Status] ?? "");
    const statusValidos: string[] = Object.values(StatusFiltro);

    return statusValidos.includes(valor) ? (valor as StatusFiltro) : StatusFiltro.Abertos;
}

/**
 * Lê de quem são os Merge Requests que devem ser listados.
 * @param requisicao Requisição recebida.
 * @returns Escopo pedido ou os Merge Requests criados pelo próprio usuário.
 */
function lerEscopo(requisicao: Request): EscopoMergeRequest {
    const valor = String(requisicao.query[ParametroConsulta.Escopo] ?? "");
    const escoposValidos: string[] = Object.values(EscopoMergeRequest);

    return escoposValidos.includes(valor) ? (valor as EscopoMergeRequest) : EscopoMergeRequest.CriadosPorMim;
}

/**
 * Lê quantas linhas de contexto devem ser exibidas em volta da linha comentada.
 * @param requisicao Requisição recebida.
 * @param configuracao Configuração da aplicação, usada como valor padrão.
 * @returns Quantidade de linhas de contexto.
 */
function lerLinhasContexto(requisicao: Request, configuracao: ConfiguracaoApp): number {
    const informado: number = Number.parseInt(String(requisicao.query[ParametroConsulta.LinhasContexto] ?? ""), 10);

    if (!Number.isFinite(informado))
        return configuracao.linhasContexto;

    return Math.min(Math.max(informado, 0), LIMITE.LINHAS_CONTEXTO_MAX);
}
