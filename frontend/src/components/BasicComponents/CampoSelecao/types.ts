/** Opção exibida em um campo de seleção. */
export interface OpcaoSelecao {
    valor: string | number;
    rotulo: string;
}

/** Propriedades aceitas pelo campo de seleção. */
export interface PropriedadesCampoSelecao {
    rotulo: string;
    valor: string | number;
    opcoes: OpcaoSelecao[];
    onChange: (valor: string) => void;
    largura?: string;
}

/** Largura usada quando nenhuma é informada. */
export const LARGURA_PADRAO = "150px";
