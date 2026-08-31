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

/**
 * Nível de confiança de que as horas lançadas na issue correspondem a trabalho de verdade,
 * conforme o dono do token tenha ou não commitado nela. Do menos para o mais forte.
 */
export enum NivelElegibilidade {
    SemCommit = "sem_commit",
    CommitouNaSemana = "commitou_na_semana",
    CommitouHoje = "commitou_hoje",
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
    elegibilidade: NivelElegibilidade;
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

/** Parâmetros aceitos na consulta de horas da semana. */
export interface ParametrosConsultaHoras {
    semana: string;
}
