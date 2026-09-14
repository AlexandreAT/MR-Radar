import { ReactNode } from "react";

/** Cores disponíveis para a etiqueta. */
export enum TomEtiqueta {
    Neutro = "neutro",
    Aberto = "aberto",
    Resolvido = "resolvido",
    EmAndamento = "em_andamento",
    Alerta = "alerta",
    Issue = "issue",
    Suggestion = "suggestion",
    Nit = "nit",
    Question = "question",
    Praise = "praise",
}

/** Propriedades aceitas pela etiqueta. */
export interface PropriedadesEtiqueta {
    children: ReactNode;
    tom?: TomEtiqueta;
    selecionada?: boolean;
}
