import { Request, Response, Router } from "express";
import { GarantirConfiguracaoValida } from "../configuracao/Configuracao";
import { ConfiguracaoApp } from "../configuracao/types";
import { ErroGitLab } from "../integracao/gitlab/ErroGitLab";
import { CodigoErroGitLab } from "../integracao/gitlab/types";
import { LogicaHoras } from "../logica/LogicaHoras";
import { ResumoHorasSemana } from "../models/Horas/types";
import { Envolver } from "../utilidades/Assincrono";
import { DATA_ISO_VALIDA } from "../utilidades/Semana";
import { StatusHttp } from "../utilidades/types";

/** Nomes dos parâmetros aceitos na query string. */
enum ParametroConsulta {
    Semana = "semana",
}

/**
 * Registra a rota de horas lançadas por semana.
 * @param logicaHoras Lógica que reúne as horas das issues do usuário.
 * @param configuracao Configuração da aplicação.
 * @returns Router do Express com a rota pronta.
 */
export function CriarRotasHoras(logicaHoras: LogicaHoras, configuracao: ConfiguracaoApp): Router {
    const rotas = Router();

    rotas.get(
        "/horas",
        Envolver(async (requisicao: Request, resposta: Response) => {
            GarantirConfiguracaoValida(configuracao);

            const resumo: ResumoHorasSemana = await logicaHoras.GetHorasDaSemana({ semana: lerSemana(requisicao) });

            resposta.json(resumo);
        }),
    );

    return rotas;
}

/**
 * Lê a semana pedida na query string.
 * @param requisicao Requisição recebida.
 * @returns Data dentro da semana desejada, ou texto vazio para a semana atual.
 */
function lerSemana(requisicao: Request): string {
    const valor: string = String(requisicao.query[ParametroConsulta.Semana] ?? "").trim();

    if (!valor)
        return "";

    if (!DATA_ISO_VALIDA.test(valor))
        throw new ErroGitLab(CodigoErroGitLab.ParametroInvalido, "A semana informada não é uma data válida.", StatusHttp.RequisicaoInvalida, "Informe uma data no formato AAAA-MM-DD.");

    return valor;
}
