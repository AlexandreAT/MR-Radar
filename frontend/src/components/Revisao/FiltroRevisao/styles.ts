import styled from "styled-components";
import { PainelBase } from "../../sharedStyles";

export const Container = styled(PainelBase)`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const GrupoBotoes = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const GrupoMarcacoes = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const Marcacao = styled.label`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12.5px;
    color: ${({ theme }) => theme.cores.textoSecundario};
    cursor: pointer;
`;

export const Caixa = styled.input`
    width: 15px;
    height: 15px;
    accent-color: ${({ theme }) => theme.cores.primaria};
    cursor: pointer;
`;

export const Atualizacao = styled.span`
    margin-left: auto;
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;
