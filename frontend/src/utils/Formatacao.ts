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

/** Minutos em uma hora, usados para converter horas fracionadas em horas e minutos. */
const MINUTOS_POR_HORA = 60;

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
 * @param nomeItem Como o provedor ativo chama o item (Merge Request ou Pull Request).
 * @returns Arquivo com a linha, apenas o arquivo, ou o aviso de comentário geral.
 */
export function FormatarLocal(caminhoArquivo: string | null, linha: number | null, nomeItem: string): string {
    if (!caminhoArquivo)
        return `Comentário geral do ${nomeItem}`;

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
 * Formata uma quantidade de horas para exibição no formato de relógio (ex.: 4:30h em vez de 4,5h).
 * @param horas Quantidade de horas, podendo ter fração (ex.: 4.5).
 * @returns Horas e minutos separados por ":", com o sufixo "h".
 */
export function FormatarHoras(horas: number): string {
    const totalMinutos: number = Math.round(horas * MINUTOS_POR_HORA);
    const horasInteiras: number = Math.floor(totalMinutos / MINUTOS_POR_HORA);
    const minutos: number = totalMinutos % MINUTOS_POR_HORA;

    return `${horasInteiras}:${String(minutos).padStart(2, "0")}h`;
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
