import { DiscussaoGitLab, IssueGitLab, NotaGitLab } from "../integracao/gitlab/types";
import { ErroTrecho, LadoDiff, TrechoCodigo } from "../models/Revisao/types";

/** Posição de um comentário já interpretada, pronta para buscar o arquivo. */
export interface PosicaoResolvida {
    caminhoArquivo: string | null;
    linhaInicial: number | null;
    linhaFinal: number | null;
    lado: LadoDiff | null;
    refs: string[];
}

/** Primeira e última linha que devem aparecer destacadas no trecho. */
export interface IntervaloDestaque {
    inicial: number | null;
    final: number | null;
}

/** Resultado da tentativa de montar o trecho de código de um comentário. */
export interface ResultadoTrecho {
    codigo: string | null;
    trecho: TrechoCodigo | null;
    erroTrecho: ErroTrecho | null;
}

/** Thread do GitLab com os dados já interpretados que o dashboard utiliza. */
export interface DiscussaoNormalizada {
    discussao: DiscussaoGitLab;
    notaPrincipal: NotaGitLab;
    respostas: NotaGitLab[];
    resolvivel: boolean;
    resolvido: boolean;
    posicao: PosicaoResolvida;
}

/** Conteúdo de um arquivo guardado em cache. */
export interface ArquivoEmCache {
    expiraEm: number;
    linhas?: string[];
    erro?: ErroTrecho;
}

/** Tempo lançado por alguém em um dia específico. */
export interface LancamentoDeTempo {
    data: string;
    horas: number;
}

/**
 * Horas encontradas em uma issue durante a montagem do resumo da semana. Guarda a issue crua, e
 * não a já convertida, porque a elegibilidade é calculada à parte e só entra na conversão final.
 */
export interface HorasDaIssue {
    issue: IssueGitLab;
    horasNaSemana: number;
    lancamentos: LancamentoDeTempo[];
    horasNoFimDeSemana: number;
    paginacaoTruncada: boolean;
}
