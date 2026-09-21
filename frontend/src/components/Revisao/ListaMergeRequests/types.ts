import { ConfiguracaoDashboard, EscopoMergeRequest, MergeRequestAberto, SituacaoMergeRequest } from "src/api/Revisao/types";
import { Vocabulario } from "src/utils/Vocabulario";
import { OpcaoSelecao } from "src/components/BasicComponents";

/** Aba escolhida na lista: os Merge Requests abertos, ou os encerrados (fechados ou mesclados). */
export enum AbaMergeRequests {
    Abertos = "abertos",
    Encerrados = "encerrados",
}

/** Opções de escopo do seletor de Merge Requests. */
export const OPCOES_ESCOPO: OpcaoSelecao[] = [
    { valor: EscopoMergeRequest.CriadosPorMim, rotulo: "Criados por mim" },
    { valor: EscopoMergeRequest.AtribuidosAMim, rotulo: "Atribuídos a mim" },
];

/** Largura do seletor de escopo. */
export const LARGURA_ESCOPO = "190px";

/** Largura do campo de pesquisa. */
export const LARGURA_PESQUISA = "260px";

/** Caracteres mínimos para pesquisar por título. Espelha LIMITE.TERMO_PESQUISA_MIN_CARACTERES do backend. */
export const TERMO_PESQUISA_MIN_CARACTERES = 3;

/** Rótulo da etiqueta de situação, só para quem não está mais aberto. */
export const ROTULO_SITUACAO: Partial<Record<SituacaoMergeRequest, string>> = {
    [SituacaoMergeRequest.Fechado]: "Fechado",
    [SituacaoMergeRequest.Mesclado]: "Mesclado",
};

/** Textos fixos exibidos na lista. */
export const TEXTO_LISTA = {
    ABA_ABERTOS: "Abertos",
    ABA_ENCERRADOS: "Fechados",
    ROTULO_ESCOPO: "Mostrar",
    ATUALIZAR: "Atualizar lista",
    CARREGANDO: "Carregando...",
    PESQUISANDO: "Pesquisando...",
    VALIDO: "Válido",
    INVALIDO: "Inválido",
    THREADS_ABERTAS: "Tem thread aberta",
    TRUNCADA: "A lista pode estar incompleta: nem tudo pôde ser lido agora.",
    ATUALIZADO_EM: "atualizado em",
    SETA: "→",
    PESQUISAR: "Pesquisar",
    LIMPAR_PESQUISA: "Limpar pesquisa",
    RESULTADOS_PESQUISA: "Resultados da pesquisa",
    NENHUM_RESULTADO: "Nenhum resultado para essa pesquisa.",
    ERRO_PESQUISA: "Não foi possível pesquisar.",
    ANTERIOR: "Anterior",
    PROXIMA: "Próxima",
} as const;

/**
 * Mensagem de erro ao carregar a lista por escopo, com os termos do provedor ativo.
 * @param vocabulario Termos do provedor ativo.
 * @param encerrados Indica se o erro é da lista de encerrados, para o texto citar isso.
 * @returns Mensagem pronta para exibir.
 */
export function GetErroCarregarLista(vocabulario: Vocabulario, encerrados: boolean): string {
    return `Não foi possível carregar os seus ${vocabulario.nomeItemPlural}${encerrados ? " encerrados" : ""}.`;
}

/** Propriedades aceitas pela lista de Merge Requests. */
export interface PropriedadesListaMergeRequests {
    configuracao: ConfiguracaoDashboard | null;
    projetoSelecionado: string;
    mrSelecionado: string;
    onSelecionar: (mergeRequest: MergeRequestAberto) => void;
}
