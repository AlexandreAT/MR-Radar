import { DiscussaoNormalizada, NotaNormalizada, PosicaoResolvida } from "../../logica/types";
import { ArquivoAlterado, Autor, LadoDiff, LinhaDiff, MergeRequestAberto, MergeRequestResumo, SituacaoMergeRequest, StatusArquivoAlterado, StatusChamado, TipoLinhaDiff } from "../../models/Revisao/types";
import { EstaNaListaDeIgnorados } from "../../utilidades/AutorSistema";
import { InterpretarDiffUnificado } from "../../utilidades/DiffUnificado";
import { GetLinguagem } from "../../utilidades/Linguagem";
import {
    AutorGitLab,
    DiffArquivoGitLab,
    DiscussaoGitLab,
    ExtremidadeIntervaloGitLab,
    MergeRequestGitLab,
    MergeRequestListaGitLab,
    NotaGitLab,
    PosicaoGitLab,
    TipoPosicaoGitLab,
} from "./types";

/** Nome exibido quando o GitLab não informa o autor do comentário. */
const AUTOR_DESCONHECIDO = "Autor desconhecido";

/** Mensagem exibida quando o diff de um arquivo não pôde ser mostrado. */
const MOTIVO_DIFF_INDISPONIVEL = "Arquivo grande demais para exibir aqui — abra o Merge Request no GitLab para ver este arquivo.";

/** Separador entre o caminho do projeto e o IID na referência do GitLab. */
const SEPARADOR_REFERENCIA = "!";

/**
 * Situação correspondente a cada estado bruto do GitLab. "locked" é tratado como Fechado: é um
 * estado raro (trava a discussão sem decidir o destino do código) e não justifica uma quarta opção
 * na tela.
 */
const SITUACAO_POR_ESTADO_GITLAB: Record<string, SituacaoMergeRequest> = {
    opened: SituacaoMergeRequest.Aberto,
    closed: SituacaoMergeRequest.Fechado,
    merged: SituacaoMergeRequest.Mesclado,
    locked: SituacaoMergeRequest.Fechado,
};

/**
 * Tag de cada status conhecido do quadro, já normalizada — o quadro tem tags digitadas por
 * pessoas diferentes, então a mesma tag aparece com e sem acento em chamados diferentes (ex.:
 * "Válido" e "Valido", confirmado em chamados reais). A comparação ignora acento e maiúscula.
 */
const STATUS_CHAMADO_POR_TAG_NORMALIZADA: Record<string, StatusChamado> = {
    started: StatusChamado.Started,
    testing: StatusChamado.Testing,
    "ready for development": StatusChamado.ReadyForDevelopment,
    revision: StatusChamado.Revision,
};

/** Tags de validade do chamado, já normalizadas (ver STATUS_CHAMADO_POR_TAG_NORMALIZADA). */
const TAG_CHAMADO_VALIDO_NORMALIZADA = "valido";
const TAG_CHAMADO_INVALIDO_NORMALIZADA = "invalido";

/**
 * Remove acentuação e normaliza maiúsculas/minúsculas de uma tag do GitLab, para reconhecer a
 * mesma tag digitada de formas diferentes no quadro.
 * @param tag Tag como veio da API.
 * @returns Tag em minúsculas e sem acento.
 */
function normalizarTag(tag: string): string {
    return tag
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .trim()
        .toLowerCase();
}

/**
 * Nome de usuário que o próprio GitLab gera para bots de Project/Group Access Token,
 * no formato "project_<id>_bot_<hash>" ou "group_<id>_bot_<hash>". Vale para qualquer instância.
 */
const PADRAO_BOT_TOKEN_GITLAB = /^(project|group)_\d+_bot(_[0-9a-f]+)?$/i;

/** Posição usada quando o comentário não está ancorado em nenhum arquivo. */
const POSICAO_VAZIA: PosicaoResolvida = {
    caminhoArquivo: null,
    linhaInicial: null,
    linhaFinal: null,
    lado: null,
    refs: [],
};

/** Primeira e última linha que devem aparecer destacadas no trecho. */
interface IntervaloDestaque {
    inicial: number | null;
    final: number | null;
}

/**
 * Converte as threads do GitLab para o formato de domínio, descartando notas automáticas e notas
 * de bots (do próprio GitLab ou configurados em IGNORED_AUTHORS).
 * @param discussoes Threads devolvidas pela API do GitLab.
  * @param autoresIgnorados Nomes de usuário extras a sempre ignorar, vindos da configuração.
 * @param urlMergeRequest URL do Merge Request, usada para montar o link de cada nota.
 * @returns Threads normalizadas, sem as que contêm só mensagens de sistema ou de bots.
 */
