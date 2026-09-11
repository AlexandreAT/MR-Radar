import { ConfiguracaoDashboard, Provedor } from "src/api/Revisao/types";
import { MensagemErro } from "src/services/types";
import { PaginaApp } from "src/utils/Navegacao";
import { GetVocabulario } from "src/utils/Vocabulario";

/** Aba exibida no cabeçalho. */
interface AbaCabecalho {
    pagina: PaginaApp;
    rotulo: string;
}

/**
 * Monta as abas do provedor ativo.
 * A aba de horas só existe no GitLab: ela é montada em cima do Time tracking, que o GitHub não tem.
 * @param provedor Provedor ativo, ou indefinido enquanto a configuração carrega.
 * @returns Abas exibidas, na ordem em que aparecem.
 */
export function GetAbas(provedor: Provedor | undefined): AbaCabecalho[] {
    const abas: AbaCabecalho[] = [{ pagina: PaginaApp.Revisao, rotulo: GetVocabulario(provedor).nomeItemPlural }];

    if (provedor !== Provedor.GitHub)
        abas.push({ pagina: PaginaApp.Horas, rotulo: "Horas" });

    return abas;
}

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
