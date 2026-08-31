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

/** Formato usado para exibir uma quantidade de horas. */
const FORMATADOR_HORAS = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

/** Marca de rastreamento de ticket que alguns títulos trazem no começo, entre colchetes. */
const TAG_TICKET = /^\[ticket[^\]]*\]\s*/i;

/**
 * Repetição do número do ticket fora dos colchetes, que alguns títulos ainda trazem depois da tag
 * — por exemplo "Ticket#123 — Título do chamado", já sem o "[...]" tirado antes.
 */
const NUMERO_TICKET_REPETIDO = /^ticket\s*#\s*[0-9a-z]+\s*[-–—:]?\s*/i;

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

/**
 * Formata uma data simples como dia e mês.
 * Não usa Date porque uma data sem horário é lida como UTC e voltaria um dia em fuso negativo.
 * @param data Data no formato AAAA-MM-DD.
 * @returns Data no formato DD/MM, ou texto vazio quando o formato não for reconhecido.
 */
export function FormatarDiaMes(data: string): string {
    const partes: string[] = data.split("-");

    return partes.length === 3 ? partes[2] + "/" + partes[1] : "";
}

/**
 * Formata uma quantidade de horas para exibição.
 * @param horas Quantidade de horas.
 * @returns Horas com no máximo duas casas decimais e o sufixo "h".
 */
export function FormatarHoras(horas: number): string {
    return FORMATADOR_HORAS.format(horas) + "h";
}

/**
 * Remove a tag de rastreamento de ticket do começo do título de um chamado, e a repetição do
 * número dela fora dos colchetes, quando existirem.
 * @param titulo Título como veio do GitLab.
 * @returns Título sem a tag e a repetição, ou o título original quando elas ocupavam o título inteiro.
 */
export function LimparTituloChamado(titulo: string): string {
    const semTag: string = titulo.replace(TAG_TICKET, "").replace(NUMERO_TICKET_REPETIDO, "").trim();

    return semTag || titulo;
}
