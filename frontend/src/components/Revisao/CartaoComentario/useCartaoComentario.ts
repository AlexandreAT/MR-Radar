import { ComentarioRevisao } from "src/api/Revisao/types";
import { GetSituacao, TEXTO_POR_ROTULO } from "src/utils/ComentariosRevisao";
import { FormatarDataHora, FormatarLocal } from "src/utils/Formatacao";
import { Vocabulario } from "src/utils/Vocabulario";
import { APARENCIA_POR_SITUACAO, AparenciaEtiqueta, TOM_POR_ROTULO } from "./types";

/**
 * Prepara os dados já formatados que o cartão de comentário exibe.
 * @param comentario Comentário devolvido pelo backend.
 * @param vocabulario Termos do provedor ativo.
 * @returns Etiquetas, data formatada, local do comentário e o texto do link externo.
 */
export function useCartaoComentario(comentario: ComentarioRevisao, vocabulario: Vocabulario) {
    const situacao: AparenciaEtiqueta = APARENCIA_POR_SITUACAO[GetSituacao(comentario)];
    const rotulo: AparenciaEtiqueta | null = comentario.rotulo
        ? { rotulo: TEXTO_POR_ROTULO[comentario.rotulo], tom: TOM_POR_ROTULO[comentario.rotulo] }
        : null;

    return {
        situacao,
        rotulo,
        dataFormatada: FormatarDataHora(comentario.criadoEm),
        local: FormatarLocal(comentario.caminhoArquivo, comentario.linha, vocabulario.nomeItem),
        textoLink: `Abrir no ${vocabulario.nomeProvedor}`,
        temRespostas: comentario.respostas.length > 0,
    };
}
