import { ConfiguracaoDashboard } from "src/api/Revisao/types";
import { MensagemErro } from "src/services/types";
import { PaginaApp } from "src/utils/Navegacao";

/** Aba exibida no cabeçalho. */
interface AbaCabecalho {
    pagina: PaginaApp;
    rotulo: string;
}

/** Abas exibidas, na ordem em que aparecem. */
export const ABAS: AbaCabecalho[] = [
    { pagina: PaginaApp.Revisao, rotulo: "Merge Requests" },
    { pagina: PaginaApp.Horas, rotulo: "Horas" },
];

/** Textos fixos exibidos no cabeçalho. */
export const TEXTO_CABECALHO = {
    TITULO: "MR Radar",
    ETIQUETA_SOMENTE_LEITURA: "Somente leitura",
    BACKEND_NAO_CONFIGURADO: "O backend ainda não está configurado.",
} as const;

/** Propriedades aceitas pelo cabeçalho do dashboard. */
export interface PropriedadesCabecalhoApp {
    pagina: PaginaApp;
    configuracao: ConfiguracaoDashboard | null;
    erroConfiguracao: MensagemErro | null;
    onAlterarPagina: (pagina: PaginaApp) => void;
}
