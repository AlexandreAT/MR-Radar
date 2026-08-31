import { ContagemComentarios, MergeRequestResumo } from "src/api/Revisao/types";
import { TomEtiqueta } from "src/components/BasicComponents";
import { SituacaoComentario } from "src/utils/ComentariosRevisao";

/** Propriedades aceitas pelo resumo do Merge Request. */
export interface PropriedadesResumoMergeRequest {
    mergeRequest: MergeRequestResumo;
    contagem: ContagemComentarios;
    situacao: SituacaoComentario | null;
    onAlterarSituacao: (situacao: SituacaoComentario | null) => void;
}

/** Contador exibido no resumo, que também filtra a lista pela situação correspondente. */
export interface ContadorResumo {
    chave: keyof ContagemComentarios;
    texto: string;
    tom: TomEtiqueta;
    situacao: SituacaoComentario | null;
}

/** Contadores exibidos, na ordem em que aparecem na tela. */
export const CONTADORES: ContadorResumo[] = [
    { chave: "abertos", texto: "abertos", tom: TomEtiqueta.Aberto, situacao: SituacaoComentario.Aberto },
    { chave: "resolvidos", texto: "resolvidos", tom: TomEtiqueta.Resolvido, situacao: SituacaoComentario.Resolvido },
    { chave: "naoResolviveis", texto: "gerais", tom: TomEtiqueta.Neutro, situacao: SituacaoComentario.Geral },
    { chave: "total", texto: "no total", tom: TomEtiqueta.Neutro, situacao: null },
];

/** Textos fixos exibidos no resumo. */
export const TEXTO_RESUMO = {
    LINK_GITLAB: "Abrir o Merge Request",
    SEPARADOR: "·",
    SETA: "→",
} as const;
