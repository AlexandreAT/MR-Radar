import { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Encaminha erros de rotas assíncronas para o tratador de erros do Express.
 * Sem isso, uma Promise rejeitada deixaria a requisição pendurada.
 * @param rota Função da rota que devolve uma Promise.
 * @returns Rota pronta para ser registrada no Express.
 */
export function Envolver(rota: (requisicao: Request, resposta: Response) => Promise<void>): RequestHandler {
    return (requisicao: Request, resposta: Response, proximo: NextFunction) => {
        rota(requisicao, resposta).catch(proximo);
    };
}
