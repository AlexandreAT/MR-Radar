/** Resultado de uma consulta paginada a um provedor. */
export interface PaginaResultado<T> {
    itens: T[];
    truncada: boolean;
    /** Avisos não fatais sobre esta consulta (ex.: um detalhe que não pôde ser lido por permissão). */
    avisos?: string[];
}

/** Limites de transporte HTTP comuns a qualquer provedor, independentes de formato de API. */
export const LIMITE_HTTP = {
    MAX_REDIRECIONAMENTOS: 3,
    TAMANHO_MAX_RESPOSTA_BYTES: 8 * 1024 * 1024,
} as const;
