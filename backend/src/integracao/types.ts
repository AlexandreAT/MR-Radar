/** Resultado de uma consulta paginada a um provedor. */
export interface PaginaResultado<T> {
    itens: T[];
    truncada: boolean;
    /** Avisos não fatais sobre esta consulta (ex.: um detalhe que não pôde ser lido por permissão). */
    avisos?: string[];
}

/**
 * Resultado de uma consulta com paginação real, por número de página fixo — diferente de
 * PaginaResultado, que traz tudo até o limite de segurança de uma vez.
 */
export interface PaginaNumerada<T> {
    itens: T[];
    pagina: number;
    totalPaginas: number;
    totalItens: number;
    /** Verdadeiro quando o total pode ser maior que o real: a coleta parou no limite de segurança. */
    truncada: boolean;
}

/** Limites de transporte HTTP comuns a qualquer provedor, independentes de formato de API. */
export const LIMITE_HTTP = {
    MAX_REDIRECIONAMENTOS: 3,
    TAMANHO_MAX_RESPOSTA_BYTES: 8 * 1024 * 1024,
} as const;
