import { ConfiguracaoDashboard } from "src/api/Revisao/types";

/** Textos fixos exibidos na página de horas. */
export const TEXTO_HORAS = {
    TITULO: "Horas da semana",
    SUBTITULO: "Horas que você lançou nos chamados que estão no seu nome.",
    SEMANA_ANTERIOR: "‹ Semana anterior",
    SEMANA_SEGUINTE: "Próxima semana ›",
    ATUALIZAR: "Atualizar",
    CARREGANDO: "Carregando...",
    ATE: "a",
    LANCADAS: "lançadas",
    ESPERADAS: "esperadas",
    FALTANDO: "faltando",
    SEMANA_FECHADA: "semana fechada",
    FIM_DE_SEMANA: "no fim de semana, fora da conta",
    ERRO: "Não foi possível carregar as horas da semana.",
    SEM_CONFIGURACAO: "As suas horas aparecem aqui quando o backend estiver configurado.",
    SEM_RESUMO: "Nenhuma semana carregada.",
    TRUNCADA: "Havia mais páginas do que o limite configurado. Aumente MAX_PAGES no arquivo .env.",
} as const;

/** Propriedades aceitas pela página de horas. */
export interface PropriedadesPainelHoras {
    configuracao: ConfiguracaoDashboard | null;
}
