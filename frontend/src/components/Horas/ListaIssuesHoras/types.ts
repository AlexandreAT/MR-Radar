import { IssueComHoras } from "src/api/Horas/types";

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

/** Propriedades aceitas pela lista de chamados com horas. */
export interface PropriedadesListaIssuesHoras {
    issues: IssueComHoras[];
    /** Dia usado como referência para o marcador verde: hoje, ou o dia clicado no gráfico. */
    diaReferencia: string;
    /** Indica se o dia de referência é hoje, para o texto da dica do marcador verde. */
    ehHoje: boolean;
}
