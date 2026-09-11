import { Request, Response, Router } from "express";
import { ConfiguracaoApp, LIMITE } from "../configuracao/types";
import { GarantirConfiguracaoValida, ValidarConfiguracao } from "../configuracao/Configuracao";
import { CodigoErroProvedor, ErroProvedor } from "../integracao/ErroProvedor";
import { LogicaMergeRequest } from "../logica/LogicaMergeRequest";
import { LogicaRevisao } from "../logica/LogicaRevisao";
import {
    ConfiguracaoDashboard,
    EscopoMergeRequest,
    ListaMergeRequestsAbertos,
    PaginaArquivosAlterados,
    ParametrosConsultaRevisao,
    ResultadoPesquisaMergeRequests,
    RevisaoMergeRequest,
    StatusFiltro,
} from "../models/Revisao/types";
import { Envolver } from "../utilidades/Assincrono";
import { GetTermosProvedor, TermosProvedor } from "../utilidades/TermosProvedor";
import { StatusHttp } from "../utilidades/types";

/** Formato aceito para o identificador do projeto: ID numérico ou caminho do repositório. */
const PROJETO_VALIDO = /^[A-Za-z0-9._\-/]{1,200}$/;

/** Formato aceito para o número do item de revisão (IID do Merge Request, Number do Pull Request). */
const MR_IID_VALIDO = /^\d{1,10}$/;

/** Nomes dos parâmetros aceitos na query string. */
enum ParametroConsulta {
    Status = "status",
    LinhasContexto = "contexto",
    Escopo = "escopo",
    Pagina = "pagina",
    Termo = "termo",
}

/** Primeira página aceita ao listar os arquivos alterados. */
const PRIMEIRA_PAGINA = 1;

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
        "/merge-requests/pesquisar",
        Envolver(async (requisicao: Request, resposta: Response) => {
            GarantirConfiguracaoValida(configuracao);

            const resultado: ResultadoPesquisaMergeRequests = await logicaMergeRequest.Buscar(lerTermo(requisicao, configuracao));

            resposta.json(resultado);
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

    rotas.get(
        "/merge-request/:projectId/:mrIid/arquivos-alterados",
        Envolver(async (requisicao: Request, resposta: Response) => {
            GarantirConfiguracaoValida(configuracao);

            const { projetoId, mrIid } = lerIdentificadores(requisicao, configuracao);
            const pagina: PaginaArquivosAlterados = await logicaRevisao.GetArquivosAlterados(projetoId, mrIid, lerPagina(requisicao));

            resposta.json(pagina);
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
        provedor: configuracao.provedor,
        urlProvedor: configuracao.urlBase,
        tokenConfigurado: Boolean(configuracao.token),
        linhasContexto: configuracao.linhasContexto,
        somenteLeitura: true,
        problemas: ValidarConfiguracao(configuracao),
    };
}

/** Projeto e Merge Request identificados na URL, já validados. */
interface Identificadores {
    projetoId: string;
    mrIid: string;
}

/**
 * Lê e valida o projeto e o Merge Request identificados na URL da rota.
 * Compartilhada por toda rota que recebe :projectId/:mrIid, para não repetir a validação.
 * @param requisicao Requisição recebida.
 * @param configuracao Configuração da aplicação, usada para os termos do provedor ativo.
 * @returns Projeto e Merge Request já validados.
 */
function lerIdentificadores(requisicao: Request, configuracao: ConfiguracaoApp): Identificadores {
    const projetoId: string = String(requisicao.params.projectId ?? "").trim();
    const mrIid: string = String(requisicao.params.mrIid ?? "").trim();
    const termos: TermosProvedor = GetTermosProvedor(configuracao.provedor);

    if (!PROJETO_VALIDO.test(projetoId))
        throw new ErroProvedor(CodigoErroProvedor.ParametroInvalido, `O ${termos.rotuloProjeto} informado não é válido.`, StatusHttp.RequisicaoInvalida, termos.dicaProjeto);

    if (!MR_IID_VALIDO.test(mrIid))
        throw new ErroProvedor(
            CodigoErroProvedor.ParametroInvalido,
            `O ${termos.rotuloNumero} informado não é válido.`,
            StatusHttp.RequisicaoInvalida,
            `Informe apenas o número que aparece na URL do ${termos.nomeItem}.`,
        );

    return { projetoId, mrIid };
}

/**
 * Lê e valida os parâmetros da consulta de comentários.
 * @param requisicao Requisição recebida.
 * @param configuracao Configuração da aplicação, usada para os valores padrão e os termos do provedor ativo.
 * @returns Parâmetros já validados.
 */
function lerParametros(requisicao: Request, configuracao: ConfiguracaoApp): ParametrosConsultaRevisao {
    const { projetoId, mrIid } = lerIdentificadores(requisicao, configuracao);

    return {
        projetoId,
        mrIid,
        status: lerStatus(requisicao),
        linhasContexto: lerLinhasContexto(requisicao, configuracao),
    };
}

/**
 * Lê a página pedida ao listar os arquivos alterados.
 * @param requisicao Requisição recebida.
 * @returns Página pedida, ou a primeira quando o parâmetro faltar ou for inválido.
 */
function lerPagina(requisicao: Request): number {
    const informada: number = Number.parseInt(String(requisicao.query[ParametroConsulta.Pagina] ?? ""), 10);

    return Number.isFinite(informada) && informada >= PRIMEIRA_PAGINA ? informada : PRIMEIRA_PAGINA;
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
 * Lê e valida o termo pesquisado no título dos Merge Requests.
 * @param requisicao Requisição recebida.
 * @param configuracao Configuração da aplicação, usada para os termos do provedor ativo.
 * @returns Termo já validado.
 */
function lerTermo(requisicao: Request, configuracao: ConfiguracaoApp): string {
    const termo: string = String(requisicao.query[ParametroConsulta.Termo] ?? "").trim();
    const termos: TermosProvedor = GetTermosProvedor(configuracao.provedor);

    if (termo.length < LIMITE.TERMO_PESQUISA_MIN_CARACTERES)
        throw new ErroProvedor(
            CodigoErroProvedor.ParametroInvalido,
            `Informe pelo menos ${LIMITE.TERMO_PESQUISA_MIN_CARACTERES} caracteres para pesquisar.`,
            StatusHttp.RequisicaoInvalida,
            `A pesquisa procura no título dos ${termos.nomeItem}s abertos que o token enxerga.`,
        );

    return termo;
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
