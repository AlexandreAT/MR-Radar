import { DiscussaoNormalizada, NotaNormalizada, PosicaoResolvida } from "../../logica/types";
import { ArquivoAlterado, Autor, LadoDiff, MergeRequestAberto, MergeRequestResumo, SituacaoMergeRequest, StatusArquivoAlterado } from "../../models/Revisao/types";
import { EstaNaListaDeIgnorados } from "../../utilidades/AutorSistema";
import { InterpretarDiffUnificado } from "../../utilidades/DiffUnificado";
import { GetLinguagem } from "../../utilidades/Linguagem";
import {
    ArquivoAlteradoGitHub,
    ComentarioIssueGitHub,
    ComentarioRevisaoGitHub,
    EstadoPullRequestGitHub,
    LadoGitHub,
    PullRequestGitHub,
    StatusArquivoGitHub,
    TipoAlvoComentarioGitHub,
    TipoContaGitHub,
    UsuarioGitHub,
} from "./types";

/** Nome exibido quando o GitHub não informa o autor do comentário. */
const AUTOR_DESCONHECIDO = "Autor desconhecido";

/** Mensagem exibida quando o diff de um arquivo não pôde ser mostrado. */
const MOTIVO_DIFF_INDISPONIVEL = "Arquivo grande demais para exibir aqui — abra o Pull Request no GitHub para ver este arquivo.";

/** Status do GitHub que correspondem a arquivo renomeado ou removido; os demais caem em Modificado. */
const STATUS_POR_GITHUB: Partial<Record<string, StatusArquivoAlterado>> = {
    [StatusArquivoGitHub.Adicionado]: StatusArquivoAlterado.Adicionado,
    [StatusArquivoGitHub.Removido]: StatusArquivoAlterado.Removido,
    [StatusArquivoGitHub.Renomeado]: StatusArquivoAlterado.Renomeado,
};

/** Posição usada quando o comentário não está ancorado em nenhuma linha de arquivo. */
const POSICAO_VAZIA: PosicaoResolvida = {
    caminhoArquivo: null,
    linhaInicial: null,
    linhaFinal: null,
    lado: null,
    refs: [],
};

/** Linha e commit em que o comentário de review deve ser lido. */
interface AncoraDoComentario {
    linhaFinal: number;
    linhaInicial: number;
    ref: string;
}

/** Lado do comentário conforme o campo bruto da API, com o padrão do GitHub quando ele falta. */
const LADO_PADRAO = LadoGitHub.Novo;

/**
 * Converte um Pull Request para o resumo exibido no cabeçalho do dashboard.
 * @param pullRequest Pull Request devolvido pela API.
 * @returns Resumo com título, autor, branches e link.
 */
export function ConverterPullRequest(pullRequest: PullRequestGitHub): MergeRequestResumo {
    return {
        iid: pullRequest.number,
        titulo: pullRequest.title,
        url: pullRequest.html_url,
        situacao: pullRequest.state,
        autor: ConverterAutor(pullRequest.user),
        branchOrigem: pullRequest.head?.ref ?? "",
        branchDestino: pullRequest.base?.ref ?? "",
    };
}

/**
 * Converte um Pull Request para o formato do seletor da tela.
 *
 * O GitHub não expõe em REST se ainda há thread de review sem resolver (isso só existe no
 * GraphQL, por thread), então temThreadsAbertas fica indefinido e a etiqueta não aparece.
 * @param pullRequest Pull Request devolvido pela API.
 * @param projetoId Identificador do repositório, no formato "dono/repositorio".
 * @returns Pull Request pronto para o seletor.
 */
export function ConverterPullRequestAberto(pullRequest: PullRequestGitHub, projetoId: string): MergeRequestAberto {
    return {
        projetoId,
        caminhoProjeto: projetoId,
        iid: pullRequest.number,
        titulo: pullRequest.title,
        url: pullRequest.html_url,
        situacao: getSituacaoPullRequest(pullRequest),
        // Status do chamado só existe para o GitLab, que tem o conceito de chamado vinculado.
        statusChamado: null,
        chamadoValido: null,
        branchOrigem: pullRequest.head?.ref ?? "",
        branchDestino: pullRequest.base?.ref ?? "",
        atualizadoEm: pullRequest.updated_at,
        autor: ConverterAutor(pullRequest.user),
        temThreadsAbertas: null,
        totalComentarios: (pullRequest.comments ?? 0) + (pullRequest.review_comments ?? 0),
    };
}

