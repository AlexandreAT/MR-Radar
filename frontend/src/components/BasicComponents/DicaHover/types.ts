import { ReactNode } from "react";

/** Propriedades aceitas pela dica flutuante. */
export interface PropriedadesDicaHover {
    texto: string;
    children: ReactNode;
}

/** Tempo (ms) que a dica fica visível depois de um toque, para fechar sozinha em telas sem hover. */
export const TEMPO_AUTO_FECHAR_MS = 3000;
