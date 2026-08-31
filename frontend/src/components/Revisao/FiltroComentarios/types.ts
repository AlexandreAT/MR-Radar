import { ComentarioRevisao } from "src/api/Revisao/types";
import { OpcaoSelecao } from "src/components/BasicComponents";
import { OrdenacaoComentarios, RECORTE_TODOS } from "src/utils/ComentariosRevisao";

/** Opções do campo de ordenação. */
export const OPCOES_ORDENACAO: OpcaoSelecao[] = [
    { valor: OrdenacaoComentarios.MaisRecentes, rotulo: "Mais recentes" },
    { valor: OrdenacaoComentarios.Rotulo, rotulo: "Rótulo: pior primeiro" },
];

/** Opção fixa que desliga o filtro de rótulo ou revisor. */
export const OPCOES_RECORTE: OpcaoSelecao[] = [{ valor: RECORTE_TODOS, rotulo: "Todos" }];

/** Larguras dos campos do filtro. */
export const LARGURA_CAMPO = {
    ORDENACAO: "190px",
    RECORTE: "220px",
} as const;

/** Textos fixos exibidos no filtro da lista. */
export const TEXTO_FILTRO_COMENTARIOS = {
    ROTULO_ORDENACAO: "Ordenar por",
    ROTULO_RECORTE: "Rótulo ou revisor",
    GRUPO_ROTULOS: "Rótulos",
    GRUPO_REVISORES: "Revisores",
} as const;

/** Propriedades aceitas pelo filtro da lista de comentários. */
export interface PropriedadesFiltroComentarios {
    comentarios: ComentarioRevisao[];
    ordenacao: OrdenacaoComentarios;
    recorte: string;
    onAlterarOrdenacao: (valor: string) => void;
    onAlterarRecorte: (valor: string) => void;
}
