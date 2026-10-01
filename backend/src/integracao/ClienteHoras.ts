import { CommitGitLab, EventoGitLab, IssueGitLab, MergeRequestRelacionadoGitLab, NotaGitLab, UsuarioGitLab } from "./gitlab/types";
import { PaginaResultado } from "./types";

/**
 * Porta que `LogicaHoras` usa para montar as horas da semana. Diferente de `ClienteRevisao`, os
 * métodos aqui devolvem o formato bruto do GitLab (não convertido para o domínio): é o próprio
 * `LogicaHoras` quem interpreta notas de sistema, commits e eventos — não existe um conversor
 * separado para Horas como existe para a revisão. Só GitLab e Demo implementam esta interface; o
 * GitHub não tem Time tracking e a página de Horas não é registrada nesse modo.
 */
export interface ClienteHoras {
    /**
     * Busca o usuário dono do token.
     * @returns Usuário autenticado na API.
     */
    GetUsuarioAtual(): Promise<UsuarioGitLab>;

    /**
     * Lista as issues atribuídas ao dono do token que foram mexidas a partir de uma data.
     * @param atualizadasApos Data ISO a partir da qual as issues interessam.
     * @returns Issues encontradas e indicação de paginação truncada.
     */
    GetIssuesAtribuidas(atualizadasApos: string): Promise<PaginaResultado<IssueGitLab>>;

    /**
     * Busca as notas de uma issue, da mais antiga para a mais nova.
     * @param projetoId ID numérico do projeto.
     * @param issueIid IID da issue.
     * @returns Notas encontradas e indicação de paginação truncada.
     */
    GetNotasIssue(projetoId: number, issueIid: number): Promise<PaginaResultado<NotaGitLab>>;

    /**
     * Lista os Merge Requests relacionados a uma issue — os que a mencionam, fecham ou têm commit
     * ligado a ela.
     * @param projetoId ID numérico do projeto da issue.
     * @param issueIid IID da issue.
     * @returns Merge Requests relacionados e indicação de paginação truncada.
     */
    GetMergeRequestsRelacionados(projetoId: number, issueIid: number): Promise<PaginaResultado<MergeRequestRelacionadoGitLab>>;

    /**
     * Busca os commits de um Merge Request a partir de uma data, do mais novo para o mais antigo.
     * @param projetoId ID numérico do projeto do Merge Request.
     * @param mrIid IID do Merge Request.
     * @param desde Instante ISO a partir do qual os commits interessam.
     * @returns Commits dentro da janela e indicação de paginação truncada.
     */
    GetCommitsRecentes(projetoId: number, mrIid: number, desde: string): Promise<PaginaResultado<CommitGitLab>>;

    /**
     * Lista os comentários que o dono do token deixou a partir de uma data, em qualquer projeto.
     * @param apos Data (AAAA-MM-DD) a partir da qual os comentários interessam.
     * @returns Eventos de comentário encontrados e indicação de paginação truncada.
     */
    GetEventosDeComentario(apos: string): Promise<PaginaResultado<EventoGitLab>>;
}
