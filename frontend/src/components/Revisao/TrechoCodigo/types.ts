import { ErroTrecho, TrechoCodigo } from "src/api/Revisao/types";

/** Propriedades aceitas pelo bloco de trecho de código. */
export interface PropriedadesTrechoCodigo {
    trecho: TrechoCodigo | null;
    erro: ErroTrecho | null;
}

/** Quantos caracteres do commit são exibidos no cabeçalho do bloco. */
export const TAMANHO_REF_CURTA = 8;

/** Textos fixos exibidos no bloco de código. */
export const TEXTO_TRECHO = {
    INDISPONIVEL: "Trecho de código indisponível.",
    LINHAS: "linhas",
    COMMIT: "commit",
    INTERVALO: "–",
    SEPARADOR: " · ",
} as const;
