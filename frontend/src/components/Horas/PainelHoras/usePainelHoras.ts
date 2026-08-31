import { useCallback, useEffect, useRef, useState } from "react";
import { GetHorasDaSemana } from "src/api/Horas";
import { ResumoHorasSemana } from "src/api/Horas/types";
import { ConfiguracaoDashboard } from "src/api/Revisao/types";
import { ConverterErro, EhCancelamento } from "src/services";
import { MensagemErro } from "src/services/types";
import { FormatarDiaMes } from "src/utils/Formatacao";
import { TEXTO_HORAS } from "./types";

/**
 * Escolhe o texto exibido enquanto não há uma semana na tela.
 * @param carregando Indica se a consulta está em andamento.
 * @param configuracaoValida Indica se o backend já consegue falar com o GitLab.
 * @returns Texto a exibir no lugar do resumo.
 */
function getMensagemVazio(carregando: boolean, configuracaoValida: boolean): string {
    if (carregando)
        return TEXTO_HORAS.CARREGANDO;

    return configuracaoValida ? TEXTO_HORAS.SEM_RESUMO : TEXTO_HORAS.SEM_CONFIGURACAO;
}

/**
 * Concentra o estado e a consulta da página de horas.
 * @param configuracao Configuração do backend, para não consultar sem o .env preenchido.
 * @returns Resumo da semana, estado da consulta e os manipuladores usados na tela.
 */
export function usePainelHoras(configuracao: ConfiguracaoDashboard | null) {
    const [semana, setSemana] = useState<string>("");
    const [resumo, setResumo] = useState<ResumoHorasSemana | null>(null);
    const [carregando, setCarregando] = useState<boolean>(false);
    const [erro, setErro] = useState<MensagemErro | null>(null);

    const requisicaoEmAndamento = useRef<AbortController | null>(null);
    const configuracaoValida: boolean = Boolean(configuracao && configuracao.problemas.length === 0);

    const buscar = useCallback(async () => {
        // Sem .env preenchido a consulta falharia de qualquer jeito, e o cabeçalho já avisa o motivo.
        if (!configuracaoValida)
            return;

        requisicaoEmAndamento.current?.abort();
        const controlador = new AbortController();
        requisicaoEmAndamento.current = controlador;
        setCarregando(true);

        try {
            const dados: ResumoHorasSemana = await GetHorasDaSemana(semana, controlador.signal);

            setResumo(dados);
            setErro(null);
        } catch (falha: unknown) {
            if (EhCancelamento(falha))
                return;

            setErro(ConverterErro(falha, TEXTO_HORAS.ERRO));
        } finally {
            if (requisicaoEmAndamento.current === controlador) {
                requisicaoEmAndamento.current = null;
                setCarregando(false);
            }
        }
    }, [configuracaoValida, semana]);

    useEffect(() => {
        void buscar();
    }, [buscar]);

    useEffect(() => () => requisicaoEmAndamento.current?.abort(), []);

    /**
     * Volta para a semana anterior à que está na tela.
     * @returns Nada.
     */
    function handleSemanaAnterior(): void {
        if (resumo)
            setSemana(resumo.semanaAnterior);
    }

    /**
     * Avança para a semana seguinte à que está na tela.
     * @returns Nada.
     */
    function handleSemanaSeguinte(): void {
        if (resumo && !resumo.ehSemanaAtual)
            setSemana(resumo.semanaSeguinte);
    }

    return {
        resumo,
        carregando,
        erro,
        mensagemVazio: getMensagemVazio(carregando, configuracaoValida),
        periodo: resumo ? `${FormatarDiaMes(resumo.inicioSemana)} ${TEXTO_HORAS.ATE} ${FormatarDiaMes(resumo.fimSemana)}` : "",
        handleSemanaAnterior,
        handleSemanaSeguinte,
        handleAtualizar: buscar,
    };
}
