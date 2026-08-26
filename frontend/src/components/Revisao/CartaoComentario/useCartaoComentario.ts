import { ComentarioRevisao } from "src/api/Revisao/types";
import { FormatarDataHora, FormatarLocal } from "src/utils/Formatacao";
import { APARENCIA_POR_SITUACAO, AparenciaSituacao, SituacaoComentario } from "./types";

/**
 * Prepara os dados já formatados que o cartão de comentário exibe.
 * @param comentario Comentário devolvido pelo backend.
 * @returns Etiqueta de situação, data formatada e o local do comentário.
 */
export function useCartaoComentario(comentario: ComentarioRevisao) {
    const aparencia: AparenciaSituacao = APARENCIA_POR_SITUACAO[getSituacao(comentario)];

    return {
        aparencia,
        dataFormatada: FormatarDataHora(comentario.criadoEm),
        local: FormatarLocal(comentario.caminhoArquivo, comentario.linha),
        temRespostas: comentario.respostas.length > 0,
    };
}

/**
 * Descobre em que situação a thread está.
 * @param comentario Comentário devolvido pelo backend.
 * @returns Situação usada para escolher a etiqueta.
 */
function getSituacao(comentario: ComentarioRevisao): SituacaoComentario {
    if (!comentario.resolvivel)
        return SituacaoComentario.Geral;

    return comentario.resolvido ? SituacaoComentario.Resolvido : SituacaoComentario.Aberto;
}
