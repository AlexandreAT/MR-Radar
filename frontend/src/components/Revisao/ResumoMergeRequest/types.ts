import { ContagemComentarios, MergeRequestResumo } from "src/api/Revisao/types";

/** Propriedades aceitas pelo resumo do Merge Request. */
export interface PropriedadesResumoMergeRequest {
    mergeRequest: MergeRequestResumo;
    contagem: ContagemComentarios;
    mostrarGerais: boolean;
    podeAlternarGerais: boolean;
    onAlternarGerais: () => void;
}

/** Textos fixos exibidos no resumo. */
export const TEXTO_RESUMO = {
    ABERTOS: "abertos",
    RESOLVIDOS: "resolvidos",
    GERAIS: "gerais",
    TOTAL: "no total",
    LINK_GITLAB: "Abrir o Merge Request",
    SEPARADOR: "·",
    SETA: "→",
    SETA_FECHADA: "▸",
    SETA_ABERTA: "▾",
} as const;
