import { ReactNode } from "react";

/** Propriedades aceitas pelo indicador de carregamento. */
export interface PropriedadesCarregando {
    ativo: boolean;
    texto?: ReactNode;
}
