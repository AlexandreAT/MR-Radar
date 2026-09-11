import { MergeRequestResumo } from "src/api/Revisao/types";
import { Vocabulario } from "src/utils/Vocabulario";

/** Propriedades aceitas pelo modal de alterações. */
export interface PropriedadesModalAlteracoes {
    projetoId: string;
    mergeRequest: MergeRequestResumo;
    vocabulario: Vocabulario;
    onFechar: () => void;
}

/** Estado do botão de copiar, para dar retorno visual do clique. */
export enum EstadoCopia {
    Ocioso = "ocioso",
    Copiado = "copiado",
    Falhou = "falhou",
}

/** Tempo (ms) que a mensagem de retorno do botão de copiar fica visível. */
export const TEMPO_RETORNO_COPIA_MS = 2000;

/** Texto do botão de copiar, conforme o estado do clique. */
export const TEXTO_POR_ESTADO_COPIA: Record<EstadoCopia, string> = {
    [EstadoCopia.Ocioso]: "Copiar",
    [EstadoCopia.Copiado]: "Copiado!",
    [EstadoCopia.Falhou]: "Não foi possível copiar",
};

/** Textos fixos exibidos no modal. */
export const TEXTO_MODAL = {
    VER_ALTERACOES: "Ver alterações",
    CARREGANDO: "Carregando…",
    CARREGAR_MAIS: "Carregar mais arquivos",
    MARCAR_TODOS: "Marcar todos",
    DESMARCAR_TODOS: "Desmarcar todos",
    COPIAR_SELECIONADOS: "Copiar selecionados",
    SEM_ARQUIVOS: "Nenhum arquivo alterado encontrado.",
    ERRO_CARREGAR: "Não foi possível carregar os arquivos alterados.",
    FECHAR: "Fechar",
    SEPARADOR: " · ",
} as const;
