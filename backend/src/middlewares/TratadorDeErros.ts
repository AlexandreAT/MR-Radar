import { NextFunction, Request, Response } from "express";
import { ErroGitLab } from "../integracao/gitlab/ErroGitLab";
import { CodigoErroGitLab } from "../integracao/gitlab/types";
import { StatusHttp } from "../utilidades/types";

/**
 * Responde à rota inexistente com a mesma estrutura de erro das demais rotas.
 * @param requisicao Requisição recebida.
 * @param resposta Resposta em construção.
 * @returns Nada.
 */
export function RotaNaoEncontrada(requisicao: Request, resposta: Response): void {
    resposta.status(StatusHttp.NaoEncontrado).json({
        erro: {
            codigo: CodigoErroGitLab.NaoEncontrado,
            mensagem: `O endereço ${requisicao.originalUrl} não existe neste backend.`,
            dica: "",
        },
    });
}

/**
 * Converte qualquer erro em uma resposta JSON com mensagem clara para o usuário.
 * @param erro Erro lançado em alguma rota.
 * @param _requisicao Requisição recebida.
 * @param resposta Resposta em construção.
 * @param _proximo Próximo middleware da cadeia.
 * @returns Nada.
 */
export function TratadorDeErros(erro: unknown, _requisicao: Request, resposta: Response, _proximo: NextFunction): void {
    if (erro instanceof ErroGitLab) {
        resposta.status(erro.statusHttp).json({ erro: { codigo: erro.codigo, mensagem: erro.message, dica: erro.dica } });
        return;
    }

    const mensagem: string = erro instanceof Error ? erro.message : "Erro desconhecido";
    console.error("[mr-radar] Erro inesperado:", erro);

    resposta.status(StatusHttp.ErroInterno).json({
        erro: {
            codigo: CodigoErroGitLab.RespostaInesperada,
            mensagem: "Ocorreu um erro inesperado ao consultar o GitLab.",
            dica: mensagem,
        },
    });
}
