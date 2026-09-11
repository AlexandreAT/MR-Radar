import { EscopoMergeRequest, MergeRequestAberto } from "src/api/Revisao/types";
import { Vocabulario } from "src/utils/Vocabulario";
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
    ROTULO_ESCOPO: "Mostrar",
    ATUALIZAR: "Atualizar lista",
    CARREGANDO: "Carregando...",
    PESQUISANDO: "Pesquisando...",
    RASCUNHO: "Rascunho",
    THREADS_ABERTAS: "Tem thread aberta",
    TRUNCADA: "A lista pode estar incompleta: nem tudo pôde ser lido agora.",
    ATUALIZADO_EM: "atualizado em",
    SETA: "→",
    PESQUISAR: "Pesquisar",
    LIMPAR_PESQUISA: "Limpar pesquisa",
    RESULTADOS_PESQUISA: "Resultados da pesquisa",
    NENHUM_RESULTADO: "Nenhum resultado para essa pesquisa.",
} as const;

/** Largura do campo de pesquisa. */
export const LARGURA_PESQUISA = "260px";

/** Propriedades aceitas pela lista de Merge Requests. */
export interface PropriedadesListaMergeRequests {
    vocabulario: Vocabulario;
    mergeRequests: MergeRequestAberto[];
    escopo: EscopoMergeRequest;
    carregando: boolean;
    paginacaoTruncada: boolean;
    projetoSelecionado: string;
    mrSelecionado: string;
    termoPesquisa: string;
    podePesquisar: boolean;
    resultadosPesquisa: MergeRequestAberto[] | null;
    pesquisaTruncada: boolean;
    pesquisando: boolean;
    erroPesquisa: string | null;
    onAlterarEscopo: (valor: string) => void;
    onSelecionar: (mergeRequest: MergeRequestAberto) => void;
    onAtualizar: () => void;
    onAlterarTermoPesquisa: (valor: string) => void;
    onPesquisar: () => void;
}
