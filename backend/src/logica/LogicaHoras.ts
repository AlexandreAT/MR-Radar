import { ConfiguracaoApp } from "../configuracao/types";
import { ClienteHoras } from "../integracao/ClienteHoras";
import { CodigoErroProvedor, ErroProvedor } from "../integracao/ErroProvedor";
import { CommitGitLab, EventoGitLab, IssueGitLab, MergeRequestRelacionadoGitLab, NotaGitLab, TipoNoteableGitLab, UsuarioGitLab } from "../integracao/gitlab/types";
import { PaginaResultado } from "../integracao/types";
import { DiaDeHoras, DiaUtil, HorasPorIssueNoDia, IssueComHoras, ParametrosConsultaHoras, ResumoHorasSemana } from "../models/Horas/types";
import { MapearComLimite } from "../utilidades/Colecoes";
import { DiaDaSemana, GetDataDeHoje, GetDataLocal, GetDiaDaSemana, GetSegundaDaSemana, SomarDias } from "../utilidades/Semana";
import { DIAS_UTEIS_POR_SEMANA, HORAS_POR_DIA_UTIL, InterpretarNotaDeTempo, NotaTempoInterpretada, TipoNotaTempo } from "../utilidades/TempoGasto";
import { HorasDaIssue, LancamentoDeTempo } from "./types";

/** Dia útil correspondente a cada dia da semana do calendário. */
const DIA_UTIL_POR_DIA_DA_SEMANA: Partial<Record<DiaDaSemana, DiaUtil>> = {
    [DiaDaSemana.Segunda]: DiaUtil.Segunda,
    [DiaDaSemana.Terca]: DiaUtil.Terca,
    [DiaDaSemana.Quarta]: DiaUtil.Quarta,
    [DiaDaSemana.Quinta]: DiaUtil.Quinta,
    [DiaDaSemana.Sexta]: DiaUtil.Sexta,
};

/** Separador entre o caminho do projeto e o IID na referência de uma issue. */
const SEPARADOR_REFERENCIA = "#";

/** Casas decimais usadas nas horas exibidas, para não mostrar dízima da conversão de minutos. */
const CASAS_DECIMAIS_HORAS = 2;

/** Segundos em uma hora, usados para converter o total que o GitLab devolve. */
const SEGUNDOS_POR_HORA = 3600;

/** Último dia da semana, contando a partir da segunda-feira. */
const DIAS_ATE_O_DOMINGO = 6;

/** Dias de uma semana inteira, usado para andar de uma semana para a outra. */
const DIAS_NA_SEMANA = 7;

/**
 * Folga aplicada ao filtro de atualização das issues. Cobre o caso de alguém lançar hora com
 * data retroativa antes da semana começar, o que deixaria a issue fora da janela.
 */
const FOLGA_EM_DIAS = 7;

/**
 * Início do dia em UTC usado no filtro de atualização das issues. Em fuso negativo isso pega
 * algumas horas antes da segunda-feira local, o que só amplia a busca e nunca perde issue.
 */
const INICIO_DO_DIA_UTC = "T00:00:00Z";

/**
 * Margem aplicada ao corte de commits antigos, em dias. Existe para nunca parar de paginar cedo
 * demais: em fuso positivo o instante UTC de um commit de segunda de manhã pode cair ainda em
 * domingo, e um dia de folga cobre qualquer fuso real (no máximo ±14h de diferença para UTC).
 */
const MARGEM_FUSO_EM_DIAS = 1;

/** Reúne as horas que o usuário lançou nas issues dele, separadas por dia útil da semana. */
export class LogicaHoras {
    private readonly cliente: ClienteHoras;
    private readonly configuracao: ConfiguracaoApp;

    /**
     * @param cliente Cliente somente leitura que fala a forma bruta do GitLab (GitLab de verdade,
     * ou o adapter de demonstração).
     * @param configuracao Configuração da aplicação.
     */
    constructor(cliente: ClienteHoras, configuracao: ConfiguracaoApp) {
        this.cliente = cliente;
        this.configuracao = configuracao;
    }

