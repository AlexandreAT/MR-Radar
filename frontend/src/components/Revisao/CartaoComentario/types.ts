import { ComentarioRevisao } from "src/api/Revisao/types";
import { TomEtiqueta } from "src/components/BasicComponents";

/** Propriedades aceitas pelo cartão de comentário. */
export interface PropriedadesCartaoComentario {
    comentario: ComentarioRevisao;
}

/** Situação em que uma thread pode estar. */
export enum SituacaoComentario {
    Aberto = "aberto",
    Resolvido = "resolvido",
    Geral = "geral",
}

/** Como cada situação é exibida na etiqueta do cartão. */
export interface AparenciaSituacao {
    rotulo: string;
    tom: TomEtiqueta;
}

/** Etiqueta correspondente a cada situação. */
export const APARENCIA_POR_SITUACAO: Record<SituacaoComentario, AparenciaSituacao> = {
    [SituacaoComentario.Aberto]: { rotulo: "Aberto", tom: TomEtiqueta.Aberto },
    [SituacaoComentario.Resolvido]: { rotulo: "Resolvido", tom: TomEtiqueta.Resolvido },
    [SituacaoComentario.Geral]: { rotulo: "Comentário geral", tom: TomEtiqueta.Neutro },
};

/** Textos fixos exibidos no cartão. */
export const TEXTO_CARTAO = {
    TITULO_COMENTARIO: "Comentário",
    TITULO_LOCAL: "Local",
    TITULO_CODIGO: "Código",
    TITULO_RESPOSTAS: "Respostas",
    LINK_GITLAB: "Abrir no GitLab",
    SEPARADOR: " · ",
} as const;
