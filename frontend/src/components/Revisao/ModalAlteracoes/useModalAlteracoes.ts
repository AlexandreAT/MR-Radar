import { useEffect, useRef, useState } from "react";
import { GetArquivosAlterados } from "src/api/Revisao";
import { ArquivoAlterado } from "src/api/Revisao/types";
import { ConverterErro } from "src/services";
import { MensagemErro } from "src/services/types";
import { FormatarAlteracoesParaCopia } from "src/utils/AlteracoesParaCopia";
import { AvisarSeProblemaDeToken } from "src/utils/AvisoToken";
import { EstadoCopia, PropriedadesModalAlteracoes, TEMPO_RETORNO_COPIA_MS, TEXTO_MODAL } from "./types";

/**
 * Controla o carregamento paginado dos arquivos alterados e a seleção usada para copiar o diff.
 *
 * projetoId é recebido pronto (o mesmo já usado para carregar os comentários), em vez de
 * recalculado a partir da URL do Merge Request: a URL nem sempre bate com o identificador que a
 * API do provedor espera (confirmado contra uma instância real), enquanto o projetoId já em uso
 * é garantidamente o que funcionou para chegar até aqui.
 * @param projetoId Identificador do projeto/repositório.
 * @param mergeRequest Merge Request cujas alterações serão exibidas.
 * @returns Estado do modal e os manipuladores usados pelos componentes.
 */
export function useModalAlteracoes({ projetoId, mergeRequest }: Pick<PropriedadesModalAlteracoes, "projetoId" | "mergeRequest">) {
    const [arquivos, setArquivos] = useState<ArquivoAlterado[]>([]);
    const [proximaPagina, setProximaPagina] = useState<number | null>(null);
    const [carregouAoMenosUmaVez, setCarregouAoMenosUmaVez] = useState(false);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<MensagemErro | null>(null);
    const [mostrandoSelecao, setMostrandoSelecao] = useState(false);
    const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
    const [estadoCopia, setEstadoCopia] = useState(EstadoCopia.Ocioso);

    const requisicaoEmAndamento = useRef<AbortController | null>(null);
    const temporizadorCopia = useRef<number | null>(null);

    useEffect(
        () => () => {
            requisicaoEmAndamento.current?.abort();

            if (temporizadorCopia.current)
                window.clearTimeout(temporizadorCopia.current);
        },
        [],
    );

    // Todo arquivo recém-carregado entra marcado por padrão: o usuário desmarca o que não quer copiar.
    useEffect(() => {
        setSelecionados((atual) => {
            const novo = new Set(atual);

            arquivos.forEach((arquivo) => novo.add(arquivo.caminho));

            return novo;
        });
    }, [arquivos]);

    /**
     * Busca uma página de arquivos alterados e acrescenta ao que já está carregado.
     * @param pagina Página a buscar.
     * @returns Nada.
     */
    async function carregarPagina(pagina: number): Promise<void> {
        requisicaoEmAndamento.current?.abort();
        const controlador = new AbortController();
        requisicaoEmAndamento.current = controlador;

        setCarregando(true);
        setErro(null);

        try {
            const resultado = await GetArquivosAlterados(projetoId, String(mergeRequest.iid), pagina, controlador.signal);

            setArquivos((atual) => [...atual, ...resultado.itens]);
            setProximaPagina(resultado.proximaPagina);
            setCarregouAoMenosUmaVez(true);
        } catch (falha) {
            const mensagemErro: MensagemErro = ConverterErro(falha, TEXTO_MODAL.ERRO_CARREGAR);

            setErro(mensagemErro);
            AvisarSeProblemaDeToken(mensagemErro, "Alterações do Merge Request");
        } finally {
            setCarregando(false);
        }
    }

    /**
     * Carrega a primeira página, na primeira vez que o usuário pede para ver as alterações.
     * @returns Nada.
     */
    function handleVerAlteracoes(): void {
        if (carregouAoMenosUmaVez || carregando)
            return;

        void carregarPagina(1);
    }

    /**
     * Carrega a próxima página de arquivos, acrescentando à lista já exibida.
     * @returns Nada.
     */
    function handleCarregarMais(): void {
        if (proximaPagina === null || carregando)
            return;

        void carregarPagina(proximaPagina);
    }

    /**
     * Alterna a marcação de um arquivo na lista de seleção para cópia.
     * @param caminho Caminho do arquivo.
     * @returns Nada.
     */
    function handleAlternarSelecao(caminho: string): void {
        setSelecionados((atual) => {
            const novo = new Set(atual);

            if (novo.has(caminho))
                novo.delete(caminho);
            else
                novo.add(caminho);

            return novo;
        });
    }

    /**
     * Marca todos os arquivos já carregados.
     * @returns Nada.
     */
    function handleMarcarTodos(): void {
        setSelecionados(new Set(arquivos.map((arquivo) => arquivo.caminho)));
    }

    /**
     * Desmarca todos os arquivos.
     * @returns Nada.
     */
    function handleDesmarcarTodos(): void {
        setSelecionados(new Set());
    }

    /**
     * Copia os arquivos marcados e fecha a lista de seleção.
     * @returns Nada.
     */
    async function handleConfirmarCopia(): Promise<void> {
        const escolhidos: ArquivoAlterado[] = arquivos.filter((arquivo) => selecionados.has(arquivo.caminho));

        try {
            await navigator.clipboard.writeText(FormatarAlteracoesParaCopia(escolhidos));
            setEstadoCopia(EstadoCopia.Copiado);
        } catch {
            setEstadoCopia(EstadoCopia.Falhou);
        } finally {
            setMostrandoSelecao(false);

            if (temporizadorCopia.current)
                window.clearTimeout(temporizadorCopia.current);

            temporizadorCopia.current = window.setTimeout(() => setEstadoCopia(EstadoCopia.Ocioso), TEMPO_RETORNO_COPIA_MS);
        }
    }

    return {
        arquivos,
        proximaPagina,
        carregouAoMenosUmaVez,
        carregando,
        erro,
        mostrandoSelecao,
        selecionados,
        estadoCopia,
        handleVerAlteracoes,
        handleCarregarMais,
        handleAbrirSelecao: () => setMostrandoSelecao(true),
        handleFecharSelecao: () => setMostrandoSelecao(false),
        handleAlternarSelecao,
        handleMarcarTodos,
        handleDesmarcarTodos,
        handleConfirmarCopia,
    };
}
