import { GetDataLocal } from "./Semana";

/** Horas de um dia de trabalho, como o GitLab converte a unidade "d" por padrão. */
export const HORAS_POR_DIA_UTIL = 8;

/** Dias úteis considerados em uma semana de trabalho. */
export const DIAS_UTEIS_POR_SEMANA = 5;

/** Quantas horas vale cada unidade aceita pelo GitLab no lançamento de tempo. */
const HORAS_POR_UNIDADE: Record<string, number> = {
    mo: HORAS_POR_DIA_UTIL * DIAS_UTEIS_POR_SEMANA * 4,
    w: HORAS_POR_DIA_UTIL * DIAS_UTEIS_POR_SEMANA,
    d: HORAS_POR_DIA_UTIL,
    h: 1,
    m: 1 / 60,
    s: 1 / 3600,
};

/** Cada parcela de uma duração escrita pelo GitLab, como "1h 30m". */
const PARCELA_DURACAO = /(\d+(?:[.,]\d+)?)\s*(mo|w|d|h|m|s)\b/gi;

/** Nota de tempo somado ou subtraído, com a data opcional escrita pelo autor. */
const NOTA_TEMPO_LANCADO = /^(added|subtracted)\s+(.+?)\s+of time spent(?:\s+at\s+(\d{4}-\d{2}-\d{2}))?/i;

/** Nota de um lançamento apagado depois, que sempre traz a data do lançamento original. */
const NOTA_TEMPO_APAGADO = /^deleted\s+(.+?)\s+of spent time from\s+(\d{4}-\d{2}-\d{2})/i;

/** Nota que zera todo o tempo já lançado na issue. */
const NOTA_TEMPO_ZERADO = /^removed time spent/i;

/** O que uma nota de sistema representa para a contagem de horas. */
export enum TipoNotaTempo {
    Lancamento = "lancamento",
    Zeramento = "zeramento",
    Irrelevante = "irrelevante",
}

/** Nota de sistema já interpretada. */
export interface NotaTempoInterpretada {
    tipo: TipoNotaTempo;
    data: string;
    horas: number;
}

/** Resultado usado quando a nota não fala de tempo gasto. */
const NOTA_IRRELEVANTE: NotaTempoInterpretada = { tipo: TipoNotaTempo.Irrelevante, data: "", horas: 0 };

/**
 * Interpreta uma nota de sistema do GitLab que fala de tempo gasto.
 *
 * O GitLab não expõe os lançamentos de tempo em nenhum endpoint REST — só em GraphQL, que exige
 * POST — então as horas por dia são lidas dessas notas. Notas de estimativa ("changed time
 * estimate to ...") não entram: elas não são tempo gasto.
 * @param corpo Texto da nota de sistema.
 * @param criadoEm Data em que a nota foi escrita, usada quando o autor não informou a data.
 * @returns Tipo da nota, data do lançamento e horas (negativas quando o tempo foi retirado).
 */
export function InterpretarNotaDeTempo(corpo: string | null | undefined, criadoEm: string): NotaTempoInterpretada {
    const texto: string = (corpo ?? "").trim();

    if (NOTA_TEMPO_ZERADO.test(texto))
        return { tipo: TipoNotaTempo.Zeramento, data: "", horas: 0 };

    const apagado: RegExpMatchArray | null = texto.match(NOTA_TEMPO_APAGADO);

    if (apagado)
        return montarLancamento(apagado[1], apagado[2], true);

    const lancado: RegExpMatchArray | null = texto.match(NOTA_TEMPO_LANCADO);

    if (!lancado)
        return NOTA_IRRELEVANTE;

    const data: string = lancado[3] ?? GetDataLocal(new Date(criadoEm));

    return montarLancamento(lancado[2], data, lancado[1].toLowerCase() === "subtracted");
}

/**
 * Monta o lançamento a partir da duração escrita na nota.
 * @param duracao Trecho da nota com a duração, como "1h 30m".
 * @param data Data do lançamento no formato AAAA-MM-DD.
 * @param retirada Indica se o tempo saiu da contagem em vez de entrar.
 * @returns Lançamento interpretado, ou nota irrelevante quando a duração não pôde ser lida.
 */
function montarLancamento(duracao: string, data: string, retirada: boolean): NotaTempoInterpretada {
    const horas: number | null = converterDuracaoEmHoras(duracao);

    if (horas === null)
        return NOTA_IRRELEVANTE;

    return { tipo: TipoNotaTempo.Lancamento, data, horas: retirada ? -horas : horas };
}

/**
 * Converte uma duração escrita pelo GitLab em horas.
 * @param duracao Texto da duração, como "1d", "7h 30m" ou "45m".
 * @returns Total em horas, ou nulo quando o texto não tem nenhuma parcela reconhecível.
 */
function converterDuracaoEmHoras(duracao: string): number | null {
    let horas = 0;
    let reconheceuAlgumaParcela = false;

    for (const parcela of duracao.matchAll(PARCELA_DURACAO)) {
        const quantidade: number = Number(parcela[1].replace(",", "."));
        const emHoras: number | undefined = HORAS_POR_UNIDADE[parcela[2].toLowerCase()];

        if (!Number.isFinite(quantidade) || emHoras === undefined)
            continue;

        horas += quantidade * emHoras;
        reconheceuAlgumaParcela = true;
    }

    return reconheceuAlgumaParcela ? horas : null;
}
