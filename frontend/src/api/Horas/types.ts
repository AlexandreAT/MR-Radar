/** Dia útil exibido no gráfico da semana. Sábado e domingo ficam de fora. */
export enum DiaUtil {
    Segunda = "segunda",
    Terca = "terca",
    Quarta = "quarta",
    Quinta = "quinta",
    Sexta = "sexta",
}

/** Horas lançadas em uma issue dentro de um dia específico, usado no detalhe do gráfico. */
export interface HorasPorIssueNoDia {
    titulo: string;
    horas: number;
}

/** Horas que o usuário lançou em um dia útil. */
export interface DiaDeHoras {
    data: string;
    dia: DiaUtil;
    horas: number;
    completo: boolean;
    hoje: boolean;
    porIssue: HorasPorIssueNoDia[];
}

/** Issue do usuário com as horas que ele lançou na semana consultada. */
export interface IssueComHoras {
    projetoId: string;
    caminhoProjeto: string;
    iid: number;
    titulo: string;
    url: string;
    estado: string;
    atualizadoEm: string;
    horasNaSemana: number;
    horasTotais: number;
    /** Dias (dentro da semana consultada) em que o dono do token commitou nesta issue. */
    diasComCommit: string[];
}

/**
 * Horas lançadas em uma semana de trabalho.
 * horasLancadas soma apenas os dias úteis, e é a base de horasFaltando.
 */
export interface ResumoHorasSemana {
    inicioSemana: string;
    fimSemana: string;
    semanaAnterior: string;
    semanaSeguinte: string;
    ehSemanaAtual: boolean;
    horasPorDia: DiaDeHoras[];
    horasLancadas: number;
    horasEsperadas: number;
    horasFaltando: number;
    horasPorDiaEsperadas: number;
    horasNoFimDeSemana: number;
    issues: IssueComHoras[];
    consultadoEm: string;
    paginacaoTruncada: boolean;
}
