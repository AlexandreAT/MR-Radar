import { OutgoingHttpHeaders } from "http";
import { ConfiguracaoApp } from "../../configuracao/types";
import { ErroGitLab } from "./ErroGitLab";
import { ExecutarGet, RespostaHttp } from "./RequisicaoGitLab";
import { StatusHttp } from "../../utilidades/types";
import {
    API_GITLAB,
    CabecalhoGitLab,
    CodigoErroGitLab,
    DefinicaoErroHttp,
    CommitGitLab,
    DiscussaoGitLab,
    EscopoGitLab,
    EstadoIssueGitLab,
    EstadoMergeRequestGitLab,
    IssueGitLab,
    ItemArvoreGitLab,
    MergeRequestGitLab,
    MergeRequestListaGitLab,
    MergeRequestRelacionadoGitLab,
    NotaGitLab,
    ORDEM_NOTAS,
    PaginaGitLab,
    TipoItemArvoreGitLab,
    UsuarioGitLab,
} from "./types";

/** Cliente somente leitura da API v4 do GitLab. */
export class ClienteGitLab {
    private readonly urlBaseApi: string;
    private readonly configuracao: ConfiguracaoApp;

    /**
     * @param configuracao Configuração da aplicação, com URL, token e limites.
     */
    constructor(configuracao: ConfiguracaoApp) {
        this.configuracao = configuracao;
        this.urlBaseApi = `${configuracao.urlGitLab}${API_GITLAB.CAMINHO_BASE}`;
    }

    /**
     * Busca os dados principais de um Merge Request.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param mrIid IID do Merge Request.
     * @returns Merge Request encontrado.
     */
    public async GetMergeRequest(projetoId: string, mrIid: string): Promise<MergeRequestGitLab> {
        return this.getJson<MergeRequestGitLab>(`/projects/${encodeURIComponent(projetoId)}/merge_requests/${encodeURIComponent(mrIid)}`);
    }

    /**
     * Lista os Merge Requests abertos do usuário dono do token, em todos os projetos que ele enxerga.
     * @param escopo Se a lista traz os Merge Requests criados por ele ou os atribuídos a ele.
     * @returns Merge Requests encontrados, do mais recente para o mais antigo.
     */
    public async GetMergeRequestsAbertos(escopo: EscopoGitLab): Promise<PaginaGitLab<MergeRequestListaGitLab>> {
        return this.getTodasPaginas<MergeRequestListaGitLab>("/merge_requests", {
            scope: escopo,
            state: EstadoMergeRequestGitLab.Aberto,
            order_by: "updated_at",
            sort: "desc",
        });
    }

    /**
     * Busca o usuário dono do token.
     * @returns Usuário autenticado na API.
     */
    public async GetUsuarioAtual(): Promise<UsuarioGitLab> {
        return this.getJson<UsuarioGitLab>("/user");
    }

    /**
     * Lista as issues atribuídas ao dono do token que foram mexidas a partir de uma data.
     * O filtro por data de atualização é o que evita percorrer todo o histórico do usuário:
     * qualquer issue com hora lançada na semana foi atualizada nela ou depois dela.
     * @param atualizadasApos Data ISO a partir da qual as issues interessam.
     * @returns Issues encontradas e indicação de paginação truncada.
     */
    public async GetIssuesAtribuidas(atualizadasApos: string): Promise<PaginaGitLab<IssueGitLab>> {
        return this.getTodasPaginas<IssueGitLab>("/issues", {
            scope: EscopoGitLab.AtribuidosAMim,
            state: EstadoIssueGitLab.Todas,
            updated_after: atualizadasApos,
            order_by: "updated_at",
            sort: "desc",
        });
    }