    /**
     * Monta o resumo de horas de uma semana de trabalho, de segunda a sexta.
     * @param parametros Semana pedida na tela.
     * @returns Horas por dia útil, total da semana, quanto falta e as issues do usuário.
     */
    public async GetHorasDaSemana(parametros: ParametrosConsultaHoras): Promise<ResumoHorasSemana> {
        const inicioSemana: string = GetSegundaDaSemana(parametros.semana || GetDataDeHoje());
        const fimSemana: string = SomarDias(inicioSemana, DIAS_UTEIS_POR_SEMANA - 1);
        const fimDeSemana: string = SomarDias(inicioSemana, DIAS_ATE_O_DOMINGO);

        const [usuario, paginaIssues] = await Promise.all([
            this.cliente.GetUsuarioAtual(),
            this.cliente.GetIssuesAtribuidas(SomarDias(inicioSemana, -FOLGA_EM_DIAS) + INICIO_DO_DIA_UTC),
        ]);

        // Horas, elegibilidade e comentários vêm de chamadas independentes à API — rodam em
        // paralelo e só se encontram na montagem final da semana.
        const [horasDasIssues, elegibilidade, diasComComentario] = await Promise.all([
            this.getHorasDasIssues(paginaIssues.itens, usuario, inicioSemana, fimSemana, fimDeSemana),
            this.getElegibilidadeDasIssues(paginaIssues.itens, usuario, inicioSemana, fimDeSemana),
            this.getDiasComComentario(inicioSemana, fimSemana),
        ]);

        const horasPorDia: DiaDeHoras[] = montarDiasUteis(inicioSemana, horasDasIssues, diasComComentario.dias);
        const horasLancadas: number = arredondar(horasPorDia.reduce((total, dia) => total + dia.horas, 0));
        const horasEsperadas: number = HORAS_POR_DIA_UTIL * DIAS_UTEIS_POR_SEMANA;

        return {
            inicioSemana,
            fimSemana,
            semanaAnterior: SomarDias(inicioSemana, -DIAS_NA_SEMANA),
            semanaSeguinte: SomarDias(inicioSemana, DIAS_NA_SEMANA),
            ehSemanaAtual: inicioSemana === GetSegundaDaSemana(GetDataDeHoje()),
            horasPorDia,
            horasLancadas,
            horasEsperadas,
            horasFaltando: arredondar(Math.max(0, horasEsperadas - horasLancadas)),
            horasPorDiaEsperadas: HORAS_POR_DIA_UTIL,
            horasNoFimDeSemana: arredondar(horasDasIssues.reduce((total, item) => total + item.horasNoFimDeSemana, 0)),
            issues: horasDasIssues
                .map((item) => converterIssue(item.issue, item.horasNaSemana, elegibilidade.porIssue.get(getChaveIssue(item.issue.project_id, item.issue.iid)) ?? []))
                .sort(compararIssues),
            consultadoEm: new Date().toISOString(),
            paginacaoTruncada: paginaIssues.truncada || horasDasIssues.some((item) => item.paginacaoTruncada) || elegibilidade.paginacaoTruncada || diasComComentario.truncada,
        };
    }

    /**
     * Lê as notas de cada issue e separa os lançamentos de tempo do dono do token.
     * @param issues Issues devolvidas pelo GitLab.
     * @param usuario Usuário dono do token.
     * @param inicioSemana Segunda-feira da semana consultada.
     * @param fimSemana Sexta-feira da semana consultada.
     * @param fimDeSemana Domingo da semana consultada.
     * @returns Uma entrada por issue, com os lançamentos já filtrados.
     */
    private async getHorasDasIssues(
        issues: IssueGitLab[],
        usuario: UsuarioGitLab,
        inicioSemana: string,
        fimSemana: string,
        fimDeSemana: string,
    ): Promise<HorasDaIssue[]> {
        return MapearComLimite(issues, this.configuracao.consultasSimultaneas, async (issue) => {
            const paginaNotas: PaginaResultado<NotaGitLab> = await this.cliente.GetNotasIssue(issue.project_id, issue.iid);
            const lancamentos: LancamentoDeTempo[] = getLancamentosDoUsuario(paginaNotas.itens, usuario.id);
            const naSemana: LancamentoDeTempo[] = lancamentos.filter((lancamento) => lancamento.data >= inicioSemana && lancamento.data <= fimSemana);
            const noFimDeSemana: LancamentoDeTempo[] = lancamentos.filter((lancamento) => lancamento.data > fimSemana && lancamento.data <= fimDeSemana);

            return {
                issue,
                horasNaSemana: somarHoras(naSemana),
                lancamentos: naSemana,
                horasNoFimDeSemana: somarHoras(noFimDeSemana),
                paginacaoTruncada: paginaNotas.truncada,
            };
        });
    }

