/** Filtro de status aplicado às threads de comentários. */
export enum StatusFiltro {
    Abertos = "abertos",
    Resolvidos = "resolvidos",
    Todos = "todos",
}

/**
 * Rótulo de revisão que o autor escreve no começo do comentário, no padrão de
 * conventional comments. Os itens estão do pior para o melhor.
 */
export enum RotuloRevisao {
    Issue = "issue",
    Suggestion = "suggestion",
    Nit = "nit",
    Question = "question",
    Praise = "praise",
}

/** Lado do diff em que o comentário foi ancorado. */
export enum LadoDiff {
    Novo = "novo",
    Antigo = "antigo",
}

/** Motivo pelo qual o trecho de código não pôde ser montado. */
export enum CodigoErroTrecho {
    SemPosicao = "SEM_POSICAO",
    SemLinha = "SEM_LINHA",
    RefIndisponivel = "REF_INDISPONIVEL",
    ArquivoNaoEncontrado = "ARQUIVO_NAO_ENCONTRADO",
    ArquivoBinario = "ARQUIVO_BINARIO",
    ArquivoMuitoGrande = "ARQUIVO_MUITO_GRANDE",
    LinhaForaDoArquivo = "LINHA_FORA_DO_ARQUIVO",
    FalhaAoBuscar = "FALHA_AO_BUSCAR",
}

/** Autor de um comentário ou de um Merge Request. */
export interface Autor {
    nome: string;
    usuario: string;
    urlAvatar: string | null;
}

/** Linha exibida dentro do trecho de código. */
export interface LinhaTrecho {
    numero: number;
    texto: string;
    destacada: boolean;
}

/** Trecho de código em volta da linha comentada. */
export interface TrechoCodigo {
    linguagem: string;
    ref: string;
    primeiraLinha: number;
    ultimaLinha: number;
    linhaInicialDestaque: number;
    linhaFinalDestaque: number;
    linhas: LinhaTrecho[];
}

/** Motivo pelo qual não foi possível exibir o trecho de código. */
export interface ErroTrecho {
    codigo: CodigoErroTrecho;
    mensagem: string;
}

/** Resposta enviada dentro de uma thread já existente. */
export interface RespostaComentario {
    id: number;
    autor: Autor;
    corpo: string;
    criadoEm: string;
}

/** Thread de revisão já convertida para o formato usado pelo dashboard. */
export interface ComentarioRevisao {
    id: string;
    comentario: string;
    rotulo: RotuloRevisao | null;
    caminhoArquivo: string | null;
    linha: number | null;
    lado: LadoDiff | null;
    codigo: string | null;
    trecho: TrechoCodigo | null;
    erroTrecho: ErroTrecho | null;
    autor: Autor;
    criadoEm: string;
    atualizadoEm: string;
    resolvido: boolean;
    resolvivel: boolean;
    url: string;
    respostas: RespostaComentario[];
}

/** Dados do Merge Request exibidos no cabeçalho do dashboard. */
export interface MergeRequestResumo {
    iid: number;
    titulo: string;
    url: string;
    situacao: string;
    autor: Autor;
    branchOrigem: string;
    branchDestino: string;
}

/**
 * Contagem das threads encontradas no Merge Request.
 * Cada thread entra em exatamente uma das três categorias, portanto
 * abertos + resolvidos + naoResolviveis é igual a total.
 */
export interface ContagemComentarios {
    total: number;
    abertos: number;
    resolvidos: number;
    naoResolviveis: number;
}

/** Resposta completa da consulta de comentários de um Merge Request. */
export interface RevisaoMergeRequest {
    mergeRequest: MergeRequestResumo;
    contagem: ContagemComentarios;
    comentarios: ComentarioRevisao[];
    consultadoEm: string;
    paginacaoTruncada: boolean;
}

/** De quem são os Merge Requests listados na tela. */
export enum EscopoMergeRequest {
    CriadosPorMim = "criados_por_mim",
    AtribuidosAMim = "atribuidos_a_mim",
}

/** Merge Request aberto exibido no seletor da tela. */
export interface MergeRequestAberto {
    projetoId: string;
    caminhoProjeto: string;
    iid: number;
    titulo: string;
    url: string;
    rascunho: boolean;
    branchOrigem: string;
    branchDestino: string;
    atualizadoEm: string;
    autor: Autor;
    temThreadsAbertas: boolean | null;
    totalComentarios: number;
}

/** Resposta da listagem dos Merge Requests abertos do usuário. */
export interface ListaMergeRequestsAbertos {
    escopo: EscopoMergeRequest;
    mergeRequests: MergeRequestAberto[];
    consultadoEm: string;
    paginacaoTruncada: boolean;
}

/** Parâmetros aceitos na consulta de comentários. */
export interface ParametrosConsultaRevisao {
    projetoId: string;
    mrIid: string;
    status: StatusFiltro;
    linhasContexto: number;
}

/** Dados de configuração que o frontend precisa conhecer. */
export interface ConfiguracaoDashboard {
    urlGitLab: string;
    tokenConfigurado: boolean;
    linhasContexto: number;
    somenteLeitura: boolean;
    problemas: string[];
}
