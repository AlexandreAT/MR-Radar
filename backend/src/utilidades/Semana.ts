/** Milissegundos em um dia, usado para andar no calendário sem depender de fuso horário. */
const MILISSEGUNDOS_POR_DIA = 86400000;

/** Quantidade de caracteres de uma data no formato AAAA-MM-DD. */
const TAMANHO_DATA_ISO = 10;

/** Formato aceito para uma data simples. */
export const DATA_ISO_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

/** Dias da semana como o JavaScript numera, de domingo a sábado. */
export enum DiaDaSemana {
    Domingo = 0,
    Segunda = 1,
    Terca = 2,
    Quarta = 3,
    Quinta = 4,
    Sexta = 5,
    Sabado = 6,
}

/**
 * Descobre a data de hoje no fuso da máquina.
 * Não usa toISOString porque ela converte para UTC e adiantaria o dia em fusos negativos.
 * @returns Data de hoje no formato AAAA-MM-DD.
 */
export function GetDataDeHoje(): string {
    return GetDataLocal(new Date());
}

/**
 * Descobre em que dia do calendário local um instante caiu.
 * O GitLab devolve os horários com o fuso da instância, mas nem toda versão faz isso: quando vem
 * em UTC, cortar o texto jogaria o fim da tarde para o dia seguinte.
 * @param instante Momento a converter.
 * @returns Data no formato AAAA-MM-DD, ou texto vazio quando o instante é inválido.
 */
export function GetDataLocal(instante: Date): string {
    if (Number.isNaN(instante.getTime()))
        return "";

    const mes: string = String(instante.getMonth() + 1).padStart(2, "0");
    const dia: string = String(instante.getDate()).padStart(2, "0");

    return `${instante.getFullYear()}-${mes}-${dia}`;
}

/**
 * Soma (ou subtrai) dias a uma data, sem sofrer com horário de verão nem com fuso.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @param dias Quantidade de dias a somar, podendo ser negativa.
 * @returns Nova data no formato AAAA-MM-DD.
 */
export function SomarDias(dataIso: string, dias: number): string {
    const deslocada = new Date(converterParaUtc(dataIso).getTime() + dias * MILISSEGUNDOS_POR_DIA);

    return deslocada.toISOString().slice(0, TAMANHO_DATA_ISO);
}

/**
 * Descobre em que dia da semana uma data cai.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @returns Dia da semana correspondente.
 */
export function GetDiaDaSemana(dataIso: string): DiaDaSemana {
    return converterParaUtc(dataIso).getUTCDay() as DiaDaSemana;
}

/**
 * Descobre a segunda-feira da semana em que a data cai. Domingo pertence à semana que terminou.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @returns Data da segunda-feira, no formato AAAA-MM-DD.
 */
export function GetSegundaDaSemana(dataIso: string): string {
    const dia: DiaDaSemana = GetDiaDaSemana(dataIso);
    const diasDesdeSegunda: number = dia === DiaDaSemana.Domingo ? 6 : dia - DiaDaSemana.Segunda;

    return SomarDias(dataIso, -diasDesdeSegunda);
}

/**
 * Interpreta a data como meia-noite UTC, para que as contas de calendário não mudem o dia.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @returns Data em UTC.
 */
function converterParaUtc(dataIso: string): Date {
    const [ano, mes, dia] = dataIso.slice(0, TAMANHO_DATA_ISO).split("-").map(Number);

    return new Date(Date.UTC(ano, mes - 1, dia));
}
