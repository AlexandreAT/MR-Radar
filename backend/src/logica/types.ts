import { IssueGitLab } from "../integracao/gitlab/types";
import { Autor, ErroTrecho, LadoDiff, TrechoCodigo } from "../models/Revisao/types";

/** Posição de um comentário já interpretada, pronta para buscar o arquivo. */
export interface PosicaoResolvida {
    caminhoArquivo: string | null;
    linhaInicial: number | null;
    linhaFinal: number | null;
    lado: LadoDiff | null;
    refs: string[];
}

/** Resultado da tentativa de montar o trecho de código de um comentário. */
export interface ResultadoTrecho {
    codigo: string | null;
    trecho: TrechoCodigo | null;
    erroTrecho: ErroTrecho | null;
}

/** Nota de uma thread já convertida para o domínio, independente do provedor de origem. */
export interface NotaNormalizada {
    id: number;
    url: string;
    autor: Autor;
    corpo: string;
    criadoEm: string;
    atualizadoEm: string;
}

/** Thread de revisão já interpretada, independente do provedor de origem. */
export interface DiscussaoNormalizada {
    id: string;
    notaPrincipal: NotaNormalizada;
    respostas: NotaNormalizada[];
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
