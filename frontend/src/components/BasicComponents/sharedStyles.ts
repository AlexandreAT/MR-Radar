import styled, { css } from "styled-components";

/** Aparência comum a todos os campos de entrada. */
export const estiloCampo = css`
    height: 34px;
    padding: 0 10px;
    border-radius: ${({ theme }) => theme.raioBorda};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    background: ${({ theme }) => theme.cores.fundoCampo};
    color: ${({ theme }) => theme.cores.texto};
    font-family: inherit;
    font-size: 13px;
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.cores.primaria};
    }
`;

export const ContainerCampo = styled.label<{ $largura: string }>`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: ${({ $largura }) => $largura};
`;

export const RotuloCampo = styled.span`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.cores.textoSecundario};
`;
