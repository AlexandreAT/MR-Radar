/** Cabeçalhos usados nas chamadas à API do GitHub. */
export enum CabecalhoGitHub {
    Autorizacao = "Authorization",
    VersaoApi = "X-GitHub-Api-Version",
    Paginacao = "link",
    TentarApos = "retry-after",
    ReinicioLimite = "x-ratelimit-reset",
    LimiteRestante = "x-ratelimit-remaining",
}

/** Limites e valores fixos das chamadas à API. */
export const API_GITHUB = {
    ITENS_POR_PAGINA: 100,
    MAX_TENTATIVAS_LIMITE: 2,
    ESPERA_MAX_MS: 15000,
    ESPERA_BASE_MS: 1000,
    MAX_CARACTERES_MENSAGEM_ERRO: 300,
    MILISSEGUNDOS_POR_SEGUNDO: 1000,
    VERSAO_API: "2022-11-28",
    ACEITA_JSON: "application/vnd.github+json",
    USER_AGENT: "mr-radar/0.1 (local, somente leitura)",
    /** Acima disso a Contents API para de mandar o conteúdo em base64 dentro do JSON. */
    TAMANHO_MAX_CONTEUDO_JSON_BYTES: 1024 * 1024,
    /** A Search API só alcança até esta posição nos resultados, não importa o total_count real. */
    MAX_RESULTADOS_BUSCA: 1000,
} as const;

/** Filtro da busca que corresponde a cada escopo exibido na tela. */
export enum FiltroBuscaGitHub {
    CriadosPorMim = "author:@me",
    AtribuidosAMim = "assignee:@me",
}

/** Lado do diff em que um comentário de review foi ancorado. */
export enum LadoGitHub {
    Novo = "RIGHT",
    Antigo = "LEFT",
}

/** Tipo de conta do autor. Contas de aplicativo (bots) vêm marcadas assim. */
export enum TipoContaGitHub {
    Bot = "Bot",
}

/** A que o comentário de review está ancorado: uma linha do diff ou o arquivo inteiro. */
export enum TipoAlvoComentarioGitHub {
    Linha = "line",
    Arquivo = "file",
}

/** Codificação usada pela API de conteúdo de arquivo. */
export enum CodificacaoConteudoGitHub {
    Base64 = "base64",
    /** Acima de 1 MB a API não manda o conteúdo em JSON: responde "none" e conteúdo vazio. */
    Nenhuma = "none",
}

/** Autor de um comentário ou de um Pull Request, como devolvido pelo GitHub. */
export interface UsuarioGitHub {
    login: string;
    name?: string | null;
    avatar_url: string | null;
    type: string;
}

/** Ponta de um Pull Request (branch de origem ou de destino). */
export interface RefGitHub {
    ref: string;
    sha: string;
}

/** Pull Request como devolvido pelos endpoints de detalhe e de listagem. */
export interface PullRequestGitHub {
    number: number;
    title: string;
    html_url: string;
    state: string;
    /** Preenchido só quando o Pull Request foi mesclado — nulo mesmo já fechado sem mesclar. */
    merged_at: string | null;
    draft?: boolean;
    user: UsuarioGitHub | null;
    head: RefGitHub;
    base: RefGitHub;
    updated_at: string;
    comments?: number;
    review_comments?: number;
}

/**
 * Comentário de review, ancorado em uma linha do diff.
 *
 * Quando o comentário fica desatualizado (a linha não existe mais no head atual), a API devolve
 * line/start_line nulos e só os campos original_*, que valem no original_commit_id.
 */
export interface ComentarioRevisaoGitHub {
    id: number;
    html_url: string;
    body: string;
    user: UsuarioGitHub | null;
    created_at: string;
    updated_at: string;
    path: string;
    line: number | null;
    original_line: number | null;
    start_line: number | null;
    original_start_line: number | null;
    side: string | null;
    start_side: string | null;
    commit_id: string;
    original_commit_id: string;
    in_reply_to_id?: number;
    subject_type?: string;
}

/** Comentário geral do Pull Request, que o GitHub trata como comentário de issue. */
export interface ComentarioIssueGitHub {
    id: number;
    html_url: string;
    body: string;
    user: UsuarioGitHub | null;
    created_at: string;
    updated_at: string;
}

/**
 * Item devolvido pela busca de Pull Requests. Não traz as branches nem a contagem de comentários
 * de review — para isso é preciso buscar o Pull Request em si.
 */
export interface ItemBuscaGitHub {
    number: number;
    title: string;
    html_url: string;
    state: string;
    draft?: boolean;
    user: UsuarioGitHub | null;
    updated_at: string;
    comments?: number;
    repository_url: string;
}

/** Resposta da busca de issues e Pull Requests. */
export interface ResultadoBuscaGitHub {
    total_count: number;
    incomplete_results: boolean;
    items: ItemBuscaGitHub[];
}

/** Repositório que o dono do token enxerga, usado para restringir a pesquisa por título. */
export interface RepositorioGitHub {
    full_name: string;
}

/** Situação aceita ao listar Pull Requests de um repositório. */
export enum EstadoPullRequestGitHub {
    Aberto = "open",
    /** Cobre fechado e mesclado — o GitHub não distingue os dois neste filtro. */
    Fechado = "closed",
}

/** Conteúdo de um arquivo devolvido pela API de conteúdo. */
export interface ConteudoArquivoGitHub {
    content?: string;
    encoding?: string;
    size?: number;
}

/** Status de um arquivo alterado, como devolvido pela API de arquivos do Pull Request. */
export enum StatusArquivoGitHub {
    Adicionado = "added",
    Removido = "removed",
    Modificado = "modified",
    Renomeado = "renamed",
    Copiado = "copied",
    Alterado = "changed",
    SemMudanca = "unchanged",
}

/**
 * Um arquivo alterado do Pull Request.
 * "patch" vem ausente quando o arquivo é grande demais ou binário — nesse caso "additions" e
 * "deletions" continuam vindo, mesmo sem o diff linha a linha.
 */
export interface ArquivoAlteradoGitHub {
    filename: string;
    previous_filename?: string;
    status: string;
    additions: number;
    deletions: number;
    patch?: string;
}
