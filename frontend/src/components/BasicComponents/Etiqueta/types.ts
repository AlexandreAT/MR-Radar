import { ReactNode } from "react";

/** Cores disponíveis para a etiqueta. */
export enum TomEtiqueta {
    Neutro = "neutro",
    Aberto = "aberto",
    Resolvido = "resolvido",
    Alerta = "alerta",
}

/** Propriedades aceitas pela etiqueta. */
export interface PropriedadesEtiqueta {
    children: ReactNode;
    tom?: TomEtiqueta;
}
