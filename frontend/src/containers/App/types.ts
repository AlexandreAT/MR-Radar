/**
 * Tentativas de carregar a configuração ao abrir a tela. O backend leva alguns segundos
 * a mais que o frontend para ficar de pé, então as primeiras chamadas podem ser recusadas.
 */
export const TENTATIVAS_CONFIGURACAO = 10;

/** Espera entre as tentativas de carregar a configuração, em milissegundos. */
export const ESPERA_ENTRE_TENTATIVAS_MS = 1000;

/** Mensagens exibidas fora das páginas. */
export const MENSAGEM_APP = {
    ERRO_CONFIGURACAO: "Não foi possível carregar a configuração do backend.",
    CARREGANDO_CONFIGURACAO: "Carregando configuração...",
} as const;
