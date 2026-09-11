import { ComentarioRevisao } from "src/api/Revisao/types";
import { FormatarLocal } from "./Formatacao";

/** Linhas em branco entre um comentário e o próximo no texto copiado. */
const SEPARADOR_ENTRE_COMENTARIOS = "\n\n\n";

/**
 * Monta o texto de um comentário no formato pronto para colar em outro lugar.
 * @param comentario Comentário já formatado pelo backend.
 * @param nomeItem Como o provedor ativo chama o item (Merge Request ou Pull Request).
 * @returns Bloco com comentário, arquivo e, se existir, o trecho de código.
 */
function FormatarComentario(comentario: ComentarioRevisao, nomeItem: string): string {
    const linhas: string[] = [`Comentário: "${comentario.comentario}"`, `Arquivo: "${FormatarLocal(comentario.caminhoArquivo, comentario.linha, nomeItem)}"`];

    if (comentario.codigo)
        linhas.push("Código:", "```" + (comentario.trecho?.linguagem ?? ""), comentario.codigo, "```");

    return linhas.join("\n");
}

/**
 * Monta o texto de todos os comentários, prontos para colar em outro lugar (Ctrl+V).
 * @param comentarios Comentários a incluir, na ordem em que devem aparecer no texto.
 * @param nomeItem Como o provedor ativo chama o item (Merge Request ou Pull Request).
 * @returns Um bloco por comentário, separado por linhas em branco.
 */
export function FormatarComentariosParaCopia(comentarios: ComentarioRevisao[], nomeItem: string): string {
    return comentarios.map((comentario) => FormatarComentario(comentario, nomeItem)).join(SEPARADOR_ENTRE_COMENTARIOS);
}
