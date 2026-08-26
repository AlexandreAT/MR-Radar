import { ReactNode } from "react";

/** Estilos disponíveis para o botão. */
export enum VarianteBotao {
    Primario = "primario",
    Secundario = "secundario",
}

/** Propriedades aceitas pelo botão. */
export interface PropriedadesBotao {
    children: ReactNode;
    onClick: () => void;
    variante?: VarianteBotao;
    desabilitado?: boolean;
}