    /**
     * Busca as notas de uma issue, da mais antiga para a mais nova.
     * A ordem importa: uma nota pode zerar todo o tempo lançado antes dela.
     * @param projetoId ID numérico do projeto.
     * @param issueIid IID da issue.
     * @returns Notas encontradas e indicação de paginação truncada.
     */
    public async GetNotasIssue(projetoId: number, issueIid: number): Promise<PaginaGitLab<NotaGitLab>> {
        return this.getTodasPaginas<NotaGitLab>(`/projects/${projetoId}/issues/${issueIid}/notes`, {
            order_by: ORDEM_NOTAS.CAMPO,
            sort: ORDEM_NOTAS.SENTIDO,
        });
    }

    /**
     * Lista os Merge Requests relacionados a uma issue — os que a mencionam, fecham ou têm commit
     * ligado a ela. É o único jeito de descobrir em qual Merge Request procurar os commits de uma
     * issue, já que a API não devolve commits a partir da issue diretamente.
     * @param projetoId ID numérico do projeto da issue.
     * @param issueIid IID da issue.
     * @returns Merge Requests relacionados e indicação de paginação truncada.
     */
    public async GetMergeRequestsRelacionados(projetoId: number, issueIid: number): Promise<PaginaGitLab<MergeRequestRelacionadoGitLab>> {
        return this.getTodasPaginas<MergeRequestRelacionadoGitLab>(`/projects/${projetoId}/issues/${issueIid}/related_merge_requests`);
    }

    /**
     * Busca os commits de um Merge Request a partir de uma data, do mais novo para o mais antigo,
     * parando assim que encontra um commit anterior à data pedida. Evita ler o histórico inteiro de
     * um Merge Request de vida longa quando só interessam os commits dos últimos dias.
     * @param projetoId ID numérico do projeto do Merge Request.
     * @param mrIid IID do Merge Request.
     * @param desde Instante ISO a partir do qual os commits interessam.
     * @returns Commits dentro da janela e indicação de paginação truncada.
     */
    public async GetCommitsRecentes(projetoId: number, mrIid: number, desde: string): Promise<PaginaGitLab<CommitGitLab>> {
        const limiteDeTempo: number = new Date(desde).getTime();
        const itens: CommitGitLab[] = [];
        let pagina = 1;

        for (;;) {
            const resposta: RespostaHttp = await this.executar(`/projects/${projetoId}/merge_requests/${mrIid}/commits`, { per_page: API_GITLAB.ITENS_POR_PAGINA, page: pagina });
            const conteudo: unknown = converterJson(resposta);

            if (!Array.isArray(conteudo))
                throw new ErroGitLab(CodigoErroGitLab.RespostaInesperada, "O GitLab devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido);

            const commits: CommitGitLab[] = conteudo as CommitGitLab[];
            itens.push(...commits);

            const maisAntigo: CommitGitLab | undefined = commits[commits.length - 1];

            // Os commits vêm do mais novo para o mais antigo: assim que um deles for anterior à
            // janela, os das próximas páginas também serão, e não há razão para continuar lendo.
            if (!maisAntigo || new Date(maisAntigo.committed_date).getTime() < limiteDeTempo)
                return { itens, truncada: false };

            const proximaPagina: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitLab.ProximaPagina] ?? ""), 10);

            if (!Number.isFinite(proximaPagina) || proximaPagina <= 0)
                return { itens, truncada: false };

            if (pagina >= this.configuracao.maxPaginas)
                return { itens, truncada: true };