export function NormalizarDiscussoes(discussoes: DiscussaoGitLab[], autoresIgnorados: string[], urlMergeRequest: string): DiscussaoNormalizada[] {
    return discussoes.reduce<DiscussaoNormalizada[]>((normalizadas, discussao) => {
        const notas: NotaGitLab[] = (discussao.notes ?? []).filter((nota) => !nota.system && !ehAutorSistemaGitLab(nota.author?.username, autoresIgnorados));

        if (!notas.length)
            return normalizadas;

        const notaPrincipal: NotaGitLab = notas[0];
        const notasResolviveis: NotaGitLab[] = notas.filter((nota) => nota.resolvable);

        normalizadas.push({
            id: discussao.id,
            notaPrincipal: converterNota(notaPrincipal, urlMergeRequest),
            respostas: notas.slice(1).map((nota) => converterNota(nota, urlMergeRequest)),
            resolvivel: notasResolviveis.length > 0,
            resolvido: notasResolviveis.length > 0 && notasResolviveis.every((nota) => nota.resolved === true),
            posicao: resolverPosicao(notas.find((nota) => nota.position)?.position ?? null),
        });

        return normalizadas;
    }, []);
}

/**
 * Indica se o autor de uma nota é um bot ou serviço do GitLab, e não uma pessoa revisando código.
 * @param username Nome de usuário do autor no GitLab.
 * @param autoresIgnorados Nomes de usuário extras configurados em IGNORED_AUTHORS.
 * @returns Verdadeiro quando a nota deve ser ignorada.
 */
function ehAutorSistemaGitLab(username: string | undefined, autoresIgnorados: string[]): boolean {
    if (!username)
        return false;

    if (PADRAO_BOT_TOKEN_GITLAB.test(username))
        return true;

    return EstaNaListaDeIgnorados(username, autoresIgnorados);
}

/**
 * Converte uma nota do GitLab para o formato normalizado.
 * @param nota Nota bruta da API.
 * @param urlMergeRequest URL do Merge Request, base do link da nota.
 * @returns Nota pronta para a lógica de domínio.
 */
function converterNota(nota: NotaGitLab, urlMergeRequest: string): NotaNormalizada {
    return {
        id: nota.id,
        url: urlMergeRequest + "#note_" + nota.id,
        autor: ConverterAutor(nota.author),
        corpo: nota.body,
        criadoEm: nota.created_at,
        atualizadoEm: nota.updated_at,
    };
}

/**
 * Interpreta a posição de um comentário e descobre em qual commit buscar o arquivo.
 * @param posicao Posição bruta devolvida pelo GitLab.
 * @returns Arquivo, linhas e commits candidatos para montar o trecho.
 */
function resolverPosicao(posicao: PosicaoGitLab | null | undefined): PosicaoResolvida {
    if (!posicao)
        return POSICAO_VAZIA;

    const caminhoArquivo: string | null = posicao.new_path ?? posicao.old_path ?? null;

    if (posicao.position_type !== TipoPosicaoGitLab.Texto)
        return { ...POSICAO_VAZIA, caminhoArquivo };

    const ehLadoNovo: boolean = posicao.new_line !== null && posicao.new_line !== undefined;
    const lado: LadoDiff = ehLadoNovo ? LadoDiff.Novo : LadoDiff.Antigo;
    const linhaAncora: number | null = (ehLadoNovo ? posicao.new_line : posicao.old_line) ?? null;
    const intervalo = getIntervaloLinhas(posicao, ehLadoNovo, linhaAncora);

    return {
        caminhoArquivo: (ehLadoNovo ? posicao.new_path : posicao.old_path) ?? caminhoArquivo,
        linhaInicial: intervalo.inicial,
        linhaFinal: intervalo.final,
        lado,
        refs: getRefsCandidatas(posicao, ehLadoNovo),
    };
}

/**
 * Descobre a primeira e a última linha comentadas, tratando comentários de várias linhas.
 * @param posicao Posição bruta devolvida pelo GitLab.
 * @param ehLadoNovo Indica se o comentário está no lado novo do diff.
 * @param linhaAncora Linha principal do comentário.
 * @returns Primeira e última linha a destacar.
 */
