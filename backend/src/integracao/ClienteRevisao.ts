import { DiscussaoNormalizada } from "../logica/types";
import { EscopoMergeRequest, MergeRequestAberto, MergeRequestResumo, PaginaArquivosAlterados } from "../models/Revisao/types";
import { PaginaNumerada, PaginaResultado } from "./types";

/**
 * Porta que a lógica de revisão usa para falar com o provedor configurado (GitLab ou GitHub),
 * sem conhecer o formato bruto de nenhum dos dois. Cada provedor implementa essa interface e
 * devolve os dados já convertidos para o domínio da aplicação.
 */
export interface ClienteRevisao {
    /**
     * Busca os dados principais de um Merge Request.
     * @param projetoId Identificador do projeto/repositório.
     * @param mrIid Identificador do Merge Request dentro do projeto.
     * @returns Merge Request no formato de domínio.
     */
    GetMergeRequest(projetoId: string, mrIid: string): Promise<MergeRequestResumo>;

    /**
     * Lista os Merge Requests abertos do usuário dono do token.
     * @param escopo Se a lista traz os criados por ele ou os atribuídos a ele.
     * @returns Merge Requests já no formato de domínio, do mais recente para o mais antigo.
     */
    GetMergeRequestsAbertos(escopo: EscopoMergeRequest): Promise<PaginaResultado<MergeRequestAberto>>;

    /**
     * Pesquisa Merge Requests abertos pelo título, entre todos os projetos que o token enxerga —
     * não só os criados ou atribuídos ao dono do token.
     * @param termo Texto pesquisado no título.
     * @returns Merge Requests encontrados, do mais recente para o mais antigo.
     */
    BuscarMergeRequests(termo: string): Promise<PaginaResultado<MergeRequestAberto>>;

    /**
     * Lista os Merge Requests encerrados (fechados ou mesclados) do usuário dono do token, com
     * paginação real de 20 itens por página.
     * @param escopo Se a lista traz os criados por ele ou os atribuídos a ele.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Merge Requests encerrados, do mais recente para o mais antigo.
     */
    GetMergeRequestsEncerrados(escopo: EscopoMergeRequest, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>>;

    /**
     * Pesquisa Merge Requests encerrados (fechados ou mesclados) pelo título, entre todos os
     * projetos que o token enxerga, com paginação real de 20 itens por página.
     * @param termo Texto pesquisado no título.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Merge Requests encontrados, do mais recente para o mais antigo.
     */
    BuscarMergeRequestsEncerrados(termo: string, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>>;

    /**
     * Busca as threads de comentários de um Merge Request, já normalizadas.
     * @param projetoId Identificador do projeto/repositório.
     * @param mrIid Identificador do Merge Request dentro do projeto.
     * @returns Threads normalizadas e indicação de paginação truncada.
     */
    GetDiscussoes(projetoId: string, mrIid: string): Promise<PaginaResultado<DiscussaoNormalizada>>;

    /**
     * Busca o conteúdo de um arquivo do repositório em um commit específico.
     * @param projetoId Identificador do projeto/repositório.
     * @param caminhoArquivo Caminho do arquivo dentro do repositório.
     * @param ref Commit, branch ou tag usada como referência.
     * @returns Conteúdo do arquivo em texto.
     */
    GetArquivoBruto(projetoId: string, caminhoArquivo: string, ref: string): Promise<string>;

    /**
     * Busca uma página dos arquivos alterados de um Merge Request, com o diff já recortado nos
     * mesmos blocos que o GitLab e o GitHub mostram.
     * @param projetoId Identificador do projeto/repositório.
     * @param mrIid Identificador do Merge Request dentro do projeto.
     * @param pagina Página desejada, a partir de 1.
     * @returns Arquivos da página e indicação de próxima página/total, quando o provedor informa.
     */
    GetArquivosAlterados(projetoId: string, mrIid: string, pagina: number): Promise<PaginaArquivosAlterados>;
}
