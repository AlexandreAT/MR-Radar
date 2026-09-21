import { useEffect, useState } from "react";
import { GetConfiguracaoDashboard } from "src/api/Revisao";
import { ConfiguracaoDashboard } from "src/api/Revisao/types";
import { ConverterErro } from "src/services";
import { ErroApi } from "src/services/ErroApi";
import { CODIGO_ERRO_COMUNICACAO, MensagemErro } from "src/services/types";
import { GetHashDaPagina, GetPaginaDoHash, PaginaApp } from "src/utils/Navegacao";
import { ESPERA_ENTRE_TENTATIVAS_MS, MENSAGEM_APP, TENTATIVAS_CONFIGURACAO } from "./types";

/**
 * Concentra o que vale para o dashboard inteiro: a página aberta e a configuração do backend.
 * @returns Página atual, configuração carregada e o manipulador de troca de página.
 */
export function useApp() {
    const [pagina, setPagina] = useState<PaginaApp>(() => GetPaginaDoHash(window.location.hash));
    const [configuracao, setConfiguracao] = useState<ConfiguracaoDashboard | null>(null);
    const [erroConfiguracao, setErroConfiguracao] = useState<MensagemErro | null>(null);
    const [carregandoConfiguracao, setCarregandoConfiguracao] = useState<boolean>(true);

    useEffect(() => {
        const aoTrocarHash = () => setPagina(GetPaginaDoHash(window.location.hash));

        window.addEventListener("hashchange", aoTrocarHash);

        return () => window.removeEventListener("hashchange", aoTrocarHash);
    }, []);

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
                            setErroConfiguracao(ConverterErro(falha, MENSAGEM_APP.ERRO_CONFIGURACAO));

                        return;
                    }

                    await esperar(ESPERA_ENTRE_TENTATIVAS_MS);
                }
            }
        }

        void carregarConfiguracao().finally(() => {
            if (!cancelado)
                setCarregandoConfiguracao(false);
        });

        return () => {
            cancelado = true;
        };
    }, []);

    /**
     * Abre outra página, deixando o endereço na URL para o F5 voltar no mesmo lugar.
     * @param escolhida Página escolhida no cabeçalho.
     * @returns Nada.
     */
    function handleAlterarPagina(escolhida: PaginaApp): void {
        window.location.hash = GetHashDaPagina(escolhida);
        setPagina(escolhida);
    }

    return {
        pagina,
        configuracao,
        erroConfiguracao,
        carregandoConfiguracao,
        handleAlterarPagina,
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
