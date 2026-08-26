/**
 * Nome de usuário que o próprio GitLab gera para bots de Project/Group Access Token,
 * no formato "project_<id>_bot_<hash>" ou "group_<id>_bot_<hash>". Vale para qualquer instância.
 */
const PADRAO_BOT_TOKEN_GITLAB = /^(project|group)_\d+_bot(_[0-9a-f]+)?$/i;

/**
 * Indica se o autor de uma nota é um bot ou serviço, e não uma pessoa revisando o código.
 * Notas desses autores são tratadas como notas de sistema: nunca aparecem como comentário.
 * @param username Nome de usuário do autor no GitLab.
 * @param autoresIgnorados Nomes de usuário extras configurados em IGNORED_AUTHORS, em minúsculo.
 * @returns Verdadeiro quando a nota deve ser ignorada.
 */
export function EhAutorSistema(username: string | undefined, autoresIgnorados: string[]): boolean {
    if (!username)
        return false;

    if (PADRAO_BOT_TOKEN_GITLAB.test(username))
        return true;

    return autoresIgnorados.includes(username.toLowerCase());
}
