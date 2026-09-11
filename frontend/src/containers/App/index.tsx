import { Toaster } from "sonner";
import { ThemeProvider } from "styled-components";
import { PainelHoras } from "src/components/Horas/PainelHoras";
import { CabecalhoApp } from "src/components/Layout/CabecalhoApp";
import { PainelRevisao } from "src/components/Revisao/PainelRevisao";
import { GlobalStyle } from "src/styles/GlobalStyle";
import { tema } from "src/styles/theme";
import { PaginaApp } from "src/utils/Navegacao";
import { useApp } from "./useApp";

export function App() {
    const { pagina, configuracao, erroConfiguracao, handleAlterarPagina } = useApp();

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
            {pagina === PaginaApp.Horas ? <PainelHoras configuracao={configuracao} /> : <PainelRevisao configuracao={configuracao} />}
        </ThemeProvider>
    );
}
