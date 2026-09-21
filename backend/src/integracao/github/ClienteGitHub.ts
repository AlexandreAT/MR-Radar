import { OutgoingHttpHeaders } from "http";
import { ConfiguracaoApp, LIMITE } from "../../configuracao/types";
import { DiscussaoNormalizada } from "../../logica/types";
import { EscopoMergeRequest, MergeRequestAberto, MergeRequestResumo, PaginaArquivosAlterados } from "../../models/Revisao/types";
import { MapearComLimite, PaginarLista } from "../../utilidades/Colecoes";
import { StatusHttp } from "../../utilidades/types";
import { ClienteRevisao } from "../ClienteRevisao";
import { CodigoErroProvedor, ErroProvedor } from "../ErroProvedor";
import { ExecutarGet, RespostaHttp } from "../http/ExecutarGet";
import { PaginaNumerada, PaginaResultado } from "../types";
import { ConverterArquivoAlterado, ConverterPullRequest, ConverterPullRequestAberto, MontarDiscussoes } from "./ConversorGitHub";
import { GetStatusResolucaoDasThreads } from "./ExecutarGraphQLStatusResolucao";
import {
    API_GITHUB,
    ArquivoAlteradoGitHub,
    CabecalhoGitHub,
    CodificacaoConteudoGitHub,
    ComentarioIssueGitHub,
    ComentarioRevisaoGitHub,
    ConteudoArquivoGitHub,
    EstadoPullRequestGitHub,
    FiltroBuscaGitHub,
    ItemBuscaGitHub,
    PullRequestGitHub,
    RepositorioGitHub,
    ResultadoBuscaGitHub,
} from "./types";

/** Filtro da busca correspondente a cada escopo exibido na tela. */
const FILTRO_POR_ESCOPO: Record<EscopoMergeRequest, FiltroBuscaGitHub> = {
    [EscopoMergeRequest.CriadosPorMim]: FiltroBuscaGitHub.CriadosPorMim,
    [EscopoMergeRequest.AtribuidosAMim]: FiltroBuscaGitHub.AtribuidosAMim,
};

/** Separador entre dono e repositório no identificador do projeto. */
const SEPARADOR_REPOSITORIO = "/";

/** Partes que um identificador de repositório precisa ter: dono e nome. */
const PARTES_DO_REPOSITORIO = 2;

/** Achado no cabeçalho Link que aponta para a próxima página. */
const RELACAO_PROXIMA_PAGINA = /<([^>]+)>;\s*rel="next"/i;

/**
 * Quantos repositórios entram numa pesquisa por título, começando pelos mais recentemente
 * atualizados. Sem esse limite, um token com centenas de repositórios dispararia uma chamada por
 * repositório de uma vez só.
 */
const MAX_REPOSITORIOS_NA_PESQUISA = 30;

/** Dono e nome do repositório, já separados. */
interface Repositorio {
    dono: string;
    nome: string;
}

/** Códigos de erro que significam apenas "este repositório não está mais no alcance do token". */
const ERROS_FORA_DE_ALCANCE: CodigoErroProvedor[] = [CodigoErroProvedor.NaoEncontrado];

/** Como terminou a tentativa de detalhar um item encontrado na busca. */
interface DetalheDaBusca {
    item: MergeRequestAberto | null;
    falhou: boolean;
}

/** Resultado da consulta de status de resolução das threads, com aviso quando ela falha por permissão. */
interface StatusDeResolucao {
    mapa: Map<number, boolean>;
    aviso: string | null;
}

/** Cliente somente leitura da API REST do GitHub. */
export class ClienteGitHub implements ClienteRevisao {
    private readonly urlBaseApi: string;
    private readonly configuracao: ConfiguracaoApp;

    /**
     * @param configuracao Configuração da aplicação, com URL, token e limites.
     */
    constructor(configuracao: ConfiguracaoApp) {
        this.configuracao = configuracao;
        this.urlBaseApi = configuracao.urlBase;
    }

    /**
     * Busca os dados principais de um Pull Request.
     * @param projetoId Repositório no formato "dono/repositorio".
     * @param mrIid Número do Pull Request.
     * @returns Pull Request no formato de domínio.
     */
    public async GetMergeRequest(projetoId: string, mrIid: string): Promise<MergeRequestResumo> {
        const repositorio: Repositorio = separarRepositorio(projetoId);
        const pullRequest: PullRequestGitHub = await this.getJson<PullRequestGitHub>(`/repos/${repositorio.dono}/${repositorio.nome}/pulls/${encodeURIComponent(mrIid)}`);

        return ConverterPullRequest(pullRequest);
    }

