/** Caminho base das rotas do backend local. */
export const CAMINHO_BASE_API = "/api";

/** Código usado quando o backend não responde ou responde algo inesperado. */
export const CODIGO_ERRO_COMUNICACAO = "FALHA_COMUNICACAO";

/** Nome que o navegador dá ao erro de requisição cancelada. */
export const NOME_ERRO_CANCELAMENTO = "AbortError";

/** Mensagens produzidas pelo próprio serviço, quando o erro não vem do backend. */
export const MENSAGEM_SERVICO = {
    SEM_BACKEND: "Não foi possível falar com o backend local.",
    DICA_SEM_BACKEND: "Confirme se o backend está rodando com npm run dev.",
} as const;

/** Estrutura de erro devolvida pelo backend. */
export interface RespostaErroApi {
    erro?: {
        codigo?: string;
        mensagem?: string;
        dica?: string;
    };
}
