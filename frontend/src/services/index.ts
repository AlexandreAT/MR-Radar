import { EH_MODO_DEMO } from "src/utils/ModoDemo";
import { ErroApi } from "./ErroApi";
import { BuscarFixtureDemo } from "./ModoDemo";
import { CAMINHO_BASE_API, CODIGO_ERRO_COMUNICACAO, MensagemErro, MENSAGEM_SERVICO, NOME_ERRO_CANCELAMENTO, RespostaErroApi } from "./types";

/**
 * Faz uma consulta GET no backend local e devolve o conteúdo já convertido. No modo demo (vitrine
 * pública, build estática) não existe backend nenhum — a consulta é desviada para uma fixture
 * estática, com o mesmo formato de resposta.
 * @param caminho Caminho da rota, sem o prefixo /api.
 * @param parametros Parâmetros de query string.
 * @param sinal Sinal usado para cancelar a requisição.
 * @returns Conteúdo da resposta.
 */
export async function GetJson<T>(caminho: string, parametros: Record<string, string> = {}, sinal?: AbortSignal): Promise<T> {
    if (EH_MODO_DEMO)
        return BuscarFixtureDemo<T>(caminho, parametros);

    const query: string = new URLSearchParams(parametros).toString();
    const url = `${CAMINHO_BASE_API}${caminho}${query ? `?${query}` : ""}`;
    const resposta: Response = await buscar(url, sinal);

    if (!resposta.ok)
        throw await converterRespostaEmErro(resposta);

    return (await resposta.json()) as T;
}

/**
 * Indica se a falha veio do cancelamento de uma requisição.
 * @param falha Erro capturado.
 * @returns Verdadeiro quando a requisição foi cancelada.
 */
export function EhCancelamento(falha: unknown): boolean {
    return falha instanceof DOMException && falha.name === NOME_ERRO_CANCELAMENTO;
}

/**
 * Converte qualquer falha na mensagem que será exibida na tela.
 * @param falha Erro capturado.
 * @param mensagemPadrao Mensagem usada quando o erro não veio do backend.
 * @returns Código, mensagem e dica para o usuário.
 */
export function ConverterErro(falha: unknown, mensagemPadrao: string): MensagemErro {
    if (falha instanceof ErroApi)
        return { codigo: falha.codigo, mensagem: falha.message, dica: falha.dica };

    return {
        codigo: CODIGO_ERRO_COMUNICACAO,
        mensagem: mensagemPadrao,
        dica: falha instanceof Error ? falha.message : "",
    };
}

/**
 * Executa a chamada e converte falhas de rede em um erro com mensagem clara.
 * @param url Endereço completo da rota.
 * @param sinal Sinal usado para cancelar a requisição.
 * @returns Resposta da requisição.
 */
async function buscar(url: string, sinal?: AbortSignal): Promise<Response> {
    try {
        return await fetch(url, { method: "GET", headers: { Accept: "application/json" }, signal: sinal });
    } catch (falha) {
        if (EhCancelamento(falha))
            throw falha;

        throw new ErroApi(MENSAGEM_SERVICO.SEM_BACKEND, CODIGO_ERRO_COMUNICACAO, MENSAGEM_SERVICO.DICA_SEM_BACKEND);
    }
}

/**
 * Converte uma resposta com falha no erro correspondente.
 * @param resposta Resposta devolvida pelo backend.
 * @returns Erro pronto para ser exibido na tela.
 */
async function converterRespostaEmErro(resposta: Response): Promise<ErroApi> {
    const conteudo: RespostaErroApi = await resposta.json().catch(() => ({}) as RespostaErroApi);
    const mensagem: string = conteudo.erro?.mensagem ?? `O backend respondeu com o status ${resposta.status}.`;

    return new ErroApi(mensagem, conteudo.erro?.codigo ?? CODIGO_ERRO_COMUNICACAO, conteudo.erro?.dica ?? "");
}

export { ErroApi };
