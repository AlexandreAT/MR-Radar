/** Nomes das variáveis aceitas no arquivo .env. */
export enum VariavelEnv {
    UrlGitLab = "GITLAB_URL",
    Token = "GITLAB_TOKEN",
    Porta = "PORT",
    Host = "HOST",
    LinhasContexto = "CONTEXT_LINES",
    TimeoutRequisicao = "REQUEST_TIMEOUT_MS",
    MaxPaginas = "MAX_PAGES",
    TempoCacheArquivo = "FILE_CACHE_TTL_MS",
    AutoresIgnorados = "IGNORED_AUTHORS",
}

/** Valores usados quando a variável correspondente não está no .env. */
export const CONFIGURACAO_PADRAO = {
    PORTA: 3001,
    HOST: "127.0.0.1",
    LINHAS_CONTEXTO: 3,
    TIMEOUT_REQUISICAO_MS: 20000,
    MAX_PAGINAS: 20,
    TEMPO_CACHE_ARQUIVO_MS: 600000,
} as const;

/** Limites fixos de segurança, propositalmente não configuráveis pelo .env. */
export const LIMITE = {
    TAMANHO_MAX_ARQUIVO_BYTES: 2 * 1024 * 1024,
    CONSULTAS_SIMULTANEAS: 5,
    LINHAS_CONTEXTO_MAX: 30,
    PORTA_MIN: 1,
    PORTA_MAX: 65535,
    TIMEOUT_MIN_MS: 1000,
    TIMEOUT_MAX_MS: 120000,
    MAX_PAGINAS_LIMITE: 200,
} as const;

/** Valor de exemplo do .env.example, que não pode ser usado como token real. */
export const TOKEN_EXEMPLO = "cole_seu_token_aqui";

/** Configuração da aplicação, montada a partir do arquivo .env. */
export interface ConfiguracaoApp {
    urlGitLab: string;
    token: string;
    porta: number;
    host: string;
    linhasContexto: number;
    timeoutRequisicaoMs: number;
    maxPaginas: number;
    tempoCacheArquivoMs: number;
    tamanhoMaxArquivoBytes: number;
    consultasSimultaneas: number;
    arquivosEnvCarregados: string[];
    autoresIgnorados: string[];
}