/**
 * Descobre a situação do Pull Request. O GitHub só tem "open"/"closed" no campo state — um
 * fechado sem ser mesclado e um mesclado têm o mesmo state, e só merged_at distingue os dois.
 * @param pullRequest Pull Request devolvido pela API.
 * @returns Situação no formato de domínio.
 */
function getSituacaoPullRequest(pullRequest: PullRequestGitHub): SituacaoMergeRequest {
    if (pullRequest.state !== EstadoPullRequestGitHub.Fechado)
        return SituacaoMergeRequest.Aberto;

    return pullRequest.merged_at ? SituacaoMergeRequest.Mesclado : SituacaoMergeRequest.Fechado;
}

/**
 * Monta as threads de revisão a partir dos dois tipos de comentário que o GitHub tem.
 *
 * Comentário de review é ancorado em uma linha e pode ser resolvido; comentário de issue é o
 * comentário geral do Pull Request, que não tem posição nem resolução — o mesmo papel dos
 * comentários gerais do GitLab.
 * @param comentariosRevisao Comentários de review do Pull Request.
 * @param comentariosIssue Comentários gerais do Pull Request.
 * @param autoresIgnorados Nomes de usuário extras a sempre ignorar, vindos da configuração.
 * @param refBaseDiff Commit da base do Pull Request, usado para buscar o arquivo em comentários
 * do lado antigo do diff. Nulo quando o Pull Request não pôde ser lido.
 * @returns Threads normalizadas, sem as de bots.
 */
export function MontarDiscussoes(
    comentariosRevisao: ComentarioRevisaoGitHub[],
    comentariosIssue: ComentarioIssueGitHub[],
    autoresIgnorados: string[],
    refBaseDiff: string | null,
): DiscussaoNormalizada[] {
    const threads: DiscussaoNormalizada[] = [];
    const threadPorId = new Map<number, DiscussaoNormalizada>();

    // A raiz de cada resposta é guardada porque uma resposta pode apontar para outra resposta,
    // e todas pertencem à mesma thread da primeira mensagem.
    const raizPorComentario = new Map<number, number>();

    ordenarPorCriacao(comentariosRevisao).forEach((comentario) => {
        if (ehAutorSistemaGitHub(comentario.user, autoresIgnorados))
            return;

        const idDaRaiz: number | undefined = comentario.in_reply_to_id === undefined ? undefined : raizPorComentario.get(comentario.in_reply_to_id) ?? comentario.in_reply_to_id;

        if (idDaRaiz === undefined) {
            const thread: DiscussaoNormalizada = {
                id: String(comentario.id),
                notaPrincipal: converterComentarioRevisao(comentario),
                respostas: [],
                resolvivel: true,
                resolvido: false,
                posicao: resolverPosicao(comentario, refBaseDiff),
            };

            threads.push(thread);
            threadPorId.set(comentario.id, thread);
            raizPorComentario.set(comentario.id, comentario.id);
            return;
        }

        raizPorComentario.set(comentario.id, idDaRaiz);
        const thread: DiscussaoNormalizada | undefined = threadPorId.get(idDaRaiz);

        // A raiz pode ter sido descartada por ser de bot: a primeira resposta assume o lugar dela
        // e fica registrada também sob o id da raiz ausente, para as próximas respostas caírem
        // na mesma thread em vez de abrir uma nova a cada uma.
        if (!thread) {
            const solta: DiscussaoNormalizada = {
                id: String(comentario.id),
                notaPrincipal: converterComentarioRevisao(comentario),
                respostas: [],
                resolvivel: true,
                resolvido: false,
                posicao: resolverPosicao(comentario, refBaseDiff),
            };

            threads.push(solta);
            threadPorId.set(idDaRaiz, solta);
            threadPorId.set(comentario.id, solta);
            return;
        }

        thread.respostas.push(converterComentarioRevisao(comentario));
    });

    ordenarPorCriacao(comentariosIssue).forEach((comentario) => {
        if (ehAutorSistemaGitHub(comentario.user, autoresIgnorados))
            return;

        threads.push({
            id: String(comentario.id),
            notaPrincipal: converterComentarioIssue(comentario),
            respostas: [],
            resolvivel: false,
            resolvido: false,
            posicao: POSICAO_VAZIA,
        });
    });

    return threads;
}

