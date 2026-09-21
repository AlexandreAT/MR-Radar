import { CodigoErroBackend, ConfiguracaoDashboard, StatusFiltro } from "src/api/Revisao/types";
import { Vocabulario } from "src/utils/Vocabulario";

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

/** Mensagens exibidas no painel, iguais em qualquer provedor. */
export const MENSAGEM = {
    ERRO_INESPERADO: "Não foi possível carregar os comentários.",
    SEM_COMENTARIOS: "Nenhum comentário encontrado para este filtro.",
    PAGINACAO_TRUNCADA: "Havia mais páginas de comentários do que o limite configurado. Aumente MAX_PAGES no arquivo .env.",
    CONTADOR_EXIBIDO: "comentário exibido",
    CONTADOR_EXIBIDOS: "comentários exibidos",
    ERRO_PESQUISA: "Não foi possível pesquisar.",
    ERRO_TRECHO_SEM_PERMISSAO: "Alguns comentários não puderam mostrar o trecho de código.",
} as const;

/** Mensagens do painel que citam os termos do provedor ativo. */
export interface MensagensDoProvedor {
    CAMPOS_OBRIGATORIOS: string;
    ERRO_LISTA: string;
    SEM_BUSCA: string;
}

/**
 * Monta as mensagens que mudam de texto conforme o provedor configurado.
 * @param vocabulario Termos do provedor ativo.
 * @returns Mensagens já escritas com o vocabulário do provedor.
 */
export function GetMensagensDoProvedor(vocabulario: Vocabulario): MensagensDoProvedor {
    return {
        CAMPOS_OBRIGATORIOS: `Informe o ${vocabulario.rotuloProjeto} e o ${vocabulario.rotuloNumero} para buscar.`,
        ERRO_LISTA: `Não foi possível carregar os seus ${vocabulario.nomeItemPlural}.`,
        SEM_BUSCA: `Escolha um ${vocabulario.nomeItem} na lista acima, ou preencha os campos e clique em Buscar.`,
    };
}

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