    /**
     * Lista os Pull Requests abertos do dono do token, em todos os repositórios que ele enxerga.
     *
     * A busca é o único jeito de filtrar por autor ou responsável em todos os repositórios de uma
     * vez, mas ela não devolve as branches nem a contagem de comentários de review — por isso cada
     * Pull Request encontrado é buscado em seguida, com o limite de chamadas simultâneas da configuração.
     * @param escopo Se a lista traz os criados por ele ou os atribuídos a ele.
     * @returns Pull Requests já no formato de domínio, do mais recente para o mais antigo.
     */
    public async GetMergeRequestsAbertos(escopo: EscopoMergeRequest): Promise<PaginaResultado<MergeRequestAberto>> {
        const consulta = `is:pr is:open ${FILTRO_POR_ESCOPO[escopo]}`;
        const busca: ResultadoBuscaGitHub = await this.getJson<ResultadoBuscaGitHub>("/search/issues", {
            q: consulta,
            sort: "updated",
            order: "desc",
            per_page: API_GITHUB.ITENS_POR_PAGINA,
        });

        const itens: ItemBuscaGitHub[] = busca.items ?? [];
        const detalhados: DetalheDaBusca[] = await MapearComLimite(itens, this.configuracao.consultasSimultaneas, (item) => this.getDetalheDaBusca(item));
        const algumFalhou: boolean = detalhados.some((detalhe) => detalhe.falhou);

        return {
            itens: detalhados.map((detalhe) => detalhe.item).filter((item): item is MergeRequestAberto => item !== null),
            truncada: Boolean(busca.incomplete_results) || itens.length < (busca.total_count ?? 0) || algumFalhou,
        };
    }

