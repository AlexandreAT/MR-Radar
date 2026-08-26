import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }

    body {
        margin: 0;
        background: ${({ theme }) => theme.cores.fundo};
        color: ${({ theme }) => theme.cores.texto};
        font-family: ${({ theme }) => theme.fontes.padrao};
        font-size: 14px;
        line-height: 1.5;
    }

    a {
        color: ${({ theme }) => theme.cores.primaria};
    }

    ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
    }

    ::-webkit-scrollbar-thumb {
        background: ${({ theme }) => theme.cores.borda};
        border-radius: 5px;
    }
`;