            pagina = proximaPagina;
        }
    }

    /**
     * Busca todas as threads de comentários de um Merge Request.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param mrIid IID do Merge Request.
     * @returns Threads encontradas e indicação de paginação truncada.
     */
    public async GetDiscussoes(projetoId: string, mrIid: string): Promise<PaginaGitLab<DiscussaoGitLab>> {
        return this.getTodasPaginas<DiscussaoGitLab>(`/projects/${encodeURIComponent(projetoId)}/merge_requests/${encodeURIComponent(mrIid)}/discussions`);
    }

    /**
     * Busca o conteúdo de um arquivo do repositório em um commit específico.
     *
     * O conteúdo é buscado por blob, em duas etapas: localiza o id do arquivo na árvore do
     * commit e então lê esse blob. O endpoint /repository/files/:caminho/raw não é usado
     * porque responde 404 para arquivos existentes em parte das instâncias do GitLab.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param caminhoArquivo Caminho do arquivo dentro do repositório.
     * @param ref Commit, branch ou tag usada como referência.
     * @returns Conteúdo do arquivo em texto.
     */
    public async GetArquivoBruto(projetoId: string, caminhoArquivo: string, ref: string): Promise<string> {
        const idDoBlob: string = await this.getIdDoBlob(projetoId, caminhoArquivo, ref);
        const caminho = `/projects/${encodeURIComponent(projetoId)}/repository/blobs/${encodeURIComponent(idDoBlob)}/raw`;
        const resposta: RespostaHttp = await this.executar(caminho, {}, "*/*");

        if (resposta.corpo.length > this.configuracao.tamanhoMaxArquivoBytes)
            throw new ErroGitLab(CodigoErroGitLab.ArquivoMuitoGrande, "O arquivo é grande demais para ser exibido aqui.", StatusHttp.ConteudoMuitoGrande);

        if (resposta.corpo.includes(0))
            throw new ErroGitLab(CodigoErroGitLab.ArquivoBinario, "O arquivo é binário e não tem trecho de código para mostrar.", StatusHttp.TipoNaoSuportado);

        return resposta.corpo.toString("utf8");
    }

    /**
     * Acha o id do blob de um arquivo, percorrendo a árvore do repositório na pasta dele.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param caminhoArquivo Caminho do arquivo dentro do repositório.
     * @param ref Commit, branch ou tag usada como referência.
     * @returns Id do blob correspondente ao arquivo.
     */
    private async getIdDoBlob(projetoId: string, caminhoArquivo: string, ref: string): Promise<string> {
        const diretorio: string = getDiretorioPai(caminhoArquivo);
        const parametros: Record<string, string> = diretorio ? { path: diretorio, ref } : { ref };
        const { itens } = await this.getTodasPaginas<ItemArvoreGitLab>(`/projects/${encodeURIComponent(projetoId)}/repository/tree`, parametros);
        const item: ItemArvoreGitLab | undefined = itens.find((candidato) => candidato.path === caminhoArquivo && candidato.type === TipoItemArvoreGitLab.Arquivo);

        if (!item)
            throw new ErroGitLab(CodigoErroGitLab.NaoEncontrado, `O arquivo "${caminhoArquivo}" não foi encontrado neste commit.`, StatusHttp.NaoEncontrado);

        return item.id;
    }

    /**
     * Executa uma chamada GET na API, repetindo quando o GitLab responde com limite de requisições.
     * @param caminho Caminho relativo dentro da API v4.
     * @param parametros Parâmetros de query string.
     * @param aceita Valor do cabeçalho Accept.
     * @returns Resposta bruta já validada.
     */
    private async executar(caminho: string, parametros: Record<string, string | number> = {}, aceita = "application/json"): Promise<RespostaHttp> {
        const url = new URL(this.urlBaseApi + caminho);
        Object.entries(parametros).forEach(([chave, valor]) => url.searchParams.set(chave, String(valor)));

        const cabecalhos: OutgoingHttpHeaders = {
            [CabecalhoGitLab.Token]: this.configuracao.token,
            Accept: aceita,
            "User-Agent": API_GITLAB.USER_AGENT,
        };

        for (let tentativa = 0; ; tentativa += 1) {
            const resposta: RespostaHttp = await ExecutarGet(url.toString(), { cabecalhos, timeoutMs: this.configuracao.timeoutRequisicaoMs });

            if (resposta.status === StatusHttp.MuitasRequisicoes && tentativa < API_GITLAB.MAX_TENTATIVAS_LIMITE) {
                await esperar(calcularEsperaMs(resposta, tentativa));
                continue;
            }

            if (resposta.status >= StatusHttp.RequisicaoInvalida)
                throw converterStatusEmErro(resposta);

            return resposta;
        }
    }

    /**
     * Executa uma chamada GET e converte a resposta em objeto.
     * @param caminho Caminho relativo dentro da API v4.
     * @param parametros Parâmetros de query string.
     * @returns Conteúdo da resposta já convertido.
     */
    private async getJson<T>(caminho: string, parametros: Record<string, string | number> = {}): Promise<T> {
        const resposta: RespostaHttp = await this.executar(caminho, parametros);

        return converterJson(resposta) as T;
    }

    /**
     * Percorre todas as páginas de um endpoint de listagem.
     * @param caminho Caminho relativo dentro da API v4.
     * @param parametros Filtros aplicados à listagem.
     * @returns Itens de todas as páginas lidas e se a leitura foi interrompida pelo limite.
     */
    private async getTodasPaginas<T>(caminho: string, parametros: Record<string, string | number> = {}): Promise<PaginaGitLab<T>> {
        const itens: T[] = [];
        let pagina = 1;

        for (;;) {
            const resposta: RespostaHttp = await this.executar(caminho, { ...parametros, per_page: API_GITLAB.ITENS_POR_PAGINA, page: pagina });
            const conteudo: unknown = converterJson(resposta);

            if (!Array.isArray(conteudo))
                throw new ErroGitLab(CodigoErroGitLab.RespostaInesperada, "O GitLab devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido);

            itens.push(...(conteudo as T[]));

            const proximaPagina: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitLab.ProximaPagina] ?? ""), 10);

            if (!Number.isFinite(proximaPagina) || proximaPagina <= 0)
                return { itens, truncada: false };

            if (pagina >= this.configuracao.maxPaginas)
                return { itens, truncada: true };

            pagina = proximaPagina;
        }
    }
}

