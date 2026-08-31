import { IssueComHoras, NivelElegibilidade } from "src/api/Horas/types";

/** Textos fixos exibidos na lista de chamados. */
export const TEXTO_LISTA_ISSUES = {
    TITULO: "Chamados no seu nome",
    NA_SEMANA: "na semana",
    TOTAL: "no chamado",
    VAZIA: "Nenhum chamado seu foi movimentado nesta semana.",
    ATUALIZADO_EM: "Atualizado em",
} as const;

/** Situação que o GitLab devolve quando o chamado já foi fechado. */
export const ESTADO_FECHADO = "closed";

/** Texto exibido na etiqueta de um chamado fechado. */
export const ROTULO_FECHADO = "Fechado";

/**
 * Texto do marcador discreto de elegibilidade, exibido como dica ao passar o mouse.
 * Sem entrada para SemCommit: nesse caso nenhum marcador é desenhado.
 */
export const TEXTO_POR_ELEGIBILIDADE: Partial<Record<NivelElegibilidade, string>> = {
    [NivelElegibilidade.CommitouHoje]: "Você commitou neste chamado hoje",
    [NivelElegibilidade.CommitouNaSemana]: "Você commitou neste chamado nesta semana",
};

/** Propriedades aceitas pela lista de chamados com horas. */
export interface PropriedadesListaIssuesHoras {
    issues: IssueComHoras[];
}
