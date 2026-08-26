import { DiscussaoGitLab, NotaGitLab } from "../integracao/gitlab/types";
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