/**
 * Descobre a pasta que contém um arquivo, a partir do caminho completo dele.
 * @param caminhoArquivo Caminho do arquivo dentro do repositório.
 * @returns Caminho da pasta, ou texto vazio quando o arquivo está na raiz.
 */
function getDiretorioPai(caminhoArquivo: string): string {
    const indiceBarra: number = caminhoArquivo.lastIndexOf("/");

    return indiceBarra === -1 ? "" : caminhoArquivo.slice(0, indiceBarra);
}

/**
 * Converte o corpo de uma resposta em objeto.
 * @param resposta Resposta bruta da API.
 * @returns Conteúdo convertido.
 */
function converterJson(resposta: RespostaHttp): unknown {
    try {
        return JSON.parse(resposta.corpo.toString("utf8"));
    } catch {
        throw new ErroGitLab(CodigoErroGitLab.RespostaInesperada, "O GitLab devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido, "Confirme se a variável GITLAB_URL aponta para o endereço da instância do GitLab.");
    }
}

/**
 * Lê a mensagem de erro que o GitLab envia no corpo da resposta.
 * @param corpo Corpo da resposta com falha.
 * @returns Mensagem do GitLab ou texto vazio quando não houver algo aproveitável.
 */
function lerMensagemDoGitLab(corpo: Buffer): string {
    const texto: string = corpo.toString("utf8").slice(0, API_GITLAB.MAX_CARACTERES_MENSAGEM_ERRO).trim();

    if (!texto)
        return "";

    try {
        const conteudo = JSON.parse(texto) as { message?: unknown; error?: unknown };
        const mensagem: unknown = conteudo.message ?? conteudo.error;

        return typeof mensagem === "string" ? mensagem : "";
    } catch {
        return texto.startsWith("<") ? "" : texto;
    }
}

/** Erro correspondente a cada status HTTP que o GitLab costuma devolver. */
const ERRO_POR_STATUS: Partial<Record<StatusHttp, DefinicaoErroHttp>> = {
    [StatusHttp.NaoAutorizado]: {
        codigo: CodigoErroGitLab.TokenInvalido,
        mensagem: "O token informado é inválido ou está expirado.",
        status: StatusHttp.NaoAutorizado,
        dica: "Gere um novo Personal Access Token com o escopo read_api e atualize o arquivo .env.",
    },
    [StatusHttp.Proibido]: {
        codigo: CodigoErroGitLab.AcessoNegado,
        mensagem: "Seu usuário não tem acesso a este recurso.",
        status: StatusHttp.Proibido,
        dica: "Confirme se o token tem o escopo read_api e se você enxerga esse projeto no GitLab.",
    },
    [StatusHttp.NaoEncontrado]: {
        codigo: CodigoErroGitLab.NaoEncontrado,
        mensagem: "O projeto ou o Merge Request informado não foi encontrado.",
        status: StatusHttp.NaoEncontrado,
        dica: "Confira o Project ID e o IID. O GitLab também responde assim quando o token não tem acesso ao projeto.",
    },
    [StatusHttp.MuitasRequisicoes]: {
        codigo: CodigoErroGitLab.LimiteRequisicoes,
        mensagem: "O GitLab recusou a consulta por excesso de requisições.",
        status: StatusHttp.MuitasRequisicoes,
        dica: "Aguarde alguns segundos ou aumente o intervalo de atualização automática.",
    },
};

/**
 * Converte o status HTTP de uma resposta com falha em um erro tratado.
 * @param resposta Resposta devolvida pelo GitLab.
 * @returns Erro com mensagem e orientação para o usuário.
 */
function converterStatusEmErro(resposta: RespostaHttp): ErroGitLab {
    const detalhe: string = lerMensagemDoGitLab(resposta.corpo);
    const complemento: string = detalhe ? ` Resposta do GitLab: ${detalhe}.` : "";
    const definicao: DefinicaoErroHttp | undefined = ERRO_POR_STATUS[resposta.status as StatusHttp];

    if (definicao)
        return new ErroGitLab(definicao.codigo, `${definicao.mensagem}${complemento}`, definicao.status, definicao.dica);

    if (resposta.status >= StatusHttp.ErroInterno)
        return new ErroGitLab(CodigoErroGitLab.ErroServidorGitLab, `O servidor do GitLab respondeu com erro.${complemento}`, StatusHttp.GatewayInvalido, "Tente novamente em alguns instantes.");

    return new ErroGitLab(CodigoErroGitLab.RespostaInesperada, `O GitLab respondeu de forma inesperada.${complemento}`, StatusHttp.GatewayInvalido);
}

/**
 * Calcula quanto tempo esperar antes de repetir uma chamada barrada por limite de requisições.
 * @param resposta Resposta que trouxe o status 429.
 * @param tentativa Número da tentativa já realizada.
 * @returns Tempo de espera em milissegundos.
 */
function calcularEsperaMs(resposta: RespostaHttp, tentativa: number): number {
    const tentarApos: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitLab.TentarApos] ?? ""), 10);

    if (Number.isFinite(tentarApos) && tentarApos > 0)
        return Math.min(tentarApos * API_GITLAB.MILISSEGUNDOS_POR_SEGUNDO, API_GITLAB.ESPERA_MAX_MS);

    const reinicio: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitLab.ReinicioLimite] ?? ""), 10);
    const esperaAteReinicio: number = Number.isFinite(reinicio) ? reinicio * API_GITLAB.MILISSEGUNDOS_POR_SEGUNDO - Date.now() : 0;

    if (esperaAteReinicio > 0)
        return Math.min(esperaAteReinicio, API_GITLAB.ESPERA_MAX_MS);

    return Math.min(API_GITLAB.ESPERA_BASE_MS * 2 ** tentativa, API_GITLAB.ESPERA_MAX_MS);
}

/**
 * Aguarda um intervalo de tempo.
 * @param milissegundos Tempo de espera.
 * @returns Promise concluída após o tempo informado.
 */
function esperar(milissegundos: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, milissegundos));
}
