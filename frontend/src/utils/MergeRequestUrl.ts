/** Reconhece o caminho do projeto e o número em uma URL de Merge Request do GitLab. */
const URL_MERGE_REQUEST_GITLAB = /^https?:\/\/[^/]+\/(.+?)\/-\/merge_requests\/(\d+)/i;

/** Reconhece o repositório e o número em uma URL de Pull Request do GitHub. */
const URL_PULL_REQUEST_GITHUB = /^https?:\/\/[^/]+\/([^/]+\/[^/]+)\/pull\/(\d+)/i;

/**
 * Padrões aceitos. Os dois são tentados independentemente do provedor ativo: colar a URL certa
 * é o caminho normal, e reconhecer a outra não atrapalha — quem valida o valor é o backend.
 */
const PADROES_ACEITOS: RegExp[] = [URL_MERGE_REQUEST_GITLAB, URL_PULL_REQUEST_GITHUB];

/** Dados extraídos de uma URL de Merge Request ou Pull Request. */
export interface DadosMergeRequest {
    projetoId: string;
    mrIid: string;
}

/**
 * Extrai o projeto e o número a partir de uma URL colada pelo usuário.
 * @param texto Texto informado no campo, que pode ser uma URL ou um valor comum.
 * @returns Projeto e número encontrados, ou nulo quando o texto não é uma URL reconhecida.
 */
export function ExtrairDadosDaUrl(texto: string): DadosMergeRequest | null {
    const limpo: string = texto.trim();

    for (const padrao of PADROES_ACEITOS) {
        const correspondencia = padrao.exec(limpo);

        if (correspondencia)
            return { projetoId: correspondencia[1], mrIid: correspondencia[2] };
    }

    return null;
}
