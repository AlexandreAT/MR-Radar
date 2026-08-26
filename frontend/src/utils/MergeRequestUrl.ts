/** Reconhece o caminho do projeto e o IID em uma URL de Merge Request do GitLab. */
const URL_MERGE_REQUEST = /^https?:\/\/[^/]+\/(.+?)\/-\/merge_requests\/(\d+)/i;

/** Dados extraídos de uma URL de Merge Request. */
export interface DadosMergeRequest {
    projetoId: string;
    mrIid: string;
}

/**
 * Extrai o projeto e o IID a partir de uma URL de Merge Request colada pelo usuário.
 * @param texto Texto informado no campo, que pode ser uma URL ou um valor comum.
 * @returns Projeto e IID encontrados ou nulo quando o texto não é uma URL de Merge Request.
 */
export function ExtrairDadosDaUrl(texto: string): DadosMergeRequest | null {
    const correspondencia = URL_MERGE_REQUEST.exec(texto.trim());

    if (!correspondencia)
        return null;

    return { projetoId: correspondencia[1], mrIid: correspondencia[2] };
}
