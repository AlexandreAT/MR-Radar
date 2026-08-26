/** Formato usado para exibir data e hora completas. */
const FORMATADOR_DATA_HORA = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
});

/** Formato usado para exibir apenas o horário. */
const FORMATADOR_HORA = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

/**
 * Formata uma data ISO para o padrão brasileiro com data e hora.
 * @param dataIso Data no formato ISO devolvida pelo backend.
 * @returns Data formatada ou texto vazio quando a data é inválida.
 */
export function FormatarDataHora(dataIso: string): string {
    const data = new Date(dataIso);

    return Number.isNaN(data.getTime()) ? "" : FORMATADOR_DATA_HORA.format(data);
}

/**
 * Formata apenas o horário de uma data.
 * @param data Data a ser formatada.
 * @returns Horário no formato HH:MM:SS.
 */
export function FormatarHora(data: Date): string {
    return FORMATADOR_HORA.format(data);
}

/**
 * Monta o texto que indica onde o comentário foi feito.
 * @param caminhoArquivo Caminho do arquivo no repositório.
 * @param linha Linha comentada.
 * @returns Arquivo com a linha, apenas o arquivo, ou o aviso de comentário geral.
 */
export function FormatarLocal(caminhoArquivo: string | null, linha: number | null): string {
    if (!caminhoArquivo)
        return "Comentário geral do Merge Request";

    return linha ? `${caminhoArquivo}:${linha}` : caminhoArquivo;
}
