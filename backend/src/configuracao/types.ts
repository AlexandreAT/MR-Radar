import { Provedor } from "../models/Revisao/types";

export { Provedor };

/** Nomes das variáveis aceitas no arquivo .env. */
export enum VariavelEnv {
    Provedor = "PROVEDOR",
    UrlGitLab = "GITLAB_URL",
    TokenGitLab = "GITLAB_TOKEN",
    UrlGitHub = "GITHUB_URL",
    TokenGitHub = "GITHUB_TOKEN",
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
    PROVEDOR: Provedor.GitLab,
    PORTA: 3001,
    HOST: "127.0.0.1",
    LINHAS_CONTEXTO: 3,
    TIMEOUT_REQUISICAO_MS: 20000,
    MAX_PAGINAS: 20,
    TEMPO_CACHE_ARQUIVO_MS: 600000,
    URL_GITHUB_PUBLICO: "https://api.github.com",
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
    /** Arquivos por página ao listar os arquivos alterados de um Merge Request. */
    ARQUIVOS_ALTERADOS_POR_PAGINA: 20,
    /** Itens por página ao listar ou pesquisar Merge Requests encerrados (fechados ou mesclados). */
    MERGE_REQUESTS_ENCERRADOS_POR_PAGINA: 20,
    /** Acima disso, o diff de um arquivo entra como indisponível em vez de ser exibido. */
    MAX_LINHAS_DIFF_POR_ARQUIVO: 1000,
    /** Abaixo disso, a pesquisa de Merge Requests por título nem chega a ser feita. */
    TERMO_PESQUISA_MIN_CARACTERES: 3,
} as const;

/** Valor de exemplo do .env.example, que não pode ser usado como token real. */
export const TOKEN_EXEMPLO = "cole_seu_token_aqui";

/**
 * Domínio reservado para exemplos (RFC 2606), usado nas URLs do .env.example. Nunca é uma
 * instância real: o backend se recusa a mandar o token para ele.
 */
export const DOMINIO_EXEMPLO = "example.com";

/**
 * Configuração da aplicação, montada a partir do arquivo .env.
 * urlBase e token já são os do provedor ativo: o resto do backend não precisa saber de qual
 * variável do .env eles vieram.
 */
export interface ConfiguracaoApp {
    provedor: Provedor;
    urlBase: string;
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
