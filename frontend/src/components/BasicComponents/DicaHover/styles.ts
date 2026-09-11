import styled from "styled-components";

export const Container = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
`;

export const Bolha = styled.span`
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
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
`;
