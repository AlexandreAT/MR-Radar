import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BuscarMergeRequests, GetComentariosRevisao, GetMeusMergeRequests } from "src/api/Revisao";
import {
    CodigoErroBackend,
    CodigoErroTrecho,
    ComentarioRevisao,
    ConfiguracaoDashboard,
    EscopoMergeRequest,
    ListaMergeRequestsAbertos,
    MergeRequestAberto,
    RevisaoMergeRequest,
    StatusFiltro,
} from "src/api/Revisao/types";
import { ConverterErro, EhCancelamento } from "src/services";
import { CODIGO_ERRO_COMUNICACAO, MensagemErro } from "src/services/types";
import { AvisarAvisos, AvisarSeProblemaDeToken } from "src/utils/AvisoToken";
import { FormatarComentariosParaCopia } from "src/utils/ComentariosParaCopia";
import {
    EscopoCobreSituacao,
    FiltrarComentarios,
    OrdenacaoComentarios,
    OrdenarComentarios,
    RECORTE_TODOS,
    SITUACAO_POR_STATUS,
    SituacaoComentario,
} from "src/utils/ComentariosRevisao";
import { FormatarHora } from "src/utils/Formatacao";
import { ExtrairDadosDaUrl } from "src/utils/MergeRequestUrl";
import { ChavePreferencia, GetPreferencia, SalvarPreferencia } from "src/utils/Preferencias";
import { GetVocabulario, Vocabulario } from "src/utils/Vocabulario";
import {
    CODIGOS_ERRO_PERMANENTE,
    EstadoCopia,
    GetMensagensDoProvedor,
    INTERVALO_PADRAO_SEGUNDOS,
    MENSAGEM,
    MensagensDoProvedor,
    MILISSEGUNDOS_POR_SEGUNDO,
    OpcoesBusca,
    TEMPO_RETORNO_COPIA_MS,
    TERMO_PESQUISA_MIN_CARACTERES,
} from "./types";

/**
 * Concentra o estado e as consultas da tela de revisão.
 * @param configuracao Configuração do backend, já carregada pelo aplicativo.
 * @returns Estado da tela, Merge Requests do usuário, comentários e os manipuladores usados pelos componentes.
 */