    /**
     * Descobre, para cada issue, em quais dias da semana o dono do token commitou nela. A tela usa
     * essa lista crua para decidir o marcador (hoje/semana) conforme o dia de referência escolhido,
     * em vez de o backend fixar de antemão qual dia conta como "hoje".
     * O vínculo entre issue e commit passa pelo Merge Request relacionado: a API não devolve
     * commits a partir da issue diretamente.
     * @param issues Issues devolvidas pelo GitLab.
     * @param usuario Usuário dono do token.
     * @param inicioSemana Segunda-feira da semana consultada.
     * @param fimDeSemana Domingo da semana consultada.
     * @returns Dias com commit de cada issue, por chave, e indicação de paginação truncada.
     */
    private async getElegibilidadeDasIssues(
        issues: IssueGitLab[],
        usuario: UsuarioGitLab,
        inicioSemana: string,
        fimDeSemana: string,
    ): Promise<{ porIssue: Map<string, string[]>; paginacaoTruncada: boolean }> {
        const desde: string = SomarDias(inicioSemana, -MARGEM_FUSO_EM_DIAS) + INICIO_DO_DIA_UTC;
        const emailsDoUsuario: Set<string> = new Set([usuario.email, usuario.commit_email].filter((email): email is string => Boolean(email)).map((email) => email.toLowerCase()));

        let paginacaoTruncada = false;

        const pares = await MapearComLimite(issues, this.configuracao.consultasSimultaneas, async (issue) => {
            const chave: string = getChaveIssue(issue.project_id, issue.iid);

            try {
                const relacionados: PaginaResultado<MergeRequestRelacionadoGitLab> = await this.cliente.GetMergeRequestsRelacionados(issue.project_id, issue.iid);

                if (relacionados.truncada)
                    paginacaoTruncada = true;

                const commitsPorMr: PaginaResultado<CommitGitLab>[] = await MapearComLimite(relacionados.itens, this.configuracao.consultasSimultaneas, (mr) =>
                    this.cliente.GetCommitsRecentes(mr.project_id, mr.iid, desde),
                );

                const diasComCommitDoUsuario: string[] = Array.from(
                    new Set(
                        commitsPorMr
                            .flatMap((pagina) => {
                                if (pagina.truncada)
                                    paginacaoTruncada = true;

                                return pagina.itens;
                            })
                            .filter((commit) => emailsDoUsuario.has((commit.author_email ?? "").toLowerCase()))
                            .map((commit) => GetDataLocal(new Date(commit.committed_date)))
                            .filter((data) => data >= inicioSemana && data <= fimDeSemana),
                    ),
                );

                return [chave, diasComCommitDoUsuario] as const;
            } catch (erro) {
                // Token inválido ou sem acesso não é uma falha pontual: repetiria para toda issue e
                // esconderia o problema real atrás de "sem commit" em todas elas. Isso precisa
                // aparecer como erro de verdade, não ser engolido.
                if (erro instanceof ErroProvedor && (erro.codigo === CodigoErroProvedor.TokenInvalido || erro.codigo === CodigoErroProvedor.AcessoNegado))
                    throw erro;

                // O GitLab às vezes devolve erro no endpoint de relacionados para uma issue específica
                // (visto na prática, sem relação com os dados enviados). Uma falha aqui não pode
                // impedir de ver as horas: a issue só fica sem o indicador de commit.
                return [chave, [] as string[]] as const;
            }
        });

        return { porIssue: new Map(pares), paginacaoTruncada };
    }

