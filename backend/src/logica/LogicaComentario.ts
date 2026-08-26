import { AutorGitLab, DiscussaoGitLab, ExtremidadeIntervaloGitLab, MergeRequestGitLab, NotaGitLab, PosicaoGitLab, TipoPosicaoGitLab } from "../integracao/gitlab/types";
import { Autor, ComentarioRevisao, ContagemComentarios, LadoDiff, MergeRequestResumo, RespostaComentario, StatusFiltro } from "../models/Revisao/types";
import { EhAutorSistema } from "../utilidades/AutorSistema";
import { DiscussaoNormalizada, IntervaloDestaque, PosicaoResolvida, ResultadoTrecho } from "./types";

/** Nome exibido quando o GitLab não informa o autor do comentário. */
const AUTOR_DESCONHECIDO = "Autor desconhecido";

/** Posição usada quando o comentário não está ancorado em nenhum arquivo. */
const POSICAO_VAZIA: PosicaoResolvida = {
    caminhoArquivo: null,
    linhaInicial: null,
    linhaFinal: null,
    lado: null,
    refs: [],
};

/**
 * Converte as threads do GitLab para o formato usado pela aplicação, descartando notas
 * automáticas e notas de bots (do próprio GitLab ou configurados em IGNORED_AUTHORS).
 * @param discussoes Threads devolvidas pela API do GitLab.
 * @param autoresIgnorados Nomes de usuário extras a sempre ignorar, vindos da configuração.
 * @returns Threads normalizadas, sem as que contêm só mensagens de sistema ou de bots.
 */
export function NormalizarDiscussoes(discussoes: DiscussaoGitLab[], autoresIgnorados: string[]): DiscussaoNormalizada[] {
    return discussoes.reduce<DiscussaoNormalizada[]>((normalizadas, discussao) => {
        const notas: NotaGitLab[] = (discussao.notes ?? []).filter((nota) => !nota.system && !EhAutorSistema(nota.author?.username, autoresIgnorados));

        if (!notas.length)
            return normalizadas;

        const notaPrincipal: NotaGitLab = notas[0];
        const notasResolviveis: NotaGitLab[] = notas.filter((nota) => nota.resolvable);

        normalizadas.push({
            discussao,
            notaPrincipal,
            respostas: notas.slice(1),
            resolvivel: notasResolviveis.length > 0,
            resolvido: notasResolviveis.length > 0 && notasResolviveis.every((nota) => nota.resolved === true),
            posicao: resolverPosicao(notas.find((nota) => nota.position)?.position ?? null),
        });

        return normalizadas;
    }, []);
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
 * Conta as threads por situação.
 * @param normalizadas Threads já normalizadas.
 * @returns Total de threads, abertas, resolvidas e comentários gerais (que o GitLab não deixa resolver).
 */
export function GetContagem(normalizadas: DiscussaoNormalizada[]): ContagemComentarios {
    return {
        total: normalizadas.length,
        abertos: normalizadas.filter(ehAberta).length,
        resolvidos: normalizadas.filter((item) => item.resolvivel && item.resolvido).length,
        naoResolviveis: normalizadas.filter((item) => !item.resolvivel).length,
    };
}

/**
 * Filtra as threads conforme o status pedido. Comentários gerais, que o GitLab não permite
 * resolver, entram no filtro de abertos.
 * @param normalizadas Threads já normalizadas.
 * @param status Status desejado.
 * @returns Threads que atendem ao filtro.
 */
export function FiltrarPorStatus(normalizadas: DiscussaoNormalizada[], status: StatusFiltro): DiscussaoNormalizada[] {
    if (status === StatusFiltro.Todos)
        return normalizadas;

    if (status === StatusFiltro.Resolvidos)
        return normalizadas.filter((item) => item.resolvivel && item.resolvido);

    return normalizadas.filter((item) => ehAberta(item) || !item.resolvivel);
}

/**
 * Indica se a thread está aberta, ou seja, pode ser resolvida e ainda não foi.
 * @param normalizada Thread já normalizada.
 * @returns Verdadeiro quando a thread continua em aberto.
 */
function ehAberta(normalizada: DiscussaoNormalizada): boolean {
    return normalizada.resolvivel && !normalizada.resolvido;
}

/**
 * Monta o comentário exibido no dashboard a partir da thread e do trecho já buscado.
 * @param normalizada Thread já normalizada.
 * @param urlMergeRequest URL do Merge Request no GitLab.
 * @param resultadoTrecho Trecho de código encontrado ou o motivo da falha.
 * @returns Comentário pronto para o frontend.
 */
export function ConverterParaComentario(normalizada: DiscussaoNormalizada, urlMergeRequest: string, resultadoTrecho: ResultadoTrecho): ComentarioRevisao {
    const { discussao, notaPrincipal, posicao } = normalizada;

    return {
        id: discussao.id,
        comentario: notaPrincipal.body,
        caminhoArquivo: posicao.caminhoArquivo,
        linha: posicao.linhaFinal ?? posicao.linhaInicial,
        lado: posicao.lado,
        codigo: resultadoTrecho.codigo,
        trecho: resultadoTrecho.trecho,
        erroTrecho: resultadoTrecho.erroTrecho,
        autor: ConverterAutor(notaPrincipal.author),
        criadoEm: notaPrincipal.created_at,
        atualizadoEm: notaPrincipal.updated_at,
        resolvido: normalizada.resolvido,
        resolvivel: normalizada.resolvivel,
        url: `${urlMergeRequest}#note_${notaPrincipal.id}`,
        respostas: normalizada.respostas.map(converterResposta),
    };
}

/**
 * Converte o autor devolvido pelo GitLab para o formato da aplicação.
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
 * Converte uma resposta da thread para o formato da aplicação.
 * @param nota Nota bruta da API.
 * @returns Resposta pronta para o frontend.
 */
function converterResposta(nota: NotaGitLab): RespostaComentario {
    return {
        id: nota.id,
        autor: ConverterAutor(nota.author),
        corpo: nota.body,
        criadoEm: nota.created_at,
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
 * Ordena os comentários por arquivo e linha, deixando os comentários gerais no fim.
 * @param comentarios Comentários já convertidos.
 * @returns A mesma lista ordenada.
 */
export function OrdenarComentarios(comentarios: ComentarioRevisao[]): ComentarioRevisao[] {
    return comentarios.sort((primeiro, segundo) => {
        const arquivoPrimeiro: string = primeiro.caminhoArquivo ?? "";
        const arquivoSegundo: string = segundo.caminhoArquivo ?? "";

        if (!arquivoPrimeiro !== !arquivoSegundo)
            return arquivoPrimeiro ? -1 : 1;

        const comparacaoArquivo: number = arquivoPrimeiro.localeCompare(arquivoSegundo);

        if (comparacaoArquivo !== 0)
            return comparacaoArquivo;

        return (primeiro.linha ?? 0) - (segundo.linha ?? 0) || primeiro.criadoEm.localeCompare(segundo.criadoEm);
    });
}
