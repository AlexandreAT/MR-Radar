import { Autor, ComentarioRevisao, RotuloRevisao, StatusFiltro } from "src/api/Revisao/types";

/** Situação em que uma thread de comentários pode estar. */
export enum SituacaoComentario {
    Aberto = "aberto",
    Resolvido = "resolvido",
    Geral = "geral",
}

/** Critérios disponíveis para ordenar a lista de comentários. */
export enum OrdenacaoComentarios {
    MaisRecentes = "mais_recentes",
    Rotulo = "rotulo",
}

/** Origem do filtro que aceita tanto um rótulo quanto um revisor. */
export enum TipoRecorte {
    Rotulo = "rotulo",
    Revisor = "revisor",
}

/** Valor do filtro de rótulo ou revisor quando nada está escolhido. */
export const RECORTE_TODOS = "";

/** Separa o tipo do valor dentro do filtro de rótulo ou revisor. */
const SEPARADOR_RECORTE = ":";

/** Texto exibido para cada rótulo de revisão. */
export const TEXTO_POR_ROTULO: Record<RotuloRevisao, string> = {
    [RotuloRevisao.Issue]: "Issue",
    [RotuloRevisao.Suggestion]: "Suggestion",
    [RotuloRevisao.Nit]: "Nit",
    [RotuloRevisao.Question]: "Question",
    [RotuloRevisao.Praise]: "Praise",
};

/** Rótulos do pior para o melhor, ordem usada na ordenação e na lista de filtros. */
const ROTULOS_DO_PIOR_AO_MELHOR: RotuloRevisao[] = [
    RotuloRevisao.Issue,
    RotuloRevisao.Suggestion,
    RotuloRevisao.Nit,
    RotuloRevisao.Question,
    RotuloRevisao.Praise,
];

/** Comentário sem rótulo fica depois de todos os rotulados. */
const POSICAO_SEM_ROTULO = ROTULOS_DO_PIOR_AO_MELHOR.length;

/** Situação destacada ao trocar o escopo da busca, para o filtro combinar com a lista exibida. */
export const SITUACAO_POR_STATUS: Record<StatusFiltro, SituacaoComentario | null> = {
    [StatusFiltro.Abertos]: SituacaoComentario.Aberto,
    [StatusFiltro.Resolvidos]: SituacaoComentario.Resolvido,
    [StatusFiltro.Todos]: null,
};

/** Situações que cada escopo de busca traz do servidor. */
const SITUACOES_POR_STATUS: Record<StatusFiltro, SituacaoComentario[]> = {
    [StatusFiltro.Abertos]: [SituacaoComentario.Aberto, SituacaoComentario.Geral],
    [StatusFiltro.Resolvidos]: [SituacaoComentario.Resolvido],
    [StatusFiltro.Todos]: [SituacaoComentario.Aberto, SituacaoComentario.Resolvido, SituacaoComentario.Geral],
};

/**
 * Descobre em que situação a thread está.
 * @param comentario Comentário devolvido pelo backend.
 * @returns Situação da thread.
 */
export function GetSituacao(comentario: ComentarioRevisao): SituacaoComentario {
    if (!comentario.resolvivel)
        return SituacaoComentario.Geral;

    return comentario.resolvido ? SituacaoComentario.Resolvido : SituacaoComentario.Aberto;
}

/**
 * Indica se o escopo de busca em uso já traz do servidor a situação escolhida na tela.
 * @param status Escopo da última busca.
 * @param situacao Situação escolhida, ou nulo para todas.
 * @returns Verdadeiro quando não é preciso buscar de novo.
 */
export function EscopoCobreSituacao(status: StatusFiltro, situacao: SituacaoComentario | null): boolean {
    if (!situacao)
        return status === StatusFiltro.Todos;

    return SITUACOES_POR_STATUS[status].includes(situacao);
}

/**
 * Monta o valor usado no filtro de rótulo ou revisor.
 * @param tipo Se o filtro é por rótulo ou por revisor.
 * @param valor Rótulo ou nome de usuário do revisor.
 * @returns Valor pronto para o campo de seleção.
 */