    /**
     * Descobre em quais dias úteis da semana o dono do token comentou em algum chamado (issue) —
     * um comentário de verdade (não de sistema), em qualquer projeto que o token enxergue.
     * Vem do histórico de atividade do usuário, então não precisa percorrer chamado por chamado
     * procurando comentário.
     * @param inicioSemana Segunda-feira da semana consultada.
     * @param fimSemana Sexta-feira da semana consultada.
     * @returns Dias com comentário, e indicação de paginação truncada.
     */
    private async getDiasComComentario(inicioSemana: string, fimSemana: string): Promise<{ dias: Set<string>; truncada: boolean }> {
        const apos: string = SomarDias(inicioSemana, -MARGEM_FUSO_EM_DIAS);
        const pagina: PaginaResultado<EventoGitLab> = await this.cliente.GetEventosDeComentario(apos);

        const dias: string[] = pagina.itens
            .filter((evento) => evento.note?.noteable_type === TipoNoteableGitLab.Issue && !evento.note.system)
            .map((evento) => GetDataLocal(new Date(evento.created_at)))
            .filter((data) => data >= inicioSemana && data <= fimSemana);

        return { dias: new Set(dias), truncada: pagina.truncada };
    }
}

/**
 * Percorre as notas na ordem em que aconteceram e devolve só os lançamentos do usuário informado.
 * Uma nota de zeramento apaga tudo o que foi lançado antes dela, inclusive de outras pessoas.
 * @param notas Notas da issue, da mais antiga para a mais nova.
 * @param idDoUsuario Id de quem lançou as horas. O id é usado no lugar do nome porque não muda.
 * @returns Lançamentos de tempo do usuário, com data e horas.
 */
function getLancamentosDoUsuario(notas: NotaGitLab[], idDoUsuario: number): LancamentoDeTempo[] {
    let lancamentos: LancamentoDeTempo[] = [];

    notas.forEach((nota) => {
        if (!nota.system)
            return;

        const interpretada: NotaTempoInterpretada = InterpretarNotaDeTempo(nota.body, nota.created_at);

        if (interpretada.tipo === TipoNotaTempo.Zeramento) {
            lancamentos = [];
            return;
        }

        if (interpretada.tipo === TipoNotaTempo.Irrelevante || nota.author?.id !== idDoUsuario)
            return;

        lancamentos.push({ data: interpretada.data, horas: interpretada.horas });
    });

    return lancamentos;
}

/**
 * Monta os cinco dias úteis da semana com as horas lançadas em cada um, e o detalhe por issue.
 * @param inicioSemana Segunda-feira da semana consultada.
 * @param horasDasIssues Lançamentos já separados por issue.
 * @param diasComComentario Dias em que o dono do token comentou em algum chamado.
 * @returns Dias de segunda a sexta, na ordem do calendário.
 */
function montarDiasUteis(inicioSemana: string, horasDasIssues: HorasDaIssue[], diasComComentario: Set<string>): DiaDeHoras[] {
    const hoje: string = GetDataDeHoje();
    const lancamentosComTitulo: (LancamentoDeTempo & { titulo: string })[] = horasDasIssues.flatMap((item) =>
        item.lancamentos.map((lancamento) => ({ ...lancamento, titulo: item.issue.title })),
    );

    return Array.from({ length: DIAS_UTEIS_POR_SEMANA }, (_, indice) => {
        const data: string = SomarDias(inicioSemana, indice);
        const doDia = lancamentosComTitulo.filter((lancamento) => lancamento.data === data);

        // O total do dia soma direto sobre os lançamentos, igual antes de existir o detalhe por
        // issue — assim não sofre o arredondamento extra que agrupar por issue introduziria.
        const horas: number = somarHoras(doDia);

        return {
            data,
            dia: DIA_UTIL_POR_DIA_DA_SEMANA[GetDiaDaSemana(data)] ?? DiaUtil.Segunda,
            horas,
            completo: horas >= HORAS_POR_DIA_UTIL,
            hoje: data === hoje,
            porIssue: agruparPorIssue(doDia),
            temComentario: diasComComentario.has(data),
        };
    });
}