/**
 * Ordena comentários da mais antiga para a mais nova criação.
 * A ordem importa para a resposta sempre encontrar a raiz da thread já criada.
 * @param comentarios Comentários a ordenar.
 * @returns Nova lista ordenada.
 */
function ordenarPorCriacao<T extends { created_at: string }>(comentarios: T[]): T[] {
    return [...comentarios].sort((primeiro, segundo) => primeiro.created_at.localeCompare(segundo.created_at));
}

/**
 * Indica se o autor do comentário é um bot ou um autor ignorado na configuração.
 * @param usuario Autor devolvido pela API.
 * @param autoresIgnorados Nomes de usuário configurados em IGNORED_AUTHORS.
 * @returns Verdadeiro quando o comentário deve ser descartado.
 */
function ehAutorSistemaGitHub(usuario: UsuarioGitHub | null | undefined, autoresIgnorados: string[]): boolean {
    if (!usuario)
        return false;

    if (usuario.type === TipoContaGitHub.Bot)
        return true;

    return EstaNaListaDeIgnorados(usuario.login, autoresIgnorados);
}

/**
 * Indica se o início e o fim do comentário estão no mesmo lado do diff.
 *
 * O GitHub permite marcar um intervalo que começa em uma linha removida e termina em uma
 * adicionada. Nesse caso as duas pontas pertencem a versões diferentes do arquivo e a numeração
 * não é comparável — só a linha âncora pode ser destacada.
 * @param comentario Comentário de review devolvido pela API.
 * @returns Verdadeiro quando início e fim estão na mesma versão do arquivo.
 */
function ehIntervaloDoMesmoLado(comentario: ComentarioRevisaoGitHub): boolean {
    const lado: string = comentario.side ?? LADO_PADRAO;
    const ladoInicial: string = comentario.start_side ?? lado;

    return ladoInicial === lado;
}

/**
 * Descobre em que linha e em qual commit o comentário de review deve ser lido.
 *
 * O GitHub devolve dois pares de campos: os atuais (line/start_line, válidos em commit_id) e os
 * originais (original_line/original_start_line, válidos em original_commit_id). Em comentário
 * desatualizado os atuais vêm nulos. Misturar os dois pares mostraria outra versão do arquivo,
 * então cada linha só é buscada no commit em que ela vale. Quando o intervalo cruza os dois lados
 * do diff (começo removido, fim adicionado), só a linha final é usada como âncora.
 * @param comentario Comentário de review devolvido pela API.
 * @returns Linha inicial, final e o commit correspondente, ou nulo quando não há linha.
 */
function getAncora(comentario: ComentarioRevisaoGitHub): AncoraDoComentario | null {
    if (comentario.subject_type === TipoAlvoComentarioGitHub.Arquivo)
        return null;

    const mesmoLado: boolean = ehIntervaloDoMesmoLado(comentario);

    if (comentario.line !== null && comentario.line !== undefined)
        return {
            linhaFinal: comentario.line,
            linhaInicial: (mesmoLado ? comentario.start_line : null) ?? comentario.line,
            ref: comentario.commit_id,
        };

    if (comentario.original_line !== null && comentario.original_line !== undefined)
        return {
            linhaFinal: comentario.original_line,
            linhaInicial: (mesmoLado ? comentario.original_start_line : null) ?? comentario.original_line,
            ref: comentario.original_commit_id,
        };

    return null;
}

/**
 * Monta a lista de commits em que o arquivo pode ser buscado.
 *
 * commit_id e original_commit_id são sempre commits do head do Pull Request: servem para o lado
 * novo, mas não para o antigo. No lado antigo a linha é numeração do arquivo base, e buscar no
 * head mostraria outra versão do arquivo — por isso o lado antigo usa o commit da base do diff.
 * @param ehLadoAntigo Indica se o comentário está no lado antigo do diff.
 * @param refDoHead Commit do head em que a linha do comentário vale, quando o lado é o novo.
 * @param refBaseDiff Commit da base do Pull Request, ou nulo quando não foi possível obtê-lo.
 * @returns Commits candidatos, ou lista vazia quando não há ref do lado correto.
 */