function getIntervaloLinhas(posicao: PosicaoGitLab, ehLadoNovo: boolean, linhaAncora: number | null): IntervaloDestaque {
    const inicioIntervalo: number | null = getLinhaDaExtremidade(posicao.line_range?.start, ehLadoNovo);
    const fimIntervalo: number | null = getLinhaDaExtremidade(posicao.line_range?.end, ehLadoNovo);

    // O GitLab permite marcar um intervalo que começa em uma linha removida e termina em uma
    // adicionada. Nesse caso uma das pontas pertence ao outro arquivo e as numerações não são
    // comparáveis, então apenas a linha âncora é destacada.
    if (inicioIntervalo === null || fimIntervalo === null)
        return { inicial: linhaAncora, final: linhaAncora };

    return { inicial: Math.min(inicioIntervalo, fimIntervalo), final: Math.max(inicioIntervalo, fimIntervalo) };
}

/**
 * Lê o número da linha de uma das extremidades de um comentário multilinha.
 * @param extremidade Extremidade inicial ou final do intervalo.
 * @param ehLadoNovo Indica se o comentário está no lado novo do diff.
 * @returns Número da linha no lado informado ou nulo quando a extremidade pertence ao outro lado.
 */
function getLinhaDaExtremidade(extremidade: ExtremidadeIntervaloGitLab | null | undefined, ehLadoNovo: boolean): number | null {
    if (!extremidade)
        return null;

    return (ehLadoNovo ? extremidade.new_line : extremidade.old_line) ?? null;
}

/**
 * Monta a lista de commits em que o arquivo pode ser buscado, do mais provável ao menos provável.
 * Só entram commits do mesmo lado do diff: buscar no lado oposto traria outra versão do arquivo
 * e o trecho exibido não seria o que foi comentado.
 * @param posicao Posição bruta devolvida pelo GitLab.
 * @param ehLadoNovo Indica se o comentário está no lado novo do diff.
 * @returns Commits candidatos, sem repetições.
 */
function getRefsCandidatas(posicao: PosicaoGitLab, ehLadoNovo: boolean): string[] {
    const doMesmoLado: (string | null)[] = ehLadoNovo ? [posicao.head_sha] : [posicao.base_sha, posicao.start_sha];

    return Array.from(new Set(doMesmoLado.filter((ref): ref is string => Boolean(ref))));
}

/**
 * Converte o autor devolvido pelo GitLab para o formato de domínio.
 * @param autor Autor bruto da API.
 * @returns Autor com os campos usados na tela.
 */
export function ConverterAutor(autor: AutorGitLab | null | undefined): Autor {
    return {
        nome: autor?.name ?? AUTOR_DESCONHECIDO,
        usuario: autor?.username ?? "",
        urlAvatar: autor?.avatar_url ?? null,
    };
}

/**
 * Monta o resumo do Merge Request exibido no cabeçalho do dashboard.
 * @param mergeRequest Merge Request devolvido pelo GitLab.
 * @returns Resumo com título, autor, branches e link.
 */
export function ConverterMergeRequest(mergeRequest: MergeRequestGitLab): MergeRequestResumo {
    return {
        iid: mergeRequest.iid,
        titulo: mergeRequest.title,
        url: mergeRequest.web_url,
        situacao: mergeRequest.state,
        autor: ConverterAutor(mergeRequest.author),
        branchOrigem: mergeRequest.source_branch,
        branchDestino: mergeRequest.target_branch,
    };
}

/**
 * Converte um Merge Request da listagem do GitLab para o formato do seletor da tela.
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Merge Request pronto para o seletor.
 */
export function ConverterMergeRequestAberto(mergeRequest: MergeRequestListaGitLab): MergeRequestAberto {
    return {
        projetoId: String(mergeRequest.project_id),
        caminhoProjeto: getCaminhoProjeto(mergeRequest),
        iid: mergeRequest.iid,
        titulo: mergeRequest.title,
        url: mergeRequest.web_url,
        situacao: SITUACAO_POR_ESTADO_GITLAB[mergeRequest.state] ?? SituacaoMergeRequest.Fechado,
        // O status e a validade do chamado dependem de uma chamada à parte (o vínculo com a issue
        // não vem nesta listagem) — entram depois, via InterpretarStatusChamado.
        statusChamado: null,
        chamadoValido: null,
        branchOrigem: mergeRequest.source_branch,
        branchDestino: mergeRequest.target_branch,
        atualizadoEm: mergeRequest.updated_at,
        autor: ConverterAutor(mergeRequest.author),
        temThreadsAbertas: getTemThreadsAbertas(mergeRequest),
        totalComentarios: mergeRequest.user_notes_count ?? 0,
    };
}

/** Status e validade do chamado, lidos das tags dele. */
export interface StatusDoChamado {
    statusChamado: StatusChamado | null;
    chamadoValido: boolean | null;
}

