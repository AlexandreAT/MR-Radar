/** Provedor de código com o qual o dashboard conversa. */
export enum Provedor {
    GitLab = "gitlab",
    GitHub = "github",
}

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
    SemPermissao = "SEM_PERMISSAO",
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
    /** Avisos não fatais (ex.: status de resolução indisponível por falta de permissão do token). */
    avisos?: string[];
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

/**
 * Resposta da pesquisa de Merge Requests por título.
 * Não é limitada a criados ou atribuídos ao dono do token: traz qualquer Merge Request aberto que
 * o token enxergue, para achar o MR de outra pessoa sem saber o projeto e o número de cor.
 */
export interface ResultadoPesquisaMergeRequests {
    termo: string;
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
    provedor: Provedor;
    urlProvedor: string;
    tokenConfigurado: boolean;
    linhasContexto: number;
    somenteLeitura: boolean;
    problemas: string[];
}

/** O que aconteceu com o arquivo entre a branch de destino e a de origem do Merge Request. */
export enum StatusArquivoAlterado {
    Adicionado = "adicionado",
    Removido = "removido",
    Modificado = "modificado",
    Renomeado = "renomeado",
}

/** Papel de uma linha dentro do diff de um arquivo. */
export enum TipoLinhaDiff {
    Contexto = "contexto",
    Adicionada = "adicionada",
    Removida = "removida",
}

/** Uma linha do diff, com a numeração de cada lado quando ela existe naquele lado. */
export interface LinhaDiff {
    tipo: TipoLinhaDiff;
    numeroAntigo: number | null;
    numeroNovo: number | null;
    texto: string;
}

/**
 * Um arquivo alterado no Merge Request, já com o diff recortado nos mesmos blocos que o GitLab e o
 * GitHub mostram (linha alterada mais um pouco de contexto ao redor, nunca o arquivo inteiro).
 */
export interface ArquivoAlterado {
    caminho: string;
    caminhoAntigo: string | null;
    status: StatusArquivoAlterado;
    linguagem: string;
    linhas: LinhaDiff[] | null;
    motivoIndisponivel: string | null;
    adicoes: number | null;
    remocoes: number | null;
}

/** Uma página de arquivos alterados de um Merge Request. */
export interface PaginaArquivosAlterados {
    itens: ArquivoAlterado[];
    proximaPagina: number | null;
    totalArquivos: number | null;
}