    /**
     * Lista os Pull Requests encerrados (fechados ou mesclados) do dono do token, com paginação real.
     *
     * Diferente de GetMergeRequestsAbertos, esta consulta pagina nativamente pela própria Search
     * API (page/per_page) em vez de trazer tudo de uma vez. A Search API só alcança até
     * MAX_RESULTADOS_BUSCA posições — por isso a página pedida é limitada a esse teto antes da
     * consulta, e o total informado também é limitado a ele, marcando a lista como truncada.
     * @param escopo Se a lista traz os criados por ele ou os atribuídos a ele.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Pull Requests encerrados, do mais recente para o mais antigo.
     */
    public async GetMergeRequestsEncerrados(escopo: EscopoMergeRequest, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>> {
        const tamanhoPagina: number = LIMITE.MERGE_REQUESTS_ENCERRADOS_POR_PAGINA;
        const paginaMaxima: number = Math.floor(API_GITHUB.MAX_RESULTADOS_BUSCA / tamanhoPagina);
        const paginaPedida: number = Math.min(Math.max(1, pagina), paginaMaxima);
        const consulta = `is:pr is:closed ${FILTRO_POR_ESCOPO[escopo]}`;
        const busca: ResultadoBuscaGitHub = await this.getJson<ResultadoBuscaGitHub>("/search/issues", {
            q: consulta,
            sort: "updated",
            order: "desc",
            per_page: tamanhoPagina,
            page: paginaPedida,
        });

        const itens: ItemBuscaGitHub[] = busca.items ?? [];
        const detalhados: DetalheDaBusca[] = await MapearComLimite(itens, this.configuracao.consultasSimultaneas, (item) => this.getDetalheDaBusca(item));
        const algumFalhou: boolean = detalhados.some((detalhe) => detalhe.falhou);
        const totalReal: number = busca.total_count ?? 0;
        const totalItens: number = Math.min(totalReal, API_GITHUB.MAX_RESULTADOS_BUSCA);

        return {
            itens: detalhados.map((detalhe) => detalhe.item).filter((item): item is MergeRequestAberto => item !== null),
            pagina: paginaPedida,
            totalPaginas: Math.max(1, Math.ceil(totalItens / tamanhoPagina)),
            totalItens,
            truncada: Boolean(busca.incomplete_results) || algumFalhou || totalReal > API_GITHUB.MAX_RESULTADOS_BUSCA,
        };
    }

    /**
     * Pesquisa Pull Requests abertos pelo título, entre os repositórios que o token enxerga — não
     * só os criados ou atribuídos ao dono do token.
     *
     * Não usa a Search API do GitHub para isto: ela indexa repositório público independente do
     * escopo do token (conteúdo público não exige permissão para ser buscado), e repetir o
     * qualificador "repo:" para restringir a vários repositórios de uma vez não filtra como um OR
     * confiável (confirmado contra a API real — o total de resultados continuava enorme). Em vez
     * disso, a pesquisa lista os repositórios mais recentes que o token enxerga e procura o termo
     * no título dos Pull Requests abertos de cada um.
     * @param termo Texto pesquisado no título.
     * @returns Pull Requests encontrados, já no formato de domínio, do mais recente para o mais antigo.
     */
    public async BuscarMergeRequests(termo: string): Promise<PaginaResultado<MergeRequestAberto>> {
        const repositorios: PaginaResultado<RepositorioGitHub> = await this.getRepositoriosParaPesquisa();
        const termoNormalizado: string = termo.toLowerCase();

        const resultados: PaginaResultado<MergeRequestAberto>[] = await MapearComLimite(repositorios.itens, this.configuracao.consultasSimultaneas, (repositorio) =>
            this.buscarNoRepositorio(repositorio, termoNormalizado, EstadoPullRequestGitHub.Aberto),
        );

        const itens: MergeRequestAberto[] = resultados.flatMap((resultado) => resultado.itens);
        itens.sort((primeiro, segundo) => segundo.atualizadoEm.localeCompare(primeiro.atualizadoEm));

        return {
            itens,
            truncada: repositorios.truncada || resultados.some((resultado) => resultado.truncada),
        };
    }

    /**
     * Pesquisa Pull Requests encerrados (fechados ou mesclados) pelo título, entre os repositórios
     * que o token enxerga, com paginação real.
     *
     * Assim como BuscarMergeRequests, não há como paginar nativamente uma busca espalhada por
     * vários repositórios: todos os candidatos são coletados e ordenados antes de recortar a
     * página pedida.
     * @param termo Texto pesquisado no título.
     * @param pagina Página pedida, a partir de 1.
     * @returns Página de Pull Requests encontrados, do mais recente para o mais antigo.
     */
    public async BuscarMergeRequestsEncerrados(termo: string, pagina: number): Promise<PaginaNumerada<MergeRequestAberto>> {
        const repositorios: PaginaResultado<RepositorioGitHub> = await this.getRepositoriosParaPesquisa();
        const termoNormalizado: string = termo.toLowerCase();

        const resultados: PaginaResultado<MergeRequestAberto>[] = await MapearComLimite(repositorios.itens, this.configuracao.consultasSimultaneas, (repositorio) =>
            this.buscarNoRepositorio(repositorio, termoNormalizado, EstadoPullRequestGitHub.Fechado),
        );

        const itens: MergeRequestAberto[] = resultados.flatMap((resultado) => resultado.itens);
        itens.sort((primeiro, segundo) => segundo.atualizadoEm.localeCompare(primeiro.atualizadoEm));
        const recorte = PaginarLista(itens, pagina, LIMITE.MERGE_REQUESTS_ENCERRADOS_POR_PAGINA);

        return {
            itens: recorte.itens,
            pagina: recorte.pagina,
            totalPaginas: recorte.totalPaginas,
            totalItens: itens.length,
            truncada: repositorios.truncada || resultados.some((resultado) => resultado.truncada),
        };
    }

    /**
     * Lista, em uma única página, os repositórios mais recentemente atualizados que o token
     * enxerga — os mais prováveis de conter o Pull Request pesquisado.
     * @returns Repositórios a percorrer e se o token enxerga mais do que o limite pesquisado.
     */
    private async getRepositoriosParaPesquisa(): Promise<PaginaResultado<RepositorioGitHub>> {
        const resposta: RespostaHttp = await this.executar("/user/repos", {
            affiliation: "owner,collaborator,organization_member",
            sort: "updated",
            direction: "desc",
            per_page: MAX_REPOSITORIOS_NA_PESQUISA,
        });
        const conteudo: unknown = converterJson(resposta);

        if (!Array.isArray(conteudo))
            throw new ErroProvedor(CodigoErroProvedor.RespostaInesperada, "O GitHub devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido);

        return { itens: conteudo as RepositorioGitHub[], truncada: getProximaPagina(resposta) !== null };
    }

    /**
     * Procura o termo no título dos Pull Requests abertos de um repositório.
     *
     * Um repositório que saiu do alcance do token some da pesquisa em silêncio (o mesmo 404 que
     * getDetalheDaBusca já trata); qualquer outra falha marca a pesquisa como incompleta, em vez
     * de simplesmente sumir sem explicação.
     * @param repositorio Repositório a pesquisar.
     * @param termoNormalizado Termo pesquisado, já em minúsculas.
     * @param estado Situação dos Pull Requests pesquisados (abertos, ou fechados/mesclados).
     * @returns Pull Requests encontrados nesse repositório e se ele pode ter mais do que os lidos.
     */
    private async buscarNoRepositorio(repositorio: RepositorioGitHub, termoNormalizado: string, estado: EstadoPullRequestGitHub): Promise<PaginaResultado<MergeRequestAberto>> {
        try {
            const pullRequests: PullRequestGitHub[] = await this.getJson<PullRequestGitHub[]>(`/repos/${repositorio.full_name}/pulls`, {
                state: estado,
                per_page: API_GITHUB.ITENS_POR_PAGINA,
            });
            const encontrados: PullRequestGitHub[] = pullRequests.filter((pullRequest) => pullRequest.title.toLowerCase().includes(termoNormalizado));

            return {
                itens: encontrados.map((pullRequest) => ConverterPullRequestAberto(pullRequest, repositorio.full_name)),
                truncada: pullRequests.length >= API_GITHUB.ITENS_POR_PAGINA,
            };
        } catch (erro) {
            const codigo: CodigoErroProvedor | null = erro instanceof ErroProvedor ? erro.codigo : null;

            return { itens: [], truncada: !(codigo !== null && ERROS_FORA_DE_ALCANCE.includes(codigo)) };
        }
    }

    /**
     * Busca as threads de comentários de um Pull Request, já normalizadas.
     * @param projetoId Repositório no formato "dono/repositorio".
     * @param mrIid Número do Pull Request.
     * @returns Threads normalizadas e indicação de paginação truncada.
     */
    public async GetDiscussoes(projetoId: string, mrIid: string): Promise<PaginaResultado<DiscussaoNormalizada>> {
        const repositorio: Repositorio = separarRepositorio(projetoId);
        const numero: string = encodeURIComponent(mrIid);

        // O Pull Request é buscado aqui só pelo commit da base: comentário no lado antigo do diff
        // precisa dele, porque commit_id/original_commit_id são sempre commits do head.
        const [pullRequest, revisao, gerais, resolucao] = await Promise.all([
            this.getJson<PullRequestGitHub>(`/repos/${repositorio.dono}/${repositorio.nome}/pulls/${numero}`),
            this.getTodasPaginas<ComentarioRevisaoGitHub>(`/repos/${repositorio.dono}/${repositorio.nome}/pulls/${numero}/comments`),
            this.getTodasPaginas<ComentarioIssueGitHub>(`/repos/${repositorio.dono}/${repositorio.nome}/issues/${numero}/comments`),
            this.getStatusDeResolucao(repositorio, mrIid),
        ]);

        const threads: DiscussaoNormalizada[] = MontarDiscussoes(revisao.itens, gerais.itens, this.configuracao.autoresIgnorados, pullRequest.base?.sha ?? null);

        threads.forEach((thread) => {
            thread.resolvido = resolucao.mapa.get(Number(thread.id)) ?? thread.resolvido;
        });

        return {
            itens: threads,
            truncada: revisao.truncada || gerais.truncada,
            avisos: resolucao.aviso ? [resolucao.aviso] : undefined,
        };
    }

    /**
     * Descobre quais threads de review estão resolvidas.
     *
     * É a única informação que a API REST do GitHub não expõe, e por isso sai de uma consulta
     * GraphQL isolada. Se ela falhar, as threads apenas continuam marcadas como não resolvidas: a
     * tela funciona sem esse detalhe. Quando a falha é de token/permissão, um aviso acompanha o
     * mapa vazio — não fatal, mas visível — em vez de ficar indistinguível de "nenhuma resolvida".
     * @param repositorio Dono e nome do repositório.
     * @param mrIid Número do Pull Request.
     * @returns Mapa de id do comentário raiz para "está resolvida", e um aviso quando aplicável.
     */
    private async getStatusDeResolucao(repositorio: Repositorio, mrIid: string): Promise<StatusDeResolucao> {
        const numero: number = Number.parseInt(mrIid, 10);

        if (!Number.isFinite(numero))
            return { mapa: new Map<number, boolean>(), aviso: null };

        try {
            return { mapa: await GetStatusResolucaoDasThreads(this.configuracao, repositorio.dono, repositorio.nome, numero), aviso: null };
        } catch (erro) {
            const codigo: CodigoErroProvedor | null = erro instanceof ErroProvedor ? erro.codigo : null;
            const semPermissao: boolean = codigo === CodigoErroProvedor.TokenInvalido || codigo === CodigoErroProvedor.AcessoNegado;

            return {
                mapa: new Map<number, boolean>(),
                aviso: semPermissao ? "Não foi possível verificar quais threads estão resolvidas: seu token pode não ter a permissão necessária." : null,
            };
        }
    }

    /**
     * Busca o conteúdo de um arquivo do repositório em um commit específico.
     * @param projetoId Repositório no formato "dono/repositorio".
     * @param caminhoArquivo Caminho do arquivo dentro do repositório.
     * @param ref Commit, branch ou tag usada como referência.
     * @returns Conteúdo do arquivo em texto.
     */
    public async GetArquivoBruto(projetoId: string, caminhoArquivo: string, ref: string): Promise<string> {
        const repositorio: Repositorio = separarRepositorio(projetoId);
        const caminho = `/repos/${repositorio.dono}/${repositorio.nome}/contents/${codificarCaminho(caminhoArquivo)}`;
        const arquivo: ConteudoArquivoGitHub = await this.getJson<ConteudoArquivoGitHub>(caminho, { ref });

        // A Contents API só devolve o conteúdo em base64 dentro do JSON até 1 MB; acima disso ela
        // responde encoding "none" e conteúdo vazio, mesmo para um arquivo de texto comum — sem
        // essa checagem, esse caso seria confundido com arquivo binário.
        const limiteBytes: number = Math.min(this.configuracao.tamanhoMaxArquivoBytes, API_GITHUB.TAMANHO_MAX_CONTEUDO_JSON_BYTES);

        if ((arquivo.size ?? 0) > limiteBytes || arquivo.encoding === CodificacaoConteudoGitHub.Nenhuma)
            throw new ErroProvedor(CodigoErroProvedor.ArquivoMuitoGrande, "O arquivo é grande demais para ser exibido aqui.", StatusHttp.ConteudoMuitoGrande);

        if (arquivo.encoding !== CodificacaoConteudoGitHub.Base64 || !arquivo.content)
            throw new ErroProvedor(CodigoErroProvedor.ArquivoBinario, "O arquivo não tem conteúdo de texto para mostrar.", StatusHttp.TipoNaoSuportado);

        const conteudo: Buffer = Buffer.from(arquivo.content, CodificacaoConteudoGitHub.Base64);

        if (conteudo.includes(0))
            throw new ErroProvedor(CodigoErroProvedor.ArquivoBinario, "O arquivo é binário e não tem trecho de código para mostrar.", StatusHttp.TipoNaoSuportado);

        return conteudo.toString("utf8");
    }

    /**
     * Busca uma página dos arquivos alterados de um Pull Request.
     *
     * Diferente de getTodasPaginas, esta chamada é feita uma única vez: é o próprio frontend quem
     * pede a próxima página (botão "carregar mais"), para nunca buscar de uma vez um Pull Request
     * com centenas de arquivos. O GitHub não informa o total de arquivos neste endpoint.
     * @param projetoId Repositório no formato "dono/repositorio".
     * @param mrIid Número do Pull Request.
     * @param pagina Página desejada, a partir de 1.
     * @returns Arquivos da página e a próxima página, se houver.
     */
    public async GetArquivosAlterados(projetoId: string, mrIid: string, pagina: number): Promise<PaginaArquivosAlterados> {
        const repositorio: Repositorio = separarRepositorio(projetoId);
        const resposta: RespostaHttp = await this.executar(`/repos/${repositorio.dono}/${repositorio.nome}/pulls/${encodeURIComponent(mrIid)}/files`, {
            per_page: LIMITE.ARQUIVOS_ALTERADOS_POR_PAGINA,
            page: pagina,
        });
        const conteudo: unknown = converterJson(resposta);

        if (!Array.isArray(conteudo))
            throw new ErroProvedor(CodigoErroProvedor.RespostaInesperada, "O GitHub devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido);

        return {
            itens: (conteudo as ArquivoAlteradoGitHub[]).map((arquivo) => ConverterArquivoAlterado(arquivo, LIMITE.MAX_LINHAS_DIFF_POR_ARQUIVO)),
            proximaPagina: getProximaPagina(resposta) ? pagina + 1 : null,
            totalArquivos: null,
        };
    }

    /**
     * Busca o Pull Request de um resultado da busca, para completar branches e contagens.
     *
     * Um 404 aqui só significa que o repositório saiu do alcance do token entre a busca e esta
     * chamada, e o item sai da lista em silêncio. Qualquer outra falha é transitória (limite de
     * requisições, erro de rede, erro do servidor) e não pode ser escondida: a lista fica marcada
     * como incompleta em vez de dar a entender que o Pull Request foi fechado ou não existe mais.
     * @param item Item devolvido pela busca.
     * @returns Pull Request pronto para o seletor, e se a leitura falhou por motivo transitório.
     */
    private async getDetalheDaBusca(item: ItemBuscaGitHub): Promise<DetalheDaBusca> {
        const projetoId: string = getProjetoDaUrl(item.repository_url);

        if (!projetoId)
            return { item: null, falhou: false };

        try {
            const repositorio: Repositorio = separarRepositorio(projetoId);
            const pullRequest: PullRequestGitHub = await this.getJson<PullRequestGitHub>(`/repos/${repositorio.dono}/${repositorio.nome}/pulls/${item.number}`);

            return { item: ConverterPullRequestAberto(pullRequest, projetoId), falhou: false };
        } catch (erro) {
            const codigo: CodigoErroProvedor | null = erro instanceof ErroProvedor ? erro.codigo : null;

            // Token inválido ou sem acesso não é uma falha pontual deste Pull Request: o mesmo erro
            // se repetiria para qualquer outro. Isso precisa aparecer como erro de token de verdade,
            // não virar silenciosamente "a lista pode estar incompleta".
            if (codigo === CodigoErroProvedor.TokenInvalido || codigo === CodigoErroProvedor.AcessoNegado)
                throw erro;

            // Um repositório que saiu do alcance do token não pode derrubar a lista inteira, e o
            // GitHub responde 404 tanto para o que não existe quanto para o que perdeu acesso.
            // Qualquer outro código (limite de requisições, erro de rede, erro do servidor) é
            // transitório e precisa aparecer na tela como lista incompleta, não sumir calado.
            return { item: null, falhou: codigo === null || !ERROS_FORA_DE_ALCANCE.includes(codigo) };
        }
    }

    /**
     * Executa uma chamada GET na API, repetindo quando o GitHub responde com limite de requisições.
     * @param urlCompleta URL absoluta a consultar.
     * @returns Resposta bruta já validada.
     */
    private async executarUrl(urlCompleta: string): Promise<RespostaHttp> {
        const cabecalhos: OutgoingHttpHeaders = {
            [CabecalhoGitHub.Autorizacao]: `Bearer ${this.configuracao.token}`,
            [CabecalhoGitHub.VersaoApi]: API_GITHUB.VERSAO_API,
            Accept: API_GITHUB.ACEITA_JSON,
            "User-Agent": API_GITHUB.USER_AGENT,
        };

        for (let tentativa = 0; ; tentativa += 1) {
            const resposta: RespostaHttp = await ExecutarGet(urlCompleta, { cabecalhos, timeoutMs: this.configuracao.timeoutRequisicaoMs });

            if (ehLimiteDeRequisicoes(resposta) && tentativa < API_GITHUB.MAX_TENTATIVAS_LIMITE) {
                await esperar(calcularEsperaMs(resposta, tentativa));
                continue;
            }

            if (resposta.status >= StatusHttp.RequisicaoInvalida)
                throw converterStatusEmErro(resposta);

            return resposta;
        }
    }

    /**
     * Monta a URL de um caminho da API e executa a chamada.
     * @param caminho Caminho relativo dentro da API.
     * @param parametros Parâmetros de query string.
     * @returns Resposta bruta já validada.
     */
    private async executar(caminho: string, parametros: Record<string, string | number> = {}): Promise<RespostaHttp> {
        const url = new URL(this.urlBaseApi + caminho);
        Object.entries(parametros).forEach(([chave, valor]) => url.searchParams.set(chave, String(valor)));

        return this.executarUrl(url.toString());
    }

    /**
     * Executa uma chamada GET e converte a resposta em objeto.
     * @param caminho Caminho relativo dentro da API.
     * @param parametros Parâmetros de query string.
     * @returns Conteúdo da resposta já convertido.
     */
    private async getJson<T>(caminho: string, parametros: Record<string, string | number> = {}): Promise<T> {
        const resposta: RespostaHttp = await this.executar(caminho, parametros);

        return converterJson(resposta) as T;
    }

    /**
     * Percorre todas as páginas de um endpoint de listagem.
     * O GitHub informa a próxima página pela URL completa no cabeçalho Link, e não por um número.
     * @param caminho Caminho relativo dentro da API.
     * @param parametros Filtros aplicados à listagem.
     * @returns Itens de todas as páginas lidas e se a leitura foi interrompida pelo limite.
     */
    private async getTodasPaginas<T>(caminho: string, parametros: Record<string, string | number> = {}): Promise<PaginaResultado<T>> {
        const url = new URL(this.urlBaseApi + caminho);
        Object.entries({ ...parametros, per_page: API_GITHUB.ITENS_POR_PAGINA }).forEach(([chave, valor]) => url.searchParams.set(chave, String(valor)));

        const itens: T[] = [];
        let proximaUrl: string | null = url.toString();

        for (let pagina = 1; proximaUrl; pagina += 1) {
            const resposta: RespostaHttp = await this.executarUrl(proximaUrl);
            const conteudo: unknown = converterJson(resposta);

            if (!Array.isArray(conteudo))
                throw new ErroProvedor(CodigoErroProvedor.RespostaInesperada, "O GitHub devolveu uma resposta em formato inesperado.", StatusHttp.GatewayInvalido);

            itens.push(...(conteudo as T[]));
            proximaUrl = getProximaPagina(resposta);

            // O token só pode ir para o host que está no .env: se o cabeçalho Link apontar para
            // outra origem (proxy reverso, Enterprise atrás de outro domínio), a paginação para
            // aqui em vez de levar a autenticação para um host que o usuário nunca configurou.
            if (proximaUrl && !ehMesmaOrigem(proximaUrl, this.urlBaseApi))
                return { itens, truncada: true };

            if (proximaUrl && pagina >= this.configuracao.maxPaginas)
                return { itens, truncada: true };
        }

        return { itens, truncada: false };
    }
}

/**
 * Separa o identificador do projeto em dono e nome do repositório.
 * @param projetoId Identificador informado na tela.
 * @returns Dono e nome do repositório.
 */
function separarRepositorio(projetoId: string): Repositorio {
    const partes: string[] = projetoId.split(SEPARADOR_REPOSITORIO).filter((parte) => parte !== "");

    if (partes.length !== PARTES_DO_REPOSITORIO)
        throw new ErroProvedor(
            CodigoErroProvedor.ParametroInvalido,
            "O repositório informado não é válido.",
            StatusHttp.RequisicaoInvalida,
            "No GitHub o repositório é informado como dono/repositorio.",
        );

    return { dono: encodeURIComponent(partes[0]), nome: encodeURIComponent(partes[1]) };
}

/**
 * Lê o "dono/repositorio" a partir da URL de repositório devolvida pela busca.
 * @param urlRepositorio URL da API do repositório.
 * @returns Identificador do repositório, ou texto vazio quando a URL não tem o formato esperado.
 */
function getProjetoDaUrl(urlRepositorio: string): string {
    const partes: string[] = String(urlRepositorio ?? "").split(SEPARADOR_REPOSITORIO).filter((parte) => parte !== "");

    if (partes.length < PARTES_DO_REPOSITORIO)
        return "";

    return partes.slice(-PARTES_DO_REPOSITORIO).join(SEPARADOR_REPOSITORIO);
}

/**
 * Codifica o caminho do arquivo preservando as barras de diretório.
 * @param caminhoArquivo Caminho do arquivo dentro do repositório.
 * @returns Caminho pronto para entrar na URL.
 */
function codificarCaminho(caminhoArquivo: string): string {
    return caminhoArquivo.split(SEPARADOR_REPOSITORIO).map(encodeURIComponent).join(SEPARADOR_REPOSITORIO);
}

/**
 * Indica se a URL informada pelo servidor aponta para a mesma origem da API configurada.
 * O token só pode sair para o host que o usuário configurou no .env.
 * @param urlAlvo URL lida do cabeçalho Link.
 * @param urlBase URL base da API configurada.
 * @returns Verdadeiro quando as duas URLs têm a mesma origem.
 */
function ehMesmaOrigem(urlAlvo: string, urlBase: string): boolean {
    try {
        return new URL(urlAlvo).origin === new URL(urlBase).origin;
    } catch {
        return false;
    }
}

/**
 * Lê a URL da próxima página no cabeçalho Link.
 * @param resposta Resposta devolvida pela API.
 * @returns URL da próxima página, ou nulo quando esta é a última.
 */
function getProximaPagina(resposta: RespostaHttp): string | null {
    const link: string = String(resposta.cabecalhos[CabecalhoGitHub.Paginacao] ?? "");
    const encontrado: RegExpMatchArray | null = link.match(RELACAO_PROXIMA_PAGINA);

    return encontrado ? encontrado[1] : null;
}

/**
 * Indica se a resposta foi recusada por limite de requisições.
 * O GitHub usa 429 e também 403 com o saldo de requisições zerado.
 * @param resposta Resposta devolvida pela API.
 * @returns Verdadeiro quando vale a pena tentar de novo.
 */
function ehLimiteDeRequisicoes(resposta: RespostaHttp): boolean {
    if (resposta.status === StatusHttp.MuitasRequisicoes)
        return true;

    return resposta.status === StatusHttp.Proibido && String(resposta.cabecalhos[CabecalhoGitHub.LimiteRestante] ?? "") === "0";
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
        throw new ErroProvedor(
            CodigoErroProvedor.RespostaInesperada,
            "O GitHub devolveu uma resposta em formato inesperado.",
            StatusHttp.GatewayInvalido,
            "Confirme se a variável GITHUB_URL aponta para o endereço da API do GitHub.",
        );
    }
}

/**
 * Lê a mensagem de erro que o GitHub envia no corpo da resposta.
 * @param corpo Corpo da resposta com falha.
 * @returns Mensagem do GitHub ou texto vazio quando não houver algo aproveitável.
 */
function lerMensagemDoGitHub(corpo: Buffer): string {
    const texto: string = corpo.toString("utf8").slice(0, API_GITHUB.MAX_CARACTERES_MENSAGEM_ERRO).trim();

    if (!texto)
        return "";

    try {
        const conteudo = JSON.parse(texto) as { message?: unknown };

        return typeof conteudo.message === "string" ? conteudo.message : "";
    } catch {
        return texto.startsWith("<") ? "" : texto;
    }
}

/**
 * Converte o status HTTP de uma resposta com falha em um erro tratado.
 * @param resposta Resposta devolvida pelo GitHub.
 * @returns Erro com mensagem e orientação para o usuário.
 */
function converterStatusEmErro(resposta: RespostaHttp): ErroProvedor {
    const detalhe: string = lerMensagemDoGitHub(resposta.corpo);
    const complemento: string = detalhe ? ` Resposta do GitHub: ${detalhe}.` : "";

    if (resposta.status === StatusHttp.NaoAutorizado)
        return new ErroProvedor(
            CodigoErroProvedor.TokenInvalido,
            `O token informado é inválido ou está expirado.${complemento}`,
            StatusHttp.NaoAutorizado,
            "Gere um novo Personal Access Token com permissão de leitura e atualize o arquivo .env.",
        );

    if (ehLimiteDeRequisicoes(resposta))
        return new ErroProvedor(
            CodigoErroProvedor.LimiteRequisicoes,
            `O GitHub recusou a consulta por excesso de requisições.${complemento}`,
            StatusHttp.MuitasRequisicoes,
            "Aguarde alguns minutos: o limite do GitHub é por hora.",
        );

    if (resposta.status === StatusHttp.Proibido)
        return new ErroProvedor(
            CodigoErroProvedor.AcessoNegado,
            `Seu usuário não tem acesso a este recurso.${complemento}`,
            StatusHttp.Proibido,
            "Confirme se o token dá acesso de leitura a este repositório.",
        );

    if (resposta.status === StatusHttp.NaoEncontrado)
        return new ErroProvedor(
            CodigoErroProvedor.NaoEncontrado,
            `O repositório ou o Pull Request informado não foi encontrado.${complemento}`,
            StatusHttp.NaoEncontrado,
            "Confira o dono/repositorio e o número. O GitHub também responde assim quando o token não tem acesso.",
        );

    if (resposta.status >= StatusHttp.ErroInterno)
        return new ErroProvedor(CodigoErroProvedor.ErroServidorProvedor, `O servidor do GitHub respondeu com erro.${complemento}`, StatusHttp.GatewayInvalido, "Tente novamente em alguns instantes.");

    return new ErroProvedor(CodigoErroProvedor.RespostaInesperada, `O GitHub respondeu de forma inesperada.${complemento}`, StatusHttp.GatewayInvalido);
}

/**
 * Calcula quanto tempo esperar antes de repetir uma chamada barrada por limite de requisições.
 * @param resposta Resposta que trouxe a recusa.
 * @param tentativa Número da tentativa já realizada.
 * @returns Tempo de espera em milissegundos.
 */
function calcularEsperaMs(resposta: RespostaHttp, tentativa: number): number {
    const tentarApos: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitHub.TentarApos] ?? ""), 10);

    if (Number.isFinite(tentarApos) && tentarApos > 0)
        return Math.min(tentarApos * API_GITHUB.MILISSEGUNDOS_POR_SEGUNDO, API_GITHUB.ESPERA_MAX_MS);

    const reinicio: number = Number.parseInt(String(resposta.cabecalhos[CabecalhoGitHub.ReinicioLimite] ?? ""), 10);
    const esperaAteReinicio: number = Number.isFinite(reinicio) ? reinicio * API_GITHUB.MILISSEGUNDOS_POR_SEGUNDO - Date.now() : 0;

    if (esperaAteReinicio > 0)
        return Math.min(esperaAteReinicio, API_GITHUB.ESPERA_MAX_MS);

    return Math.min(API_GITHUB.ESPERA_BASE_MS * 2 ** tentativa, API_GITHUB.ESPERA_MAX_MS);
}

/**
 * Aguarda um intervalo de tempo.
 * @param milissegundos Tempo de espera.
 * @returns Promise concluída após o tempo informado.
 */
function esperar(milissegundos: number): Promise<void> {
    return new Promise((resolver) => setTimeout(resolver, milissegundos));
}
