import { Toaster } from "sonner";
import { ThemeProvider } from "styled-components";
import { Carregando } from "src/components/BasicComponents";
import { PainelHoras } from "src/components/Horas/PainelHoras";
import { CabecalhoApp } from "src/components/Layout/CabecalhoApp";
import { PainelRevisao } from "src/components/Revisao/PainelRevisao";
import { AreaRelativa } from "src/components/sharedStyles";
import { GlobalStyle } from "src/styles/GlobalStyle";
import { tema } from "src/styles/theme";
import { PaginaApp } from "src/utils/Navegacao";
import { MENSAGEM_APP } from "./types";
import { useApp } from "./useApp";

export function App() {
    const { pagina, configuracao, erroConfiguracao, carregandoConfiguracao, handleAlterarPagina } = useApp();

    return (
        <ThemeProvider theme={tema}>
            <GlobalStyle />
            <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: tema.cores.fundoPainel,
                        border: `1px solid ${tema.cores.borda}`,
                        borderRadius: tema.raioBorda,
                        color: tema.cores.texto,
                        fontFamily: tema.fontes.padrao,
                        fontSize: "13px",
                    },
                }}
            />
            <CabecalhoApp pagina={pagina} configuracao={configuracao} erroConfiguracao={erroConfiguracao} onAlterarPagina={handleAlterarPagina} />
            <AreaRelativa>
                {pagina === PaginaApp.Horas ? <PainelHoras configuracao={configuracao} /> : <PainelRevisao configuracao={configuracao} />}
                <Carregando ativo={carregandoConfiguracao} texto={MENSAGEM_APP.CARREGANDO_CONFIGURACAO} />
            </AreaRelativa>
        </ThemeProvider>
    );
}
