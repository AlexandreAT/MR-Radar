import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GetComentariosRevisao, GetConfiguracaoDashboard, GetMeusMergeRequests } from "src/api/Revisao";
import { ComentarioRevisao, ConfiguracaoDashboard, EscopoMergeRequest, ListaMergeRequestsAbertos, MergeRequestAberto, RevisaoMergeRequest, StatusFiltro } from "src/api/Revisao/types";
import { EhCancelamento } from "src/services";
import { ErroApi } from "src/services/ErroApi";
import { CODIGO_ERRO_COMUNICACAO } from "src/services/types";
import { FormatarComentariosParaCopia } from "src/utils/ComentariosParaCopia";
import { FormatarHora } from "src/utils/Formatacao";
import { ExtrairDadosDaUrl } from "src/utils/MergeRequestUrl";
import {
    ChavePreferencia,
    CODIGOS_ERRO_PERMANENTE,
    ESPERA_ENTRE_TENTATIVAS_MS,
    EstadoCopia,
    INTERVALO_PADRAO_SEGUNDOS,
    MENSAGEM,
    MensagemErro,
    MILISSEGUNDOS_POR_SEGUNDO,
    OpcoesBusca,
    TEMPO_RETORNO_COPIA_MS,
    TENTATIVAS_CONFIGURACAO,
} from "./types";

/**
 * Concentra o estado e as consultas da tela de revisão.
 * @returns Estado da tela, Merge Requests do usuário, comentários e os manipuladores usados pelos componentes.
 */
