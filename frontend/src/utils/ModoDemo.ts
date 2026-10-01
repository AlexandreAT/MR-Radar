import { DiaDeHoras, DiaUtil, HorasPorIssueNoDia, IssueComHoras, ResumoHorasSemana } from "src/api/Horas/types";
import { GetDataDeHojeLocal } from "./Elegibilidade";

/**
 * Indica se o build atual é o modo demo (vitrine pública, com fixtures estáticas em vez de um
 * backend de verdade). Única fonte de verdade da flag — usada tanto pelo desvio de fetch quanto
 * pela tela de Horas, que trava a navegação de semana neste modo.
 */
export const EH_MODO_DEMO: boolean = import.meta.env.VITE_MODO_DEMO === "true";

/** Dia de horas com data relativa (dia da semana), em vez de data absoluta. */
interface DiaHorasRelativo {
    dia: DiaUtil;
    horas: number;
    completo: boolean;
    porIssue: HorasPorIssueNoDia[];
    temComentario: boolean;
}

/** Issue com horas, cujos dias de commit são dias da semana, não datas absolutas. */
interface IssueHorasRelativo {
    projetoId: string;
    caminhoProjeto: string;
    iid: number;
    titulo: string;
    url: string;
    estado: string;
    atualizadoEm: string;
    horasNaSemana: number;
    horasTotais: number;
    diasComCommit: DiaUtil[];
}

/**
 * Formato gravado no fixture estático de Horas: a mesma forma de `ResumoHorasSemana`, mas sem
 * nenhum campo de data absoluta — só dias da semana. `scripts/gerar-fixtures-demo.ts` grava neste
 * formato (removendo as datas reais do dia em que as fixtures foram geradas); esta tela devolve
 * para o formato real, calculado a partir da data de hoje de quem está vendo a demonstração.
 */
export interface ResumoHorasRelativo {
    horasPorDia: DiaHorasRelativo[];
    horasLancadas: number;
    horasEsperadas: number;
    horasFaltando: number;
    horasPorDiaEsperadas: number;
    horasNoFimDeSemana: number;
    issues: IssueHorasRelativo[];
    paginacaoTruncada: boolean;
}

/**
 * Soma (ou subtrai) dias a uma data, no fuso local do navegador.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @param dias Quantidade de dias a somar, podendo ser negativa.
 * @returns Nova data no formato AAAA-MM-DD.
 */
function somarDiasLocal(dataIso: string, dias: number): string {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const data = new Date(ano, mes - 1, dia + dias);

    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

/**
 * Descobre a segunda-feira da semana em que a data cai, no fuso local do navegador.
 * @param dataIso Data no formato AAAA-MM-DD.
 * @returns Data da segunda-feira, no formato AAAA-MM-DD.
 */
function getSegundaDaSemanaLocal(dataIso: string): string {
    const [ano, mes, dia] = dataIso.split("-").map(Number);
    const diaDaSemana: number = new Date(ano, mes - 1, dia).getDay();
    const diasDesdeSegunda: number = diaDaSemana === 0 ? 6 : diaDaSemana - 1;

    return somarDiasLocal(dataIso, -diasDesdeSegunda);
}

/** Dias úteis, na ordem do calendário, usados para calcular a data real de cada um. */
const ORDEM_DIA_UTIL: DiaUtil[] = [DiaUtil.Segunda, DiaUtil.Terca, DiaUtil.Quarta, DiaUtil.Quinta, DiaUtil.Sexta];

/**
 * Resolve o fixture estático de Horas (com dias da semana, sem data nenhuma) para a semana real de
 * quem está vendo a demonstração — "hoje" e os dias de commit sempre caem certo, não importa
 * quando a vitrine for visitada.
 * @param bruto Fixture lido do arquivo estático.
 * @returns Resumo pronto, no mesmo formato que o backend devolveria para a semana atual.
 */
export function ResolverDatasDemoHoras(bruto: ResumoHorasRelativo): ResumoHorasSemana {
    const hoje: string = GetDataDeHojeLocal();
    const inicioSemana: string = getSegundaDaSemanaLocal(hoje);
    const dataPorDiaUtil = new Map<DiaUtil, string>(ORDEM_DIA_UTIL.map((diaUtil, indice) => [diaUtil, somarDiasLocal(inicioSemana, indice)]));

    const horasPorDia: DiaDeHoras[] = bruto.horasPorDia.map((dia) => {
        const data: string = dataPorDiaUtil.get(dia.dia) ?? inicioSemana;

        return { ...dia, data, hoje: data === hoje };
    });

    const issues: IssueComHoras[] = bruto.issues.map((issue) => ({
        ...issue,
        diasComCommit: issue.diasComCommit.map((dia) => dataPorDiaUtil.get(dia) ?? inicioSemana),
    }));

    return {
        inicioSemana,
        fimSemana: somarDiasLocal(inicioSemana, ORDEM_DIA_UTIL.length - 1),
        semanaAnterior: somarDiasLocal(inicioSemana, -7),
        semanaSeguinte: somarDiasLocal(inicioSemana, 7),
        ehSemanaAtual: true,
        horasPorDia,
        horasLancadas: bruto.horasLancadas,
        horasEsperadas: bruto.horasEsperadas,
        horasFaltando: bruto.horasFaltando,
        horasPorDiaEsperadas: bruto.horasPorDiaEsperadas,
        horasNoFimDeSemana: bruto.horasNoFimDeSemana,
        issues,
        consultadoEm: new Date().toISOString(),
        paginacaoTruncada: bruto.paginacaoTruncada,
    };
}