/**
 * Agrupa os lançamentos de um dia por issue, da que mais consumiu tempo para a que menos.
 * @param lancamentos Lançamentos do dia, de todas as issues.
 * @returns Uma entrada por issue com lançamento no dia, sem repetir título.
 */
function agruparPorIssue(lancamentos: (LancamentoDeTempo & { titulo: string })[]): HorasPorIssueNoDia[] {
    const porTitulo = new Map<string, number>();

    lancamentos.forEach((lancamento) => porTitulo.set(lancamento.titulo, (porTitulo.get(lancamento.titulo) ?? 0) + lancamento.horas));

    return Array.from(porTitulo, ([titulo, horas]) => ({ titulo, horas: arredondar(horas) }))
        .filter((item) => item.horas > 0)
        .sort((primeiro, segundo) => segundo.horas - primeiro.horas);
}

/**
 * Monta a chave única de uma issue, usada para casar o cálculo de elegibilidade com a issue certa.
 * @param projetoId ID numérico do projeto da issue.
 * @param issueIid IID da issue.
 * @returns Chave estável, independente do tipo de origem do ID do projeto.
 */
function getChaveIssue(projetoId: number | string, issueIid: number): string {
    return `${projetoId}-${issueIid}`;
}

/**
 * Converte a issue do GitLab para o formato exibido na tela.
 * @param issue Issue devolvida pela API.
 * @param horasNaSemana Horas que o usuário lançou nela na semana consultada.
 * @param diasComCommit Dias, dentro da semana, em que o usuário commitou nesta issue.
 * @returns Issue pronta para a lista.
 */
function converterIssue(issue: IssueGitLab, horasNaSemana: number, diasComCommit: string[]): IssueComHoras {
    return {
        projetoId: String(issue.project_id),
        caminhoProjeto: getCaminhoProjeto(issue),
        iid: issue.iid,
        titulo: issue.title,
        url: issue.web_url,
        estado: issue.state,
        atualizadoEm: issue.updated_at,
        horasNaSemana,
        horasTotais: arredondar((issue.time_stats?.total_time_spent ?? 0) / SEGUNDOS_POR_HORA),
        diasComCommit,
    };
}

/**
 * Lê o caminho do projeto a partir da referência completa, como "grupo/projeto#123".
 * @param issue Issue devolvida pela API.
 * @returns Caminho do projeto ou o ID numérico quando a referência não vier.
 */
function getCaminhoProjeto(issue: IssueGitLab): string {
    const referenciaCompleta: string = issue.references?.full ?? "";

    return referenciaCompleta.split(SEPARADOR_REFERENCIA)[0] || String(issue.project_id);
}

/**
 * Ordena as issues pelas horas da semana e, no empate, pela mexida mais recente.
 * @param primeira Primeira issue da comparação.
 * @param segunda Segunda issue da comparação.
 * @returns Número negativo quando a primeira vem antes.
 */
function compararIssues(primeira: IssueComHoras, segunda: IssueComHoras): number {
    return segunda.horasNaSemana - primeira.horasNaSemana || segunda.atualizadoEm.localeCompare(primeira.atualizadoEm);
}

/**
 * Soma as horas de uma lista de lançamentos.
 * @param lancamentos Lançamentos a somar.
 * @returns Total em horas, já arredondado.
 */
function somarHoras(lancamentos: LancamentoDeTempo[]): number {
    return arredondar(lancamentos.reduce((total, lancamento) => total + lancamento.horas, 0));
}

/**
 * Arredonda um total de horas para duas casas.
 * @param horas Valor a arredondar.
 * @returns Valor arredondado.
 */
function arredondar(horas: number): number {
    return Number(horas.toFixed(CASAS_DECIMAIS_HORAS));
}
