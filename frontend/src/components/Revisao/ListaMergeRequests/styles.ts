import styled from "styled-components";
import { PainelBase } from "../sharedStyles";

export const Container = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Cabecalho = styled.header`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 15px;
`;

export const Acoes = styled.div`
    display: flex;
    align-items: flex-end;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const Lista = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 320px;
    overflow-y: auto;
`;

export const Item = styled.button<{ $selecionado: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 4px;
    width: 100%;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.raioBorda};
    border: 1px solid ${({ $selecionado, theme }) => ($selecionado ? theme.cores.primaria : theme.cores.borda)};
    background: ${({ $selecionado, theme }) => ($selecionado ? theme.cores.fundoCampo : "transparent")};
    color: ${({ theme }) => theme.cores.texto};
    font-family: inherit;
    text-align: left;
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &:hover {
        border-color: ${({ theme }) => theme.cores.primaria};
    }
`;

export const LinhaTitulo = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const TituloItem = styled.strong`
    font-size: 13.5px;
    font-weight: 600;
`;

export const Detalhes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.medio};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
`;

export const Referencia = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    word-break: break-all;
`;

export const Branches = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    word-break: break-all;
`;

export const Informacao = styled.span`
    white-space: nowrap;
`;

export const Aviso = styled.div`
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px dashed ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
    text-align: center;
`;

export const AvisoTruncada = styled.span`
    color: ${({ theme }) => theme.cores.aberto};
    font-size: 12.5px;
`;
