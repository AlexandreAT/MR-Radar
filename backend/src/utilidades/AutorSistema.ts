/**
 * Indica se o autor está na lista de autores ignorados configurada pelo usuário (IGNORED_AUTHORS),
 * independente do provedor. A heurística automática de bot (formato de username, tipo de conta
 * etc.) é específica de cada provedor e mora no respectivo Conversor.
 * @param username Nome de usuário do autor.
 * @param autoresIgnorados Nomes de usuário configurados em IGNORED_AUTHORS, em minúsculo.
 * @returns Verdadeiro quando o autor deve ser ignorado.
 */
export function EstaNaListaDeIgnorados(username: string | undefined, autoresIgnorados: string[]): boolean {
    if (!username)
        return false;

    return autoresIgnorados.includes(username.toLowerCase());
}
