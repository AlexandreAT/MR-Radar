import styled, { css } from "styled-components";
import { VarianteBotao } from "./types";

export const BotaoEstilizado = styled.button<{ $variante: VarianteBotao }>`
    height: 34px;
    padding: 0 16px;
    border-radius: ${({ theme }) => theme.raioBorda};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    background: ${({ theme }) => theme.cores.fundoCampo};
    color: ${({ theme }) => theme.cores.texto};
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease, border-color 0.15s ease;

    ${({ $variante, theme }) =>
        $variante === VarianteBotao.Primario &&
        css`
            background: ${theme.cores.primaria};
            border-color: ${theme.cores.primaria};
            color: ${theme.cores.textoBotaoPrimario};
        `}

    &:hover:enabled {
        border-color: ${({ theme }) => theme.cores.primaria};
        background: ${({ $variante, theme }) => ($variante === VarianteBotao.Primario ? theme.cores.primariaEscura : theme.cores.fundoPainel)};
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
