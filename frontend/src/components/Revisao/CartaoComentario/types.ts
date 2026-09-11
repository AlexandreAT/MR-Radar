import { ComentarioRevisao, RotuloRevisao } from "src/api/Revisao/types";
import { TomEtiqueta } from "src/components/BasicComponents";
import { SituacaoComentario } from "src/utils/ComentariosRevisao";
import { Vocabulario } from "src/utils/Vocabulario";

/** Propriedades aceitas pelo cartão de comentário. */
export interface PropriedadesCartaoComentario {
    comentario: ComentarioRevisao;
    vocabulario: Vocabulario;
}

/** Conteúdo de uma etiqueta exibida no cabeçalho do cartão. */
export interface AparenciaEtiqueta {
    rotulo: string;
    tom: TomEtiqueta;
}

/** Etiqueta correspondente a cada situação. */
export const APARENCIA_POR_SITUACAO: Record<SituacaoComentario, AparenciaEtiqueta> = {
    [SituacaoComentario.Aberto]: { rotulo: "Aberto", tom: TomEtiqueta.Aberto },
    [SituacaoComentario.Resolvido]: { rotulo: "Resolvido", tom: TomEtiqueta.Resolvido },
    [SituacaoComentario.Geral]: { rotulo: "Comentário geral", tom: TomEtiqueta.Neutro },
};

/** Cor da etiqueta de cada rótulo de revisão. */
export const TOM_POR_ROTULO: Record<RotuloRevisao, TomEtiqueta> = {
    [RotuloRevisao.Issue]: TomEtiqueta.Issue,
    [RotuloRevisao.Suggestion]: TomEtiqueta.Suggestion,
    [RotuloRevisao.Nit]: TomEtiqueta.Nit,
    [RotuloRevisao.Question]: TomEtiqueta.Question,
    [RotuloRevisao.Praise]: TomEtiqueta.Praise,
};

/** Textos fixos exibidos no cartão. */
export const TEXTO_CARTAO = {
    TITULO_COMENTARIO: "Comentário",
    TITULO_LOCAL: "Local",
    TITULO_CODIGO: "Código",
    TITULO_RESPOSTAS: "Respostas",
    SEPARADOR: " · ",
} as const;
