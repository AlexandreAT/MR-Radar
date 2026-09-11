import { NextFunction, Request, Response } from "express";
import { CodigoErroProvedor } from "../integracao/ErroProvedor";
import { StatusHttp } from "../utilidades/types";

/** Métodos HTTP aceitos pelo backend, que é somente leitura. */
const METODOS_PERMITIDOS: string[] = ["GET", "HEAD", "OPTIONS"];

/** Origens locais autorizadas a chamar o backend pelo navegador. */
const ORIGEM_LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|mr-radar\.local)(:\d+)?$/;

/**
 * Bloqueia qualquer método que não seja de leitura.
 *
 * Este middleware protege o que ENTRA no backend: nenhum POST vindo do navegador é aceito. Ele
 * não tem relação com o que o backend envia PARA FORA — esse outro perímetro é somente GET por
 * construção (integracao/http/ExecutarGet.ts), com uma única exceção declarada e isolada em
 * integracao/github/ExecutarGraphQLStatusResolucao.ts.
 * @param requisicao Requisição recebida.
 * @param resposta Resposta em construção.
 * @param proximo Próximo middleware da cadeia.
 * @returns Nada. Responde com 405 quando o método não é permitido.
 */
export function SomenteLeitura(requisicao: Request, resposta: Response, proximo: NextFunction): void {
    if (METODOS_PERMITIDOS.includes(requisicao.method)) {
        proximo();
        return;
    }

    resposta.status(StatusHttp.MetodoNaoPermitido).json({
        erro: {
            codigo: CodigoErroProvedor.ParametroInvalido,
            mensagem: "Este dashboard é somente leitura e aceita apenas consultas.",
            dica: "Nenhuma alteração pode ser feita no provedor por aqui.",
        },
    });
}

/**
 * Libera o acesso do frontend local ao backend, sem abrir para outras origens.
 * @param requisicao Requisição recebida.
 * @param resposta Resposta em construção.
 * @param proximo Próximo middleware da cadeia.
 * @returns Nada.
 */
export function LiberarOrigemLocal(requisicao: Request, resposta: Response, proximo: NextFunction): void {
    const origem: string | undefined = requisicao.headers.origin;

    if (origem && ORIGEM_LOCAL.test(origem)) {
        resposta.setHeader("Access-Control-Allow-Origin", origem);
        resposta.setHeader("Vary", "Origin");
        resposta.setHeader("Access-Control-Allow-Methods", METODOS_PERMITIDOS.join(", "));
    }

    proximo();
}
