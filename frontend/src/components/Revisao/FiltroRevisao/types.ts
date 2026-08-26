import { StatusFiltro } from "src/api/Revisao/types";
import { OpcaoSelecao } from "src/components/BasicComponents";

/** Opções do filtro de status. */
export const OPCOES_STATUS: OpcaoSelecao[] = [
    { valor: StatusFiltro.Abertos, rotulo: "Abertos" },
    { valor: StatusFiltro.Resolvidos, rotulo: "Resolvidos" },
    { valor: StatusFiltro.Todos, rotulo: "Todos" },
];

/** Intervalos disponíveis para a atualização automática, em segundos. */
export const OPCOES_INTERVALO: OpcaoSelecao[] = [
    { valor: 15, rotulo: "15s" },
    { valor: 30, rotulo: "30s" },
    { valor: 60, rotulo: "60s" },
];

/** Larguras dos campos do filtro. */
export const LARGURA_CAMPO = {
    PROJETO: "260px",
    MERGE_REQUEST: "140px",
    SELECAO: "150px",
} as const;

/** Textos fixos exibidos no filtro. */
export const TEXTO_FILTRO = {
    ROTULO_PROJETO: "Project ID ou caminho",
    ROTULO_MR: "IID do Merge Request",
    ROTULO_STATUS: "Status",
    ROTULO_INTERVALO: "Intervalo",
    PLACEHOLDER_PROJETO: "123 ou grupo/projeto",
    PLACEHOLDER_MR: "456",
    BUSCAR: "Buscar",
    ATUALIZAR: "Atualizar agora",
    BUSCANDO: "Buscando...",
    AUTOMATICO: "Atualizar automaticamente",
    ULTIMA_ATUALIZACAO: "Última atualização:",
} as const;

/** Propriedades aceitas pelo filtro de revisão. */
export interface PropriedadesFiltroRevisao {
    projetoId: string;
    mrIid: string;
    status: StatusFiltro;
    atualizacaoAutomatica: boolean;
    intervaloSegundos: number;
    carregando: boolean;
    temResultado: boolean;
    ultimaAtualizacao: string;
    onAlterarProjeto: (valor: string) => void;
    onAlterarMrIid: (valor: string) => void;
    onAlterarStatus: (valor: string) => void;
    onAlterarAtualizacaoAutomatica: (valor: boolean) => void;
    onAlterarIntervalo: (valor: string) => void;
    onBuscar: () => void;
}
