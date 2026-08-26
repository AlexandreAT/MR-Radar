import { EscopoMergeRequest, MergeRequestAberto } from "src/api/Revisao/types";
import { OpcaoSelecao } from "src/components/BasicComponents";

/** Opções de escopo do seletor de Merge Requests. */
export const OPCOES_ESCOPO: OpcaoSelecao[] = [
    { valor: EscopoMergeRequest.CriadosPorMim, rotulo: "Criados por mim" },
    { valor: EscopoMergeRequest.AtribuidosAMim, rotulo: "Atribuídos a mim" },
];

/** Largura do seletor de escopo. */
export const LARGURA_ESCOPO = "190px";

/** Textos fixos exibidos na lista. */
export const TEXTO_LISTA = {
    TITULO: "Meus Merge Requests abertos",
    ROTULO_ESCOPO: "Mostrar",
    ATUALIZAR: "Atualizar lista",
    CARREGANDO: "Carregando...",
    VAZIA: "Nenhum Merge Request aberto encontrado para este filtro.",
    RASCUNHO: "Rascunho",
    THREADS_ABERTAS: "Tem thread aberta",
    TRUNCADA: "A lista passou do limite de páginas configurado e pode estar incompleta.",
    ATUALIZADO_EM: "atualizado em",
    SETA: "→",
} as const;

/** Propriedades aceitas pela lista de Merge Requests. */
export interface PropriedadesListaMergeRequests {
    mergeRequests: MergeRequestAberto[];
    escopo: EscopoMergeRequest;
    carregando: boolean;
    paginacaoTruncada: boolean;
    projetoSelecionado: string;
    mrSelecionado: string;
    onAlterarEscopo: (valor: string) => void;
    onSelecionar: (mergeRequest: MergeRequestAberto) => void;
    onAtualizar: () => void;
}
