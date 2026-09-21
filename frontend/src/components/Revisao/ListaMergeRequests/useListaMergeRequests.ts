import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuscarMergeRequests, BuscarMergeRequestsEncerrados, GetMeusMergeRequests, GetMeusMergeRequestsEncerrados } from "src/api/Revisao";
import { ConfiguracaoDashboard, EscopoMergeRequest, MergeRequestAberto } from "src/api/Revisao/types";
import { ConverterErro, EhCancelamento } from "src/services";
import { MensagemErro } from "src/services/types";
import { AvisarSeProblemaDeToken } from "src/utils/AvisoToken";
import { GetVocabulario, Vocabulario } from "src/utils/Vocabulario";
import { AbaMergeRequests, GetErroCarregarLista, TEXTO_LISTA, TERMO_PESQUISA_MIN_CARACTERES } from "./types";

/**
 * Concentra o estado e as consultas da lista de Merge Requests: os abertos (por escopo, ou por
 * pesquisa de título) e os encerrados (mesma coisa, com paginação real de 20 em 20).
 * @param configuracao Configuração do backend, já carregada pelo aplicativo.
 * @returns Estado das duas abas e os manipuladores usados pelo componente.
 */
export function useListaMergeRequests(configuracao: ConfiguracaoDashboard | null) {
    const configuracaoValida: boolean = Boolean(configuracao && configuracao.problemas.length === 0);
    const vocabulario: Vocabulario = GetVocabulario(configuracao?.provedor);

    const [aba, setAba] = useState<AbaMergeRequests>(AbaMergeRequests.Abertos);

    const [escopo, setEscopo] = useState<EscopoMergeRequest>(EscopoMergeRequest.CriadosPorMim);
    const [mergeRequests, setMergeRequests] = useState<MergeRequestAberto[]>([]);
    const [listaTruncada, setListaTruncada] = useState<boolean>(false);
    const [carregandoLista, setCarregandoLista] = useState<boolean>(false);
    const [erroLista, setErroLista] = useState<MensagemErro | null>(null);

    // resultadosPesquisa nulo é "sem pesquisa ativa": a lista mostrada volta a ser a de escopo.
    const [termoPesquisa, setTermoPesquisa] = useState<string>("");
    const [resultadosPesquisa, setResultadosPesquisa] = useState<MergeRequestAberto[] | null>(null);
    const [pesquisaTruncada, setPesquisaTruncada] = useState<boolean>(false);
    const [pesquisando, setPesquisando] = useState<boolean>(false);
    const [erroPesquisa, setErroPesquisa] = useState<MensagemErro | null>(null);

    const [escopoEncerrados, setEscopoEncerrados] = useState<EscopoMergeRequest>(EscopoMergeRequest.CriadosPorMim);
    const [mergeRequestsEncerrados, setMergeRequestsEncerrados] = useState<MergeRequestAberto[]>([]);
    const [paginaEncerrados, setPaginaEncerrados] = useState<number>(1);
    const [totalPaginasEncerrados, setTotalPaginasEncerrados] = useState<number>(1);
    const [totalItensEncerrados, setTotalItensEncerrados] = useState<number>(0);
    const [truncadaEncerrados, setTruncadaEncerrados] = useState<boolean>(false);
    const [carregandoEncerrados, setCarregandoEncerrados] = useState<boolean>(false);
    const [erroEncerrados, setErroEncerrados] = useState<MensagemErro | null>(null);

    const [termoPesquisaEncerrados, setTermoPesquisaEncerrados] = useState<string>("");
    const [resultadosPesquisaEncerrados, setResultadosPesquisaEncerrados] = useState<MergeRequestAberto[] | null>(null);
    const [paginaPesquisaEncerrados, setPaginaPesquisaEncerrados] = useState<number>(1);
    const [totalPaginasPesquisaEncerrados, setTotalPaginasPesquisaEncerrados] = useState<number>(1);
    const [totalItensPesquisaEncerrados, setTotalItensPesquisaEncerrados] = useState<number>(0);
    const [truncadaPesquisaEncerrados, setTruncadaPesquisaEncerrados] = useState<boolean>(false);
    const [pesquisandoEncerrados, setPesquisandoEncerrados] = useState<boolean>(false);
    const [erroPesquisaEncerrados, setErroPesquisaEncerrados] = useState<MensagemErro | null>(null);

    const requisicaoDaLista = useRef<AbortController | null>(null);
    const requisicaoDaPesquisa = useRef<AbortController | null>(null);
    const requisicaoDeEncerrados = useRef<AbortController | null>(null);
    const requisicaoDaPesquisaEncerrados = useRef<AbortController | null>(null);

    const podePesquisar: boolean = useMemo(() => termoPesquisa.trim().length >= TERMO_PESQUISA_MIN_CARACTERES, [termoPesquisa]);
    const podePesquisarEncerrados: boolean = useMemo(() => termoPesquisaEncerrados.trim().length >= TERMO_PESQUISA_MIN_CARACTERES, [termoPesquisaEncerrados]);

    // A aba de abertos mostra a pesquisa quando ela está ativa, senão a lista por escopo — e o
    // mesmo vale para a aba de encerrados, só que com paginação própria.
    const emModoPesquisa: boolean = resultadosPesquisa !== null;
    const itensAbertosExibidos: MergeRequestAberto[] = resultadosPesquisa ?? mergeRequests;
    const truncadaAbertosExibida: boolean = emModoPesquisa ? pesquisaTruncada : listaTruncada;
    const carregandoAbertosExibido: boolean = emModoPesquisa ? pesquisando : carregandoLista;

    const emModoPesquisaEncerrados: boolean = resultadosPesquisaEncerrados !== null;
    const itensEncerradosExibidos: MergeRequestAberto[] = resultadosPesquisaEncerrados ?? mergeRequestsEncerrados;
    const truncadaEncerradosExibida: boolean = emModoPesquisaEncerrados ? truncadaPesquisaEncerrados : truncadaEncerrados;
    const carregandoEncerradosExibido: boolean = emModoPesquisaEncerrados ? pesquisandoEncerrados : carregandoEncerrados;
    const erroEncerradosExibido: MensagemErro | null = emModoPesquisaEncerrados ? erroPesquisaEncerrados : erroEncerrados;
    const paginaEncerradosExibida: number = emModoPesquisaEncerrados ? paginaPesquisaEncerrados : paginaEncerrados;
    const totalPaginasEncerradosExibida: number = emModoPesquisaEncerrados ? totalPaginasPesquisaEncerrados : totalPaginasEncerrados;
    const totalItensEncerradosExibido: number = emModoPesquisaEncerrados ? totalItensPesquisaEncerrados : totalItensEncerrados;

    useEffect(
        () => () => {
            requisicaoDaLista.current?.abort();
            requisicaoDaPesquisa.current?.abort();
            requisicaoDeEncerrados.current?.abort();
            requisicaoDaPesquisaEncerrados.current?.abort();
        },
        [],
    );

    const carregarMeusMergeRequests = useCallback(async () => {
        // Sem .env preenchido a consulta falharia de qualquer jeito, e o painel de configuração já avisa o motivo.
        if (!configuracaoValida)
            return;

        requisicaoDaLista.current?.abort();
        const controlador = new AbortController();
        requisicaoDaLista.current = controlador;
        setCarregandoLista(true);

        try {
            const lista = await GetMeusMergeRequests(escopo, controlador.signal);

            setMergeRequests(lista.mergeRequests);
            setListaTruncada(lista.paginacaoTruncada);
            setErroLista(null);
        } catch (falha: unknown) {
            if (EhCancelamento(falha))
                return;

            const mensagemErro: MensagemErro = ConverterErro(falha, GetErroCarregarLista(vocabulario, false));

            setMergeRequests([]);
            setErroLista(mensagemErro);
            AvisarSeProblemaDeToken(mensagemErro, "Lista de Merge Requests");
        } finally {
            if (requisicaoDaLista.current === controlador) {
                requisicaoDaLista.current = null;
                setCarregandoLista(false);
            }
        }
    }, [configuracaoValida, escopo, vocabulario]);

    useEffect(() => {
        void carregarMeusMergeRequests();
    }, [carregarMeusMergeRequests]);

    /**
     * Pesquisa Merge Requests abertos pelo título, entre todos os que o token enxerga.
     * @returns Nada.
     */
    async function pesquisar(): Promise<void> {
        const termo: string = termoPesquisa.trim();

        if (termo.length < TERMO_PESQUISA_MIN_CARACTERES)
            return;

        requisicaoDaPesquisa.current?.abort();
        const controlador = new AbortController();
        requisicaoDaPesquisa.current = controlador;
        setPesquisando(true);

        try {
            const resultado = await BuscarMergeRequests(termo, controlador.signal);

            setResultadosPesquisa(resultado.mergeRequests);
            setPesquisaTruncada(resultado.paginacaoTruncada);
            setErroPesquisa(null);
        } catch (falha: unknown) {
            if (EhCancelamento(falha))
                return;

            const mensagemErro: MensagemErro = ConverterErro(falha, TEXTO_LISTA.ERRO_PESQUISA);

            setResultadosPesquisa(null);
            setErroPesquisa(mensagemErro);
            AvisarSeProblemaDeToken(mensagemErro, "Pesquisa de Merge Requests");
        } finally {
            if (requisicaoDaPesquisa.current === controlador) {
                requisicaoDaPesquisa.current = null;
                setPesquisando(false);
            }
        }
    }

    /**
     * Carrega a página pedida dos Merge Requests encerrados do escopo atual. Não faz nada fora
     * da aba de encerrados, para não gastar uma consulta que a tela não está mostrando.
     * @param pagina Página pedida, a partir de 1.
     * @returns Nada.
     */
    const carregarEncerrados = useCallback(
        async (pagina: number) => {
            if (!configuracaoValida || aba !== AbaMergeRequests.Encerrados)
                return;

            requisicaoDeEncerrados.current?.abort();
            const controlador = new AbortController();
            requisicaoDeEncerrados.current = controlador;
            setCarregandoEncerrados(true);

            try {
                const resultado = await GetMeusMergeRequestsEncerrados(escopoEncerrados, pagina, controlador.signal);

                setMergeRequestsEncerrados(resultado.mergeRequests);
                setPaginaEncerrados(resultado.pagina);
                setTotalPaginasEncerrados(resultado.totalPaginas);
                setTotalItensEncerrados(resultado.totalItens);
                setTruncadaEncerrados(resultado.truncada);
                setErroEncerrados(null);
            } catch (falha: unknown) {
                if (EhCancelamento(falha))
                    return;

                const mensagemErro: MensagemErro = ConverterErro(falha, GetErroCarregarLista(vocabulario, true));

                setMergeRequestsEncerrados([]);
                setErroEncerrados(mensagemErro);
                AvisarSeProblemaDeToken(mensagemErro, "Lista de Merge Requests encerrados");
            } finally {
                if (requisicaoDeEncerrados.current === controlador) {
                    requisicaoDeEncerrados.current = null;
                    setCarregandoEncerrados(false);
                }
            }
        },
        [configuracaoValida, escopoEncerrados, aba, vocabulario],
    );

    // Dispara sozinho ao entrar na aba de encerrados (aba muda) e sempre que o escopo dela muda.
    useEffect(() => {
        void carregarEncerrados(1);
    }, [carregarEncerrados]);

    /**
     * Pesquisa Merge Requests encerrados pelo título, entre todos os que o token enxerga.
     * @param pagina Página pedida, a partir de 1.
     * @returns Nada.
     */
    async function pesquisarEncerrados(pagina: number): Promise<void> {
        const termo: string = termoPesquisaEncerrados.trim();

        if (termo.length < TERMO_PESQUISA_MIN_CARACTERES)
            return;

        requisicaoDaPesquisaEncerrados.current?.abort();
        const controlador = new AbortController();
        requisicaoDaPesquisaEncerrados.current = controlador;
        setPesquisandoEncerrados(true);

        try {
            const resultado = await BuscarMergeRequestsEncerrados(termo, pagina, controlador.signal);

            setResultadosPesquisaEncerrados(resultado.mergeRequests);
            setPaginaPesquisaEncerrados(resultado.pagina);
            setTotalPaginasPesquisaEncerrados(resultado.totalPaginas);
            setTotalItensPesquisaEncerrados(resultado.totalItens);
            setTruncadaPesquisaEncerrados(resultado.truncada);
            setErroPesquisaEncerrados(null);
        } catch (falha: unknown) {
            if (EhCancelamento(falha))
                return;

            const mensagemErro: MensagemErro = ConverterErro(falha, TEXTO_LISTA.ERRO_PESQUISA);

            setResultadosPesquisaEncerrados(null);
            setErroPesquisaEncerrados(mensagemErro);
            AvisarSeProblemaDeToken(mensagemErro, "Pesquisa de Merge Requests encerrados");
        } finally {
            if (requisicaoDaPesquisaEncerrados.current === controlador) {
                requisicaoDaPesquisaEncerrados.current = null;
                setPesquisandoEncerrados(false);
            }
        }
    }

    /**
     * Troca a aba exibida: Merge Requests abertos, ou encerrados.
     * @param novaAba Aba escolhida.
     * @returns Nada.
     */
    function handleAlterarAba(novaAba: AbaMergeRequests): void {
        setAba(novaAba);
    }

    /**
     * Troca de quem são os Merge Requests abertos listados.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarEscopo(valor: string): void {
        setEscopo(valor as EscopoMergeRequest);
    }

    /**
     * Recarrega a lista de Merge Requests abertos do usuário.
     * @returns Nada.
     */
    function handleAtualizar(): void {
        void carregarMeusMergeRequests();
    }

    /**
     * Atualiza o termo pesquisado nos Merge Requests abertos. Esvaziar o campo volta a mostrar a
     * lista por escopo na hora, sem precisar de um botão de limpar à parte.
     * @param valor Texto digitado no campo de pesquisa.
     * @returns Nada.
     */
    function handleAlterarTermoPesquisa(valor: string): void {
        setTermoPesquisa(valor);

        if (!valor.trim()) {
            requisicaoDaPesquisa.current?.abort();
            setResultadosPesquisa(null);
            setErroPesquisa(null);
        }
    }

    /**
     * Dispara a pesquisa de Merge Requests abertos, a partir do botão e da tecla Enter.
     * @returns Nada.
     */
    function handlePesquisar(): void {
        void pesquisar();
    }

    /**
     * Troca de quem são os Merge Requests encerrados listados, recarregando a primeira página.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarEscopoEncerrados(valor: string): void {
        setEscopoEncerrados(valor as EscopoMergeRequest);
    }

    /**
     * Recarrega a página atual dos Merge Requests encerrados.
     * @returns Nada.
     */
    function handleAtualizarEncerrados(): void {
        void carregarEncerrados(paginaEncerrados);
    }

    /**
     * Troca de página na lista de Merge Requests encerrados por escopo.
     * @param pagina Página pedida, a partir de 1.
     * @returns Nada.
     */
    function handleAlterarPaginaEncerrados(pagina: number): void {
        void carregarEncerrados(pagina);
    }

    /**
     * Atualiza o termo pesquisado nos Merge Requests encerrados. Esvaziar o campo volta a mostrar
     * a lista por escopo na hora, sem precisar de um botão de limpar à parte.
     * @param valor Texto digitado no campo de pesquisa.
     * @returns Nada.
     */
    function handleAlterarTermoPesquisaEncerrados(valor: string): void {
        setTermoPesquisaEncerrados(valor);

        if (!valor.trim()) {
            requisicaoDaPesquisaEncerrados.current?.abort();
            setResultadosPesquisaEncerrados(null);
            setErroPesquisaEncerrados(null);
        }
    }

    /**
     * Dispara a pesquisa de Merge Requests encerrados, a partir do botão e da tecla Enter.
     * @returns Nada.
     */
    function handlePesquisarEncerrados(): void {
        void pesquisarEncerrados(1);
    }

    /**
     * Troca de página nos resultados da pesquisa de Merge Requests encerrados.
     * @param pagina Página pedida, a partir de 1.
     * @returns Nada.
     */
    function handleAlterarPaginaPesquisaEncerrados(pagina: number): void {
        void pesquisarEncerrados(pagina);
    }

    return {
        vocabulario,
        aba,
        escopo,
        itensAbertosExibidos,
        truncadaAbertosExibida,
        carregandoAbertosExibido,
        erroLista,
        termoPesquisa,
        podePesquisar,
        emModoPesquisa,
        erroPesquisa,
        escopoEncerrados,
        itensEncerradosExibidos,
        truncadaEncerradosExibida,
        carregandoEncerradosExibido,
        erroEncerradosExibido,
        paginaEncerradosExibida,
        totalPaginasEncerradosExibida,
        totalItensEncerradosExibido,
        emModoPesquisaEncerrados,
        termoPesquisaEncerrados,
        podePesquisarEncerrados,
        handleAlterarAba,
        handleAlterarEscopo,
        handleAtualizar,
        handleAlterarTermoPesquisa,
        handlePesquisar,
        handleAlterarEscopoEncerrados,
        handleAtualizarEncerrados,
        handleAlterarPaginaEncerrados,
        handleAlterarTermoPesquisaEncerrados,
        handlePesquisarEncerrados,
        handleAlterarPaginaPesquisaEncerrados,
    };
}
