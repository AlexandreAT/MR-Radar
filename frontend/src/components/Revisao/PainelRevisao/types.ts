import { CodigoErroBackend, ConfiguracaoDashboard, StatusFiltro } from "src/api/Revisao/types";

/** Estado do botão de copiar comentários, para dar retorno visual do clique. */
export enum EstadoCopia {
    Ocioso = "ocioso",
    Copiado = "copiado",
    Falhou = "falhou",
}

/** Tempo (ms) que a mensagem de retorno do botão de copiar fica visível. */
export const TEMPO_RETORNO_COPIA_MS = 2000;

/** Intervalo inicial da atualização automática, em segundos. */
export const INTERVALO_PADRAO_SEGUNDOS = 30;

/** Fator de conversão do intervalo escolhido na tela para o temporizador. */
export const MILISSEGUNDOS_POR_SEGUNDO = 1000;

/**
 * Erros que não se resolvem sozinhos: quando um deles acontece durante a atualização
 * automática, ela é desligada para não ficar repetindo uma consulta que vai falhar de novo.
 */
export const CODIGOS_ERRO_PERMANENTE: string[] = [
    CodigoErroBackend.ConfiguracaoInvalida,
    CodigoErroBackend.ParametroInvalido,
    CodigoErroBackend.TokenInvalido,
    CodigoErroBackend.AcessoNegado,
    CodigoErroBackend.NaoEncontrado,
    CodigoErroBackend.LimiteRequisicoes,
];

/** Mensagens exibidas no painel. */
export const MENSAGEM = {
    CAMPOS_OBRIGATORIOS: "Informe o Project ID e o IID do Merge Request para buscar.",
    ERRO_INESPERADO: "Não foi possível carregar os comentários.",
    ERRO_LISTA: "Não foi possível carregar os seus Merge Requests.",
    SEM_BUSCA: "Escolha um Merge Request na lista acima, ou informe o Project ID e o IID e clique em Buscar.",
    SEM_COMENTARIOS: "Nenhum comentário encontrado para este filtro.",
    PAGINACAO_TRUNCADA: "Havia mais páginas de comentários do que o limite configurado. Aumente MAX_PAGES no arquivo .env.",
    CONTADOR_EXIBIDO: "comentário exibido",
    CONTADOR_EXIBIDOS: "comentários exibidos",
} as const;

/** Texto do botão de copiar comentários, conforme o estado do clique. */
export const TEXTO_POR_ESTADO_COPIA: Record<EstadoCopia, string> = {
    [EstadoCopia.Ocioso]: "Copiar comentários",
    [EstadoCopia.Copiado]: "Copiado!",
    [EstadoCopia.Falhou]: "Não foi possível copiar",
};

/** Propriedades aceitas pela página de revisão. */
export interface PropriedadesPainelRevisao {
    configuracao: ConfiguracaoDashboard | null;
}

/**
 * Ajustes pontuais de uma consulta. Serve para buscar um Merge Request escolhido na lista
 * sem esperar o estado da tela ser atualizado.
 */
export interface OpcoesBusca {
    projetoId?: string;
    mrIid?: string;
    status?: StatusFiltro;
    silenciosa?: boolean;
}
