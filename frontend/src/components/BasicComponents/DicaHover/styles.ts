import styled, { css } from "styled-components";
import { AlinhamentoDica } from "./types";

export const Container = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
`;

/** Posição horizontal da dica, conforme o alinhamento pedido — evita cortar na borda da tela. */
const POSICAO_POR_ALINHAMENTO = {
    [AlinhamentoDica.Centro]: css`
        left: 50%;
        transform: translateX(-50%);
    `,
    [AlinhamentoDica.Esquerda]: css`
        left: 0;
    `,
    [AlinhamentoDica.Direita]: css`
        right: 0;
    `,
};

export const Bolha = styled.span<{ $alinhamento: AlinhamentoDica }>`
    position: absolute;
    bottom: calc(100% + 6px);
    z-index: 2;
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoPainel};
    color: ${({ theme }) => theme.cores.texto};
    font-size: 11.5px;
    font-weight: 400;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    ${({ $alinhamento }) => POSICAO_POR_ALINHAMENTO[$alinhamento]}
`;
