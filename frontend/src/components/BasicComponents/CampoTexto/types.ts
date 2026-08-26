/** Propriedades aceitas pelo campo de texto. */
export interface PropriedadesCampoTexto {
    rotulo: string;
    valor: string;
    onChange: (valor: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    largura?: string;
}

/** Largura usada quando nenhuma é informada. */
export const LARGURA_PADRAO = "220px";

/** Tecla que dispara a busca a partir do campo. */
export const TECLA_ENTER = "Enter";
