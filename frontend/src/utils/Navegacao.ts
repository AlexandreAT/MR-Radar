/** Páginas do dashboard. */
export enum PaginaApp {
    Revisao = "revisao",
    Horas = "horas",
}

/** Endereço de cada página, guardado no hash da URL para sobreviver ao F5. */
const HASH_POR_PAGINA: Record<PaginaApp, string> = {
    [PaginaApp.Revisao]: "#/merge-requests",
    [PaginaApp.Horas]: "#/horas",
};

/** Página aberta quando o hash está vazio ou não é reconhecido. */
const PAGINA_PADRAO = PaginaApp.Revisao;

/**
 * Descobre qual página o hash da URL está pedindo.
 * @param hash Hash atual da janela, incluindo o "#".
 * @returns Página correspondente, ou a página inicial quando o hash não é reconhecido.
 */
export function GetPaginaDoHash(hash: string): PaginaApp {
    const paginas: PaginaApp[] = Object.values(PaginaApp);

    return paginas.find((pagina) => HASH_POR_PAGINA[pagina] === hash) ?? PAGINA_PADRAO;
}

/**
 * Monta o hash correspondente a uma página.
 * @param pagina Página escolhida.
 * @returns Hash a colocar na URL.
 */
export function GetHashDaPagina(pagina: PaginaApp): string {
    return HASH_POR_PAGINA[pagina];
}