function getRefsCandidatas(ehLadoAntigo: boolean, refDoHead: string, refBaseDiff: string | null): string[] {
    if (!ehLadoAntigo)
        return refDoHead ? [refDoHead] : [];

    return refBaseDiff ? [refBaseDiff] : [];
}

/**
 * Interpreta a posição de um comentário de review.
 * @param comentario Comentário de review devolvido pela API.
 * @param refBaseDiff Commit da base do Pull Request, usado quando o comentário está no lado antigo.
 * @returns Arquivo, linhas e commit para montar o trecho.
 */
function resolverPosicao(comentario: ComentarioRevisaoGitHub, refBaseDiff: string | null): PosicaoResolvida {
    const ancora: AncoraDoComentario | null = getAncora(comentario);

    if (!ancora)
        return { ...POSICAO_VAZIA, caminhoArquivo: comentario.path ?? null };

    const ehLadoAntigo: boolean = comentario.side === LadoGitHub.Antigo;

    return {
        caminhoArquivo: comentario.path ?? null,
        linhaInicial: Math.min(ancora.linhaInicial, ancora.linhaFinal),
        linhaFinal: Math.max(ancora.linhaInicial, ancora.linhaFinal),
        lado: ehLadoAntigo ? LadoDiff.Antigo : LadoDiff.Novo,
        refs: getRefsCandidatas(ehLadoAntigo, ancora.ref, refBaseDiff),
    };
}

/**
 * Converte um comentário de review para o formato normalizado.
 * @param comentario Comentário bruto da API.
 * @returns Nota pronta para a lógica de domínio.
 */
function converterComentarioRevisao(comentario: ComentarioRevisaoGitHub): NotaNormalizada {
    return {
        id: comentario.id,
        url: comentario.html_url,
        autor: ConverterAutor(comentario.user),
        corpo: comentario.body,
        criadoEm: comentario.created_at,
        atualizadoEm: comentario.updated_at,
    };
}

/**
 * Converte um comentário geral do Pull Request para o formato normalizado.
 * @param comentario Comentário bruto da API.
 * @returns Nota pronta para a lógica de domínio.
 */
function converterComentarioIssue(comentario: ComentarioIssueGitHub): NotaNormalizada {
    return {
        id: comentario.id,
        url: comentario.html_url,
        autor: ConverterAutor(comentario.user),
        corpo: comentario.body,
        criadoEm: comentario.created_at,
        atualizadoEm: comentario.updated_at,
    };
}

/**
 * Converte o autor devolvido pelo GitHub para o formato de domínio.
 * @param usuario Autor bruto da API.
 * @returns Autor com os campos usados na tela.
 */
export function ConverterAutor(usuario: UsuarioGitHub | null | undefined): Autor {
    return {
        nome: usuario?.name || usuario?.login || AUTOR_DESCONHECIDO,
        usuario: usuario?.login ?? "",
        urlAvatar: usuario?.avatar_url ?? null,
    };
}

/**
 * Converte o diff de um arquivo do GitHub para o formato de domínio.
 *
 * additions/deletions vêm sempre prontos da API, mesmo quando patch está ausente (arquivo grande
 * demais ou binário) — por isso a contagem usa os campos da API, e não as linhas interpretadas,
 * diferente do GitLab (que não expõe essa contagem pronta).
 * @param arquivo Arquivo alterado bruto, devolvido pela API.
 * @param maxLinhas Quantidade máxima de linhas de diff aceitas para este arquivo.
 * @returns Arquivo alterado no formato de domínio.
 */
export function ConverterArquivoAlterado(arquivo: ArquivoAlteradoGitHub, maxLinhas: number): ArquivoAlterado {
    const linhas = arquivo.patch ? InterpretarDiffUnificado(arquivo.patch, maxLinhas) : null;

    return {
        caminho: arquivo.filename,
        caminhoAntigo: arquivo.status === StatusArquivoGitHub.Renomeado ? arquivo.previous_filename ?? null : null,
        status: STATUS_POR_GITHUB[arquivo.status] ?? StatusArquivoAlterado.Modificado,
        linguagem: GetLinguagem(arquivo.filename),
        linhas,
        motivoIndisponivel: linhas ? null : MOTIVO_DIFF_INDISPONIVEL,
        adicoes: arquivo.additions,
        remocoes: arquivo.deletions,
    };
}
