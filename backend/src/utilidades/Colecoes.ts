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
