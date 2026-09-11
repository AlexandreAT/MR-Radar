import { ComentarioRevisao, ContagemComentarios, RespostaComentario, StatusFiltro } from "../models/Revisao/types";
import { GetRotuloRevisao } from "../utilidades/RotuloRevisao";
import { DiscussaoNormalizada, NotaNormalizada, ResultadoTrecho } from "./types";

/**
 * Conta as threads por situação.
 * @param normalizadas Threads já normalizadas.
 * @returns Total de threads, abertas, resolvidas e comentários gerais (que o provedor não deixa resolver).
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
 * Filtra as threads conforme o status pedido. Comentários gerais, que o provedor não permite
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
 * @param resultadoTrecho Trecho de código encontrado ou o motivo da falha.
 * @returns Comentário pronto para o frontend.
 */
export function ConverterParaComentario(normalizada: DiscussaoNormalizada, resultadoTrecho: ResultadoTrecho): ComentarioRevisao {
    const { notaPrincipal, posicao } = normalizada;

    return {
        id: normalizada.id,
        comentario: notaPrincipal.corpo,
        rotulo: GetRotuloRevisao(notaPrincipal.corpo),
        caminhoArquivo: posicao.caminhoArquivo,
        linha: posicao.linhaFinal ?? posicao.linhaInicial,
        lado: posicao.lado,
        codigo: resultadoTrecho.codigo,
        trecho: resultadoTrecho.trecho,
        erroTrecho: resultadoTrecho.erroTrecho,
        autor: notaPrincipal.autor,
        criadoEm: notaPrincipal.criadoEm,
        atualizadoEm: notaPrincipal.atualizadoEm,
        resolvido: normalizada.resolvido,
        resolvivel: normalizada.resolvivel,
        url: notaPrincipal.url,
        respostas: normalizada.respostas.map(converterResposta),
    };
}

/**
 * Converte uma nota normalizada em resposta de thread.
 * @param nota Nota já normalizada.
 * @returns Resposta pronta para o frontend.
 */
function converterResposta(nota: NotaNormalizada): RespostaComentario {
    return {
        id: nota.id,
        autor: nota.autor,
        corpo: nota.corpo,
        criadoEm: nota.criadoEm,
    };
}

/**
 * Ordena os comentários do mais novo para o mais antigo, a mesma ordem usada no Git.
 * @param comentarios Comentários já convertidos.
 * @returns A mesma lista ordenada.
 */
export function OrdenarComentarios(comentarios: ComentarioRevisao[]): ComentarioRevisao[] {
    return comentarios.sort((primeiro, segundo) => segundo.criadoEm.localeCompare(primeiro.criadoEm));
}