export function usePainelRevisao(configuracao: ConfiguracaoDashboard | null) {
    const [projetoId, setProjetoId] = useState<string>(() => GetPreferencia(ChavePreferencia.ProjetoId));
    const [mrIid, setMrIid] = useState<string>(() => GetPreferencia(ChavePreferencia.MrIid));
    const [status, setStatus] = useState<StatusFiltro>(StatusFiltro.Abertos);
    const [situacao, setSituacao] = useState<SituacaoComentario | null>(SITUACAO_POR_STATUS[StatusFiltro.Abertos]);
    const [ordenacao, setOrdenacao] = useState<OrdenacaoComentarios>(OrdenacaoComentarios.MaisRecentes);
    const [recorte, setRecorte] = useState<string>(RECORTE_TODOS);
    const [atualizacaoAutomatica, setAtualizacaoAutomatica] = useState<boolean>(false);
    const [intervaloSegundos, setIntervaloSegundos] = useState<number>(INTERVALO_PADRAO_SEGUNDOS);
    const [revisao, setRevisao] = useState<RevisaoMergeRequest | null>(null);
    // Guardado junto com o revisao (não é o mesmo que o projetoId do campo, que o usuário pode
    // editar sem clicar em Buscar): é o projeto que realmente carregou o Merge Request na tela.
    const [projetoIdCarregado, setProjetoIdCarregado] = useState<string>("");
    const [carregando, setCarregando] = useState<boolean>(false);
    const [erro, setErro] = useState<MensagemErro | null>(null);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>("");
    const [estadoCopia, setEstadoCopia] = useState<EstadoCopia>(EstadoCopia.Ocioso);

    const [escopo, setEscopo] = useState<EscopoMergeRequest>(EscopoMergeRequest.CriadosPorMim);
    const [meusMergeRequests, setMeusMergeRequests] = useState<MergeRequestAberto[]>([]);
    const [listaTruncada, setListaTruncada] = useState<boolean>(false);
    const [carregandoLista, setCarregandoLista] = useState<boolean>(false);
    const [erroLista, setErroLista] = useState<MensagemErro | null>(null);

    // resultadosPesquisa nulo é "sem pesquisa ativa": a lista mostrada volta a ser a de escopo.
    const [termoPesquisa, setTermoPesquisa] = useState<string>("");
    const [resultadosPesquisa, setResultadosPesquisa] = useState<MergeRequestAberto[] | null>(null);
    const [pesquisaTruncada, setPesquisaTruncada] = useState<boolean>(false);
    const [pesquisando, setPesquisando] = useState<boolean>(false);
    const [erroPesquisa, setErroPesquisa] = useState<MensagemErro | null>(null);

    const requisicaoEmAndamento = useRef<AbortController | null>(null);
    const requisicaoDaLista = useRef<AbortController | null>(null);
    const requisicaoDaPesquisa = useRef<AbortController | null>(null);
    const temporizadorCopia = useRef<number | null>(null);

    const podeBuscar: boolean = useMemo(() => Boolean(projetoId.trim() && mrIid.trim()), [projetoId, mrIid]);
    const podePesquisar: boolean = useMemo(() => termoPesquisa.trim().length >= TERMO_PESQUISA_MIN_CARACTERES, [termoPesquisa]);
    const configuracaoValida: boolean = Boolean(configuracao && configuracao.problemas.length === 0);
    const vocabulario: Vocabulario = GetVocabulario(configuracao?.provedor);
    const mensagens: MensagensDoProvedor = GetMensagensDoProvedor(vocabulario);

    // A lista exibida é sempre a que sobrou dos filtros da tela, na ordem escolhida.
    const comentarios: ComentarioRevisao[] = useMemo(
        () => OrdenarComentarios(FiltrarComentarios(revisao?.comentarios ?? [], situacao, recorte), ordenacao),
        [revisao, situacao, recorte, ordenacao],
    );

    useEffect(() => SalvarPreferencia(ChavePreferencia.ProjetoId, projetoId), [projetoId]);

    useEffect(() => SalvarPreferencia(ChavePreferencia.MrIid, mrIid), [mrIid]);

    useEffect(
        () => () => {
            requisicaoEmAndamento.current?.abort();
            requisicaoDaLista.current?.abort();
            requisicaoDaPesquisa.current?.abort();

            if (temporizadorCopia.current)
                window.clearTimeout(temporizadorCopia.current);
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
            const lista: ListaMergeRequestsAbertos = await GetMeusMergeRequests(escopo, controlador.signal);

            setMeusMergeRequests(lista.mergeRequests);
            setListaTruncada(lista.paginacaoTruncada);
            setErroLista(null);
        } catch (falha: unknown) {
            if (EhCancelamento(falha))
                return;

            const mensagemErro: MensagemErro = ConverterErro(falha, mensagens.ERRO_LISTA);

            setMeusMergeRequests([]);
            setErroLista(mensagemErro);
            AvisarSeProblemaDeToken(mensagemErro, "Lista de Merge Requests");
        } finally {
            if (requisicaoDaLista.current === controlador) {
                requisicaoDaLista.current = null;
                setCarregandoLista(false);
            }
        }
    }, [configuracaoValida, escopo]);

    useEffect(() => {
        void carregarMeusMergeRequests();
    }, [carregarMeusMergeRequests]);

    const buscar = useCallback(
        async (opcoes: OpcoesBusca = {}) => {
            const projeto: string = (opcoes.projetoId ?? projetoId).trim();
            const iid: string = (opcoes.mrIid ?? mrIid).trim();
            const statusBusca: StatusFiltro = opcoes.status ?? status;
            const silenciosa: boolean = opcoes.silenciosa ?? false;

            if (!projeto || !iid) {
                setErro({ codigo: CODIGO_ERRO_COMUNICACAO, mensagem: mensagens.CAMPOS_OBRIGATORIOS, dica: "" });
                return;
            }

            // A atualização automática nunca interrompe uma consulta em andamento: em Merge Requests
            // grandes a consulta pode demorar mais que o intervalo e nunca chegaria ao fim.
            if (silenciosa && requisicaoEmAndamento.current)
                return;

            requisicaoEmAndamento.current?.abort();
            const controlador = new AbortController();
            requisicaoEmAndamento.current = controlador;

            if (!silenciosa)
                setCarregando(true);

            try {
                const dados: RevisaoMergeRequest = await GetComentariosRevisao({ projetoId: projeto, mrIid: iid, status: statusBusca }, controlador.signal);

                setRevisao(dados);
                setProjetoIdCarregado(projeto);
                setErro(null);
                setUltimaAtualizacao(FormatarHora(new Date()));
                AvisarAvisos(dados.avisos);

                // Todos os comentários sem permissão de ler o trecho vêm do mesmo motivo (o token
                // não tem o acesso necessário) — um só aviso, não um por comentário.
                if (dados.comentarios.some((comentario) => comentario.erroTrecho?.codigo === CodigoErroTrecho.SemPermissao))
                    AvisarSeProblemaDeToken({ codigo: CodigoErroBackend.AcessoNegado, mensagem: MENSAGEM.ERRO_TRECHO_SEM_PERMISSAO, dica: "" }, "Trecho de código");
            } catch (falha: unknown) {
                if (EhCancelamento(falha))
                    return;

                tratarFalha(falha, silenciosa);
            } finally {
                if (requisicaoEmAndamento.current === controlador) {
                    requisicaoEmAndamento.current = null;
                    setCarregando(false);
                }
            }
        },
        [projetoId, mrIid, status],
    );

    // O temporizador lê a busca por referência para não ser reiniciado a cada tecla digitada.
    const buscarAtual = useRef(buscar);

    useEffect(() => {
        buscarAtual.current = buscar;
    }, [buscar]);

    useEffect(() => {
        if (!atualizacaoAutomatica || !podeBuscar)
            return;

        const temporizador: number = window.setInterval(
            () => void buscarAtual.current({ silenciosa: true }),
            intervaloSegundos * MILISSEGUNDOS_POR_SEGUNDO,
        );

        return () => window.clearInterval(temporizador);
    }, [atualizacaoAutomatica, intervaloSegundos, podeBuscar]);

    /**
     * Registra a falha na tela e decide o que fazer com o resultado anterior.
     * @param falha Erro capturado na consulta.
     * @param silenciosa Indica se a consulta veio da atualização automática.
     * @returns Nada.
     */
    function tratarFalha(falha: unknown, silenciosa: boolean): void {
        const mensagemErro: MensagemErro = ConverterErro(falha, MENSAGEM.ERRO_INESPERADO);
        setErro(mensagemErro);
        AvisarSeProblemaDeToken(mensagemErro, "Comentários");

        // Numa busca manual o resultado antigo é de outro Merge Request ou de outro filtro,
        // então sai da tela. Numa atualização automática ele é mantido, porque a falha pode ser passageira.
        if (!silenciosa) {
            setRevisao(null);
            setUltimaAtualizacao("");
        }

        if (CODIGOS_ERRO_PERMANENTE.includes(mensagemErro.codigo))
            setAtualizacaoAutomatica(false);
    }

    /**
     * Carrega os comentários do Merge Request escolhido na lista.
     * @param mergeRequest Merge Request selecionado.
     * @returns Nada.
     */
    function handleSelecionarMergeRequest(mergeRequest: MergeRequestAberto): void {
        const iid: string = String(mergeRequest.iid);

        setProjetoId(mergeRequest.projetoId);
        setMrIid(iid);
        setRecorte(RECORTE_TODOS);
        void buscar({ projetoId: mergeRequest.projetoId, mrIid: iid });
    }

    /**
     * Atualiza o campo de projeto, preenchendo também o IID quando o usuário cola a URL do Merge Request.
     * @param valor Texto digitado ou colado no campo.
     * @returns Nada.
     */
    function handleAlterarProjeto(valor: string): void {
        const dadosDaUrl = ExtrairDadosDaUrl(valor);

        if (!dadosDaUrl) {
            setProjetoId(valor);
            return;
        }

        setProjetoId(dadosDaUrl.projetoId);
        setMrIid(dadosDaUrl.mrIid);
    }

    /**
     * Aplica o status escolhido no campo de seleção e recarrega o Merge Request já exibido.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarStatus(valor: string): void {
        const novoStatus: StatusFiltro = valor as StatusFiltro;

        setStatus(novoStatus);
        setSituacao(SITUACAO_POR_STATUS[novoStatus]);

        // Sem resultado na tela não há o que recarregar: a consulta sai quando o usuário clicar em Buscar.
        if (revisao)
            void buscar({ status: novoStatus });
    }

    /**
     * Filtra a lista pela situação do contador clicado no resumo.
     * @param novaSituacao Situação escolhida, ou nulo para exibir todas.
     * @returns Nada.
     */
    function handleAlterarSituacao(novaSituacao: SituacaoComentario | null): void {
        setSituacao(novaSituacao);

        // Nem todo escopo de busca traz todas as situações do servidor: pedir uma situação que
        // ficou de fora exige consultar o Merge Request de novo, agora sem limitar o status.
        if (EscopoCobreSituacao(status, novaSituacao))
            return;

        setStatus(StatusFiltro.Todos);
        void buscar({ status: StatusFiltro.Todos });
    }

    /**
     * Aplica a ordenação escolhida no campo de seleção.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarOrdenacao(valor: string): void {
        setOrdenacao(valor as OrdenacaoComentarios);
    }

    /**
     * Aplica o intervalo escolhido para a atualização automática.
     * @param valor Valor devolvido pelo campo, em segundos.
     * @returns Nada.
     */
    function handleAlterarIntervalo(valor: string): void {
        setIntervaloSegundos(Number(valor));
    }

    /**
     * Troca de quem são os Merge Requests listados.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarEscopo(valor: string): void {
        setEscopo(valor as EscopoMergeRequest);
    }

    /**
     * Recarrega a lista de Merge Requests do usuário.
     * @returns Nada.
     */
    function handleAtualizarLista(): void {
        void carregarMeusMergeRequests();
    }

    /**
     * Atualiza o termo pesquisado. Esvaziar o campo volta a mostrar a lista por escopo na hora,
     * sem precisar de um botão de limpar à parte.
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
     * Pesquisa Merge Requests pelo título, entre todos os que o token enxerga.
     * @returns Nada.
     */
    async function handlePesquisar(): Promise<void> {
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

            const mensagemErro: MensagemErro = ConverterErro(falha, MENSAGEM.ERRO_PESQUISA);

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
     * Dispara a consulta a partir dos botões e da tecla Enter.
     * @returns Nada.
     */
    function handleBuscar(): void {
        void buscar();
    }

    /**
     * Copia os comentários que estão na tela, prontos para colar em outro lugar.
     * @returns Nada.
     */
    async function handleCopiarComentarios(): Promise<void> {
        try {
            await navigator.clipboard.writeText(FormatarComentariosParaCopia(comentarios, vocabulario.nomeItem));
            setEstadoCopia(EstadoCopia.Copiado);
        } catch {
            setEstadoCopia(EstadoCopia.Falhou);
        } finally {
            if (temporizadorCopia.current)
                window.clearTimeout(temporizadorCopia.current);

            temporizadorCopia.current = window.setTimeout(() => setEstadoCopia(EstadoCopia.Ocioso), TEMPO_RETORNO_COPIA_MS);
        }
    }

    return {
        vocabulario,
        mensagens,
        projetoId,
        projetoIdCarregado,
        mrIid,
        status,
        situacao,
        ordenacao,
        recorte,
        atualizacaoAutomatica,
        intervaloSegundos,
        revisao,
        carregando,
        erro,
        ultimaAtualizacao,
        temResultado: Boolean(revisao),
        comentarios,
        textoContador: montarTextoContador(comentarios.length),
        estadoCopia,
        escopo,
        meusMergeRequests,
        listaTruncada,
        carregandoLista,
        erroLista,
        termoPesquisa,
        podePesquisar,
        resultadosPesquisa,
        pesquisaTruncada,
        pesquisando,
        erroPesquisa,
        handleAlterarProjeto,
        handleAlterarStatus,
        handleAlterarSituacao,
        handleAlterarOrdenacao,
        handleAlterarIntervalo,
        handleAlterarEscopo,
        handleAtualizarLista,
        handleAlterarTermoPesquisa,
        handlePesquisar,
        handleSelecionarMergeRequest,
        handleBuscar,
        handleCopiarComentarios,
        setMrIid,
        setRecorte,
        setAtualizacaoAutomatica,
    };
}

/**
 * Monta o texto do contador de comentários que estão na tela.
 * @param quantidade Quantidade de comentários exibidos.
 * @returns Texto com a quantidade e a palavra no singular ou no plural.
 */
function montarTextoContador(quantidade: number): string {
    return `${quantidade} ${quantidade === 1 ? MENSAGEM.CONTADOR_EXIBIDO : MENSAGEM.CONTADOR_EXIBIDOS}`;
}