export function usePainelRevisao() {
    const [configuracao, setConfiguracao] = useState<ConfiguracaoDashboard | null>(null);
    const [projetoId, setProjetoId] = useState<string>(() => getPreferencia(ChavePreferencia.ProjetoId));
    const [mrIid, setMrIid] = useState<string>(() => getPreferencia(ChavePreferencia.MrIid));
    const [status, setStatus] = useState<StatusFiltro>(StatusFiltro.Abertos);
    const [atualizacaoAutomatica, setAtualizacaoAutomatica] = useState<boolean>(false);
    const [intervaloSegundos, setIntervaloSegundos] = useState<number>(INTERVALO_PADRAO_SEGUNDOS);
    const [revisao, setRevisao] = useState<RevisaoMergeRequest | null>(null);
    const [carregando, setCarregando] = useState<boolean>(false);
    const [erro, setErro] = useState<MensagemErro | null>(null);
    const [ultimaAtualizacao, setUltimaAtualizacao] = useState<string>("");
    const [mostrarGerais, setMostrarGerais] = useState<boolean>(false);
    const [estadoCopia, setEstadoCopia] = useState<EstadoCopia>(EstadoCopia.Ocioso);

    const [escopo, setEscopo] = useState<EscopoMergeRequest>(EscopoMergeRequest.CriadosPorMim);
    const [meusMergeRequests, setMeusMergeRequests] = useState<MergeRequestAberto[]>([]);
    const [listaTruncada, setListaTruncada] = useState<boolean>(false);
    const [carregandoLista, setCarregandoLista] = useState<boolean>(false);
    const [erroLista, setErroLista] = useState<MensagemErro | null>(null);

    const requisicaoEmAndamento = useRef<AbortController | null>(null);
    const requisicaoDaLista = useRef<AbortController | null>(null);
    const temporizadorCopia = useRef<number | null>(null);

    const podeBuscar: boolean = useMemo(() => Boolean(projetoId.trim() && mrIid.trim()), [projetoId, mrIid]);
    const configuracaoValida: boolean = Boolean(configuracao && configuracao.problemas.length === 0);

    // Comentários gerais (sem posição de código) ficam separados: só aparecem na tela
    // quando o usuário clica para revelá-los, em vez de virem misturados na lista principal.
    const comentariosPrincipais: ComentarioRevisao[] = useMemo(() => revisao?.comentarios.filter((comentario) => comentario.resolvivel) ?? [], [revisao]);
    const comentariosGerais: ComentarioRevisao[] = useMemo(() => revisao?.comentarios.filter((comentario) => !comentario.resolvivel) ?? [], [revisao]);

    useEffect(() => {
        let cancelado = false;

        /**
         * Carrega a configuração, repetindo enquanto o backend ainda estiver subindo.
         * Só insiste quando a falha é de conexão: erro vindo do backend aparece na hora.
         * @returns Nada.
         */
        async function carregarConfiguracao(): Promise<void> {
            for (let tentativa = 1; !cancelado; tentativa += 1) {
                try {
                    const dados: ConfiguracaoDashboard = await GetConfiguracaoDashboard();

                    if (!cancelado)
                        setConfiguracao(dados);

                    return;
                } catch (falha: unknown) {
                    const backendAindaSubindo: boolean = falha instanceof ErroApi && falha.codigo === CODIGO_ERRO_COMUNICACAO;

                    if (!backendAindaSubindo || tentativa >= TENTATIVAS_CONFIGURACAO) {
                        if (!cancelado)
                            setErro(converterErro(falha, MENSAGEM.ERRO_INESPERADO));

                        return;
                    }

                    await esperar(ESPERA_ENTRE_TENTATIVAS_MS);
                }
            }
        }

        void carregarConfiguracao();

        return () => {
            cancelado = true;
        };
    }, []);

    useEffect(() => salvarPreferencia(ChavePreferencia.ProjetoId, projetoId), [projetoId]);

    useEffect(() => salvarPreferencia(ChavePreferencia.MrIid, mrIid), [mrIid]);

    useEffect(
        () => () => {
            requisicaoEmAndamento.current?.abort();
            requisicaoDaLista.current?.abort();

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

            setMeusMergeRequests([]);
            setErroLista(converterErro(falha, MENSAGEM.ERRO_LISTA));
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
            const silenciosa: boolean = opcoes.silenciosa ?? false;

            if (!projeto || !iid) {
                setErro({ codigo: CODIGO_ERRO_COMUNICACAO, mensagem: MENSAGEM.CAMPOS_OBRIGATORIOS, dica: "" });
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
                const dados: RevisaoMergeRequest = await GetComentariosRevisao({ projetoId: projeto, mrIid: iid, status }, controlador.signal);

                setRevisao(dados);
                setErro(null);
                setUltimaAtualizacao(FormatarHora(new Date()));
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
        const mensagemErro: MensagemErro = converterErro(falha, MENSAGEM.ERRO_INESPERADO);
        setErro(mensagemErro);

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
        setMostrarGerais(false);
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
     * Aplica o status escolhido no campo de seleção.
     * @param valor Valor devolvido pelo campo.
     * @returns Nada.
     */
    function handleAlterarStatus(valor: string): void {
        setStatus(valor as StatusFiltro);
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
     * Dispara a consulta a partir dos botões e da tecla Enter.
     * @returns Nada.
     */
    function handleBuscar(): void {
        setMostrarGerais(false);
        void buscar();
    }

    /**
     * Mostra ou esconde os comentários gerais na tela.
     * @returns Nada.
     */
    function handleAlternarGerais(): void {
        setMostrarGerais((atual) => !atual);
    }

    /**
     * Copia todos os comentários do Merge Request atual, prontos para colar em outro lugar.
     * @returns Nada.
     */
    async function handleCopiarComentarios(): Promise<void> {
        const todosComentarios = [...comentariosPrincipais, ...comentariosGerais];

        try {
            await navigator.clipboard.writeText(FormatarComentariosParaCopia(todosComentarios));
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
        configuracao,
        projetoId,
        mrIid,
        status,
        atualizacaoAutomatica,
        intervaloSegundos,
        revisao,
        carregando,
        erro,
        ultimaAtualizacao,
        temResultado: Boolean(revisao),
        comentariosPrincipais,
        comentariosGerais,
        mostrarGerais,
        estadoCopia,
        escopo,
        meusMergeRequests,
        listaTruncada,
        carregandoLista,
        erroLista,
        handleAlterarProjeto,
        handleAlterarStatus,
        handleAlterarIntervalo,
        handleAlterarEscopo,
        handleAtualizarLista,
        handleSelecionarMergeRequest,
        handleBuscar,
        handleAlternarGerais,
        handleCopiarComentarios,
        setMrIid,
        setAtualizacaoAutomatica,
    };
}

/**
 * Aguarda um intervalo de tempo.
 * @param milissegundos Tempo de espera.
 * @returns Promise concluída após o tempo informado.
 */
function esperar(milissegundos: number): Promise<void> {
    return new Promise((resolver) => window.setTimeout(resolver, milissegundos));
}

/**
 * Lê um valor lembrado da última sessão.
 * @param chave Chave da preferência.
 * @returns Valor guardado ou texto vazio.
 */
function getPreferencia(chave: ChavePreferencia): string {
    try {
        return window.localStorage.getItem(chave) ?? "";
    } catch {
        return "";
    }
}

/**
 * Guarda um valor para a próxima sessão.
 * @param chave Chave da preferência.
 * @param valor Valor a guardar.
 * @returns Nada.
 */
function salvarPreferencia(chave: ChavePreferencia, valor: string): void {
    try {
        window.localStorage.setItem(chave, valor);
    } catch {
        // Navegador com armazenamento bloqueado: a tela continua funcionando sem lembrar os campos.
    }
}

/**
 * Converte qualquer falha na mensagem que será exibida na tela.
 * @param falha Erro capturado.
 * @param mensagemPadrao Mensagem usada quando o erro não veio do backend.
 * @returns Código, mensagem e dica para o usuário.
 */
function converterErro(falha: unknown, mensagemPadrao: string): MensagemErro {
    if (falha instanceof ErroApi)
        return { codigo: falha.codigo, mensagem: falha.message, dica: falha.dica };

    return {
        codigo: CODIGO_ERRO_COMUNICACAO,
        mensagem: mensagemPadrao,
        dica: falha instanceof Error ? falha.message : "",
    };
}
