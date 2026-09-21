/**
 * Executa uma ação assíncrona sobre todos os itens, limitando quantas rodam ao mesmo tempo.
 * Evita disparar dezenas de chamadas simultâneas ao GitLab em Merge Requests grandes.
 * @param itens Itens que serão processados.
 * @param limite Quantidade máxima de execuções simultâneas.
 * @param acao Ação executada para cada item.
 * @returns Resultados na mesma ordem dos itens recebidos.
 */
export async function MapearComLimite<TEntrada, TSaida>(itens: TEntrada[], limite: number, acao: (item: TEntrada) => Promise<TSaida>): Promise<TSaida[]> {
    if (!itens.length)
        return [];

    const resultados: TSaida[] = new Array<TSaida>(itens.length);
    const totalTrabalhadores: number = Math.max(1, Math.min(limite, itens.length));
    let proximoIndice = 0;

    const trabalhadores: Promise<void>[] = Array.from({ length: totalTrabalhadores }, async () => {
        for (;;) {
            const indice: number = proximoIndice;
            proximoIndice += 1;

            if (indice >= itens.length)
                return;

            resultados[indice] = await acao(itens[indice]);
        }
    });

    await Promise.all(trabalhadores);

    return resultados;
}

/** Página recortada de uma lista já ordenada, com a página realmente usada e o total de páginas. */
export interface PaginaRecortada<T> {
    itens: T[];
    /** Página realmente usada — a pedida, ou a última válida quando a pedida estourava o total. */
    pagina: number;
    totalPaginas: number;
}

/**
 * Recorta a página pedida de uma lista já ordenada, com paginação de tamanho fixo.
 * @param itens Lista completa, já ordenada.
 * @param pagina Página pedida, a partir de 1.
 * @param tamanho Quantidade de itens por página.
 * @returns Itens da página realmente usada (a mais próxima, se a pedida estourar o total) e o total de páginas.
 */
export function PaginarLista<T>(itens: T[], pagina: number, tamanho: number): PaginaRecortada<T> {
    const totalPaginas: number = Math.max(1, Math.ceil(itens.length / tamanho));
    const paginaValida: number = Math.min(Math.max(1, pagina), totalPaginas);
    const inicio: number = (paginaValida - 1) * tamanho;

    return { itens: itens.slice(inicio, inicio + tamanho), pagina: paginaValida, totalPaginas };
}
