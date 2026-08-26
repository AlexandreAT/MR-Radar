import styled from "styled-components";

export const Bloco = styled.div`
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoCodigo};
    overflow: hidden;
`;

export const CabecalhoBloco = styled.div`
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.medio};
    padding: 6px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.cores.borda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
`;

export const Linguagem = styled.span`
    font-weight: 700;
`;

export const Referencia = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    text-transform: none;
`;

export const Linhas = styled.div`
    overflow-x: auto;
    padding: 8px 0;
`;

export const Linha = styled.div<{ $destacada: boolean }>`
    display: flex;
    gap: 12px;
    padding: 0 12px;
    background: ${({ $destacada, theme }) => ($destacada ? theme.cores.fundoDestaque : "transparent")};
    border-left: 3px solid ${({ $destacada, theme }) => ($destacada ? theme.cores.bordaDestaque : "transparent")};
`;

export const NumeroLinha = styled.span`
    min-width: 44px;
    text-align: right;
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-family: ${({ theme }) => theme.fontes.codigo};
    font-size: 12px;
    user-select: none;
`;

export const TextoLinha = styled.pre`
    margin: 0;
    color: ${({ theme }) => theme.cores.texto};
    font-family: ${({ theme }) => theme.fontes.codigo};
    font-size: 12.5px;
    white-space: pre;
`;

export const Aviso = styled.div`
    padding: 10px 12px;
    border: 1px dashed ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;
