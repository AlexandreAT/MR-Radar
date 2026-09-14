import { ReactNode } from "react";

/**
 * De que lado a dica se alinha ao redor do elemento — por padrão ela fica centralizada, mas isso
 * corta na borda da tela quando o elemento está muito à esquerda ou à direita.
 */
export enum AlinhamentoDica {
    Centro = "centro",
    Esquerda = "esquerda",
    Direita = "direita",
}

/** Propriedades aceitas pela dica flutuante. */
export interface PropriedadesDicaHover {
    texto: string;
    children: ReactNode;
    alinhamento?: AlinhamentoDica;
}

/** Tempo (ms) que a dica fica visível depois de um toque, para fechar sozinha em telas sem hover. */
export const TEMPO_AUTO_FECHAR_MS = 3000;
