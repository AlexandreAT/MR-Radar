import { ThemeProvider } from "styled-components";
import { PainelRevisao } from "src/components/Revisao/PainelRevisao";
import { GlobalStyle } from "src/styles/GlobalStyle";
import { tema } from "src/styles/theme";

export function App() {
    return (
        <ThemeProvider theme={tema}>
            <GlobalStyle />
            <PainelRevisao />
        </ThemeProvider>
    );
}