/**
 * Lê o status e a validade do chamado a partir das tags dele, usando só a lista fixa de status
 * conhecida do quadro — qualquer outra tag (nome de cliente, de responsável etc.) é ignorada.
 * @param labels Tags do chamado vinculado, ou nulo quando o Merge Request não tem chamado vinculado.
 * @returns Status reconhecido e validade, ou ambos nulos quando não há chamado ou nenhuma tag bate.
 */
export function InterpretarStatusChamado(labels: string[] | null): StatusDoChamado {
    if (!labels)
        return { statusChamado: null, chamadoValido: null };

    const labelsNormalizadas: string[] = labels.map(normalizarTag);
    const statusChamado: StatusChamado | null = labelsNormalizadas.map((label) => STATUS_CHAMADO_POR_TAG_NORMALIZADA[label]).find((status) => status !== undefined) ?? null;
    const chamadoValido: boolean | null = labelsNormalizadas.includes(TAG_CHAMADO_VALIDO_NORMALIZADA)
        ? true
        : labelsNormalizadas.includes(TAG_CHAMADO_INVALIDO_NORMALIZADA)
          ? false
          : null;

    return { statusChamado, chamadoValido };
}

/**
 * Lê o caminho do projeto a partir da referência completa, como "grupo/projeto!123".
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Caminho do projeto ou o ID numérico quando a referência não vier.
 */
function getCaminhoProjeto(mergeRequest: MergeRequestListaGitLab): string {
    const referenciaCompleta: string = mergeRequest.references?.full ?? "";

    return referenciaCompleta.split(SEPARADOR_REFERENCIA)[0] || String(mergeRequest.project_id);
}

/**
 * Indica se o Merge Request ainda tem threads de revisão sem resolver.
 * @param mergeRequest Merge Request devolvido pela API.
 * @returns Verdadeiro, falso, ou nulo quando a instância do GitLab não informa esse dado.
 */
function getTemThreadsAbertas(mergeRequest: MergeRequestListaGitLab): boolean | null {
    const resolvidas: boolean | null | undefined = mergeRequest.blocking_discussions_resolved;

    return resolvidas === undefined || resolvidas === null ? null : !resolvidas;
}

/**
 * Converte o diff de um arquivo do GitLab para o formato de domínio.
 *
 * O sinal de "diff indisponível" é o campo diff vazio, não too_large isolado: existem arquivos com
 * too_large falso e diff vazio mesmo assim (confirmado contra a API real), então o texto vazio é
 * tratado sempre como indisponível, e o mesmo vale quando o diff estoura maxLinhas ao ser interpretado.
 * @param arquivo Diff bruto de um arquivo, devolvido pela API.
 * @param maxLinhas Quantidade máxima de linhas de diff aceitas para este arquivo.
 * @returns Arquivo alterado no formato de domínio.
 */
export function ConverterArquivoAlterado(arquivo: DiffArquivoGitLab, maxLinhas: number): ArquivoAlterado {
    const caminho: string = arquivo.new_path || arquivo.old_path;
    const linhas = arquivo.diff ? InterpretarDiffUnificado(arquivo.diff, maxLinhas) : null;

    return {
        caminho,
        caminhoAntigo: arquivo.renamed_file ? arquivo.old_path : null,
        status: getStatusArquivo(arquivo),
        linguagem: GetLinguagem(caminho),
        linhas,
        motivoIndisponivel: linhas ? null : MOTIVO_DIFF_INDISPONIVEL,
        adicoes: linhas ? contarPorTipo(linhas, TipoLinhaDiff.Adicionada) : null,
        remocoes: linhas ? contarPorTipo(linhas, TipoLinhaDiff.Removida) : null,
    };
}

/**
 * Descobre o que aconteceu com o arquivo entre as duas branches do Merge Request.
 * @param arquivo Diff bruto de um arquivo, devolvido pela API.
 * @returns Status do arquivo no formato de domínio.
 */
function getStatusArquivo(arquivo: DiffArquivoGitLab): StatusArquivoAlterado {
    if (arquivo.new_file)
        return StatusArquivoAlterado.Adicionado;

    if (arquivo.deleted_file)
        return StatusArquivoAlterado.Removido;

    if (arquivo.renamed_file)
        return StatusArquivoAlterado.Renomeado;

    return StatusArquivoAlterado.Modificado;
}

/**
 * Conta quantas linhas do diff são do tipo informado.
 * @param linhas Linhas já interpretadas do diff.
 * @param tipo Tipo de linha a contar.
 * @returns Quantidade de linhas daquele tipo.
 */
function contarPorTipo(linhas: LinhaDiff[], tipo: TipoLinhaDiff): number {
    return linhas.filter((linha) => linha.tipo === tipo).length;
}
