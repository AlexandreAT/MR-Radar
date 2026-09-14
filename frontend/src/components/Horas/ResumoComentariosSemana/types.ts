import { DiaDeHoras } from "src/api/Horas/types";

/** Textos fixos exibidos no resumo. */
export const TEXTO_RESUMO_COMENTARIOS = {
    TITULO: "Comentário de status por dia",
} as const;

/** Propriedades aceitas pelo resumo de comentários da semana. */
export interface PropriedadesResumoComentariosSemana {
    horasPorDia: DiaDeHoras[];
}
