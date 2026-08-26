import styled from "styled-components";
import { PainelBase } from "../sharedStyles";

export { LinkExterno } from "../sharedStyles";

export const Container = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    align-items: flex-start;
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 17px;
    line-height: 1.3;
`;

export const Detalhes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.medio};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;

export const Informacao = styled.span`
    white-space: nowrap;
`;

export const Branches = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
`;

export const Contadores = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const BotaoContador = styled.button`
    all: unset;
    cursor: pointer;
`;