export function MontarRecorte(tipo: TipoRecorte, valor: string): string {
    return `${tipo}${SEPARADOR_RECORTE}${valor}`;
}

/**
 * Filtra os comentários pela situação e pelo rótulo ou revisor escolhidos na tela.
 * @param comentarios Comentários carregados do Merge Request.
 * @param situacao Situação escolhida, ou nulo para todas.
 * @param recorte Valor do filtro de rótulo ou revisor.
 * @returns Comentários que atendem aos dois filtros.
 */
export function FiltrarComentarios(comentarios: ComentarioRevisao[], situacao: SituacaoComentario | null, recorte: string): ComentarioRevisao[] {
    const separador: number = recorte.indexOf(SEPARADOR_RECORTE);
    const tipo: string = separador < 0 ? "" : recorte.slice(0, separador);
    const valor: string = separador < 0 ? "" : recorte.slice(separador + 1);

    return comentarios.filter((comentario) => {
        if (situacao && GetSituacao(comentario) !== situacao)
            return false;

        if (tipo === TipoRecorte.Rotulo)
            return comentario.rotulo === valor;

        if (tipo === TipoRecorte.Revisor)
            return comentario.autor.usuario === valor;

        return true;
    });
}

/**
 * Ordena os comentários conforme o critério escolhido na tela.
 * @param comentarios Comentários já filtrados.
 * @param ordenacao Critério escolhido.
 * @returns Nova lista ordenada.
 */
export function OrdenarComentarios(comentarios: ComentarioRevisao[], ordenacao: OrdenacaoComentarios): ComentarioRevisao[] {
    const ordenados: ComentarioRevisao[] = [...comentarios];

    if (ordenacao === OrdenacaoComentarios.Rotulo)
        return ordenados.sort((primeiro, segundo) => getPosicaoDoRotulo(primeiro) - getPosicaoDoRotulo(segundo) || compararMaisRecente(primeiro, segundo));

    return ordenados.sort(compararMaisRecente);
}

/**
 * Lista os revisores que escreveram os comentários carregados.
 * @param comentarios Comentários carregados do Merge Request.
 * @returns Um autor por revisor, em ordem alfabética.
 */
export function GetRevisores(comentarios: ComentarioRevisao[]): Autor[] {
    const porUsuario = new Map<string, Autor>();

    comentarios.forEach((comentario) => {
        if (!porUsuario.has(comentario.autor.usuario))
            porUsuario.set(comentario.autor.usuario, comentario.autor);
    });

    return Array.from(porUsuario.values()).sort((primeiro, segundo) => primeiro.nome.localeCompare(segundo.nome));
}

/**
 * Lista os rótulos presentes nos comentários carregados.
 * @param comentarios Comentários carregados do Merge Request.
 * @returns Rótulos encontrados, do pior para o melhor.
 */
export function GetRotulosPresentes(comentarios: ComentarioRevisao[]): RotuloRevisao[] {
    const encontrados = new Set(comentarios.map((comentario) => comentario.rotulo));

    return ROTULOS_DO_PIOR_AO_MELHOR.filter((rotulo) => encontrados.has(rotulo));
}

/**
 * Descobre a posição do rótulo do comentário na ordem do pior para o melhor.
 * @param comentario Comentário devolvido pelo backend.
 * @returns Posição do rótulo, ou a posição dos comentários sem rótulo.
 */
function getPosicaoDoRotulo(comentario: ComentarioRevisao): number {
    if (!comentario.rotulo)
        return POSICAO_SEM_ROTULO;

    return ROTULOS_DO_PIOR_AO_MELHOR.indexOf(comentario.rotulo);
}

/**
 * Compara dois comentários deixando o mais novo primeiro.
 * @param primeiro Primeiro comentário da comparação.
 * @param segundo Segundo comentário da comparação.
 * @returns Número negativo quando o primeiro é mais novo.
 */
function compararMaisRecente(primeiro: ComentarioRevisao, segundo: ComentarioRevisao): number {
    return segundo.criadoEm.localeCompare(primeiro.criadoEm);
}
