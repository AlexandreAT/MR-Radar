/** Códigos de erro devolvidos pela integração com o GitLab. */
export enum CodigoErroGitLab {
    ConfiguracaoInvalida = "CONFIGURACAO_INVALIDA",
    ParametroInvalido = "PARAMETRO_INVALIDO",
    TokenInvalido = "TOKEN_INVALIDO",
    AcessoNegado = "ACESSO_NEGADO",
    NaoEncontrado = "NAO_ENCONTRADO",
    LimiteRequisicoes = "LIMITE_REQUISICOES",
    ErroServidorGitLab = "ERRO_SERVIDOR_GITLAB",
    RespostaInesperada = "RESPOSTA_INESPERADA",
    FalhaRede = "FALHA_REDE",
    TempoEsgotado = "TEMPO_ESGOTADO",
    ArquivoMuitoGrande = "ARQUIVO_MUITO_GRANDE",
    ArquivoBinario = "ARQUIVO_BINARIO",
}

/** Cabeçalhos usados nas chamadas à API do GitLab. */
export enum CabecalhoGitLab {
    Token = "PRIVATE-TOKEN",
    ProximaPagina = "x-next-page",
    TentarApos = "retry-after",
    ReinicioLimite = "ratelimit-reset",
}

/** Escopo aceito pela API do GitLab ao listar Merge Requests do usuário. */
export enum EscopoGitLab {
    CriadosPorMim = "created_by_me",
    AtribuidosAMim = "assigned_to_me",
}

/** Situação de issue usada nas consultas. */
export enum EstadoIssueGitLab {
    Todas = "all",
}

/** Ordem em que as notas são lidas, para poder aplicá-las na sequência em que aconteceram. */
export const ORDEM_NOTAS = {
    CAMPO: "created_at",
    SENTIDO: "asc",
} as const;

/** Situação de Merge Request usada nas consultas. */
export enum EstadoMergeRequestGitLab {
    Aberto = "opened",
}

/** Tipo de posição em que um comentário pode ser ancorado no diff. */
export enum TipoPosicaoGitLab {
    Texto = "text",
    Imagem = "image",
    Arquivo = "file",
}

/** Limites e valores fixos das chamadas à API. */
export const API_GITLAB = {
    CAMINHO_BASE: "/api/v4",
    ITENS_POR_PAGINA: 100,
    MAX_TENTATIVAS_LIMITE: 2,
    MAX_REDIRECIONAMENTOS: 3,
    TAMANHO_MAX_RESPOSTA_BYTES: 8 * 1024 * 1024,
    ESPERA_MAX_MS: 15000,
    ESPERA_BASE_MS: 1000,
    MAX_CARACTERES_MENSAGEM_ERRO: 300,
    MILISSEGUNDOS_POR_SEGUNDO: 1000,
    USER_AGENT: "mr-radar/0.1 (local, somente leitura)",
} as const;

/** Erro pronto para cada status HTTP conhecido devolvido pelo GitLab. */
export interface DefinicaoErroHttp {
    codigo: CodigoErroGitLab;
    mensagem: string;
    status: number;
    dica: string;
}

/** Autor de um comentário ou de um Merge Request, como devolvido pelo GitLab. */
export interface AutorGitLab {
    id: number;
    name: string;
    username: string;
    avatar_url: string | null;
    web_url: string;
}

/** Extremidade de um comentário que cobre várias linhas. */
export interface ExtremidadeIntervaloGitLab {
    line_code: string;
    type: string | null;
    old_line: number | null;
    new_line: number | null;
}

/** Intervalo de linhas de um comentário multilinha. */
export interface IntervaloLinhasGitLab {
    start: ExtremidadeIntervaloGitLab | null;
    end: ExtremidadeIntervaloGitLab | null;
}

/** Posição de um comentário dentro do diff do Merge Request. */
export interface PosicaoGitLab {
    base_sha: string | null;
    start_sha: string | null;
    head_sha: string | null;
    old_path: string | null;
    new_path: string | null;
    position_type: string;
    old_line: number | null;
    new_line: number | null;
    line_range?: IntervaloLinhasGitLab | null;
}

/** Comentário individual dentro de uma thread. */
export interface NotaGitLab {
    id: number;
    body: string;
    author: AutorGitLab;
    created_at: string;
    updated_at: string;
    system: boolean;
    resolvable: boolean;
    resolved?: boolean;
    resolved_by?: AutorGitLab | null;
    resolved_at?: string | null;
    position?: PosicaoGitLab | null;
}

/** Thread de comentários de um Merge Request. */
export interface DiscussaoGitLab {
    id: string;
    individual_note: boolean;
    notes: NotaGitLab[];
}

/** Dados do Merge Request usados no cabeçalho do dashboard. */
export interface MergeRequestGitLab {
    iid: number;
    title: string;
    web_url: string;
    state: string;
    author: AutorGitLab;
    source_branch: string;
    target_branch: string;
    updated_at: string;
}

/** Identificadores curtos de um Merge Request, como "grupo/projeto!123". */
export interface ReferenciasGitLab {
    short: string;
    relative: string;
    full: string;
}

/** Merge Request como aparece na listagem geral, usada para montar o seletor da tela. */
export interface MergeRequestListaGitLab {
    iid: number;
    project_id: number;
    title: string;
    web_url: string;
    state: string;
    source_branch: string;
    target_branch: string;
    updated_at: string;
    author: AutorGitLab;
    draft?: boolean;
    work_in_progress?: boolean;
    references?: ReferenciasGitLab | null;
    blocking_discussions_resolved?: boolean | null;
    user_notes_count?: number;
}

/** Usuário dono do token, como devolvido pelo GitLab. */
export interface UsuarioGitLab {
    id: number;
    username: string;
    name: string;
    email: string;
    commit_email?: string | null;
}

/** Contagem de tempo estimado e gasto em uma issue. */
export interface EstatisticasTempoGitLab {
    time_estimate: number;
    total_time_spent: number;
    human_time_estimate: string | null;
    human_total_time_spent: string | null;
}

/** Issue como aparece na listagem do usuário. */
export interface IssueGitLab {
    id: number;
    iid: number;
    project_id: number;
    title: string;
    state: string;
    web_url: string;
    updated_at: string;
    references?: ReferenciasGitLab | null;
    time_stats?: EstatisticasTempoGitLab | null;
}

/**
 * Merge Request relacionado a uma issue — o vínculo em que os commits de trabalho ficam.
 * A API não devolve commits a partir da issue diretamente, só a lista de Merge Requests ligados a ela.
 */
export interface MergeRequestRelacionadoGitLab {
    iid: number;
    project_id: number;
}

/** Commit de um Merge Request, usado para descobrir em que dia o autor trabalhou na issue. */
export interface CommitGitLab {
    author_name: string;
    author_email: string | null;
    committed_date: string;
}

/** Tipo de item devolvido pela árvore do repositório. */
export enum TipoItemArvoreGitLab {
    Arquivo = "blob",
    Pasta = "tree",
    Submodulo = "commit",
}

/** Item (arquivo ou pasta) devolvido pela árvore do repositório em um commit. */
export interface ItemArvoreGitLab {
    id: string;
    name: string;
    type: TipoItemArvoreGitLab;
    path: string;
}

/** Resultado de uma consulta paginada à API. */
export interface PaginaGitLab<T> {
    itens: T[];
    truncada: boolean;
}
