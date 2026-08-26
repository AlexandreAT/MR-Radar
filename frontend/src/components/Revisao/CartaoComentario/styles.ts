import styled from "styled-components";
import { PainelBase } from "../sharedStyles";

export { LinkExterno, TituloBloco } from "../sharedStyles";

export const Cartao = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Cabecalho = styled.header`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const IdentificacaoAutor = styled.div`
    display: flex;
    align-items: baseline;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const NomeAutor = styled.strong`
    font-size: 14px;
`;

export const DataComentario = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
`;

export const Secao = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const TextoComentario = styled.p`
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
`;

export const Local = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    font-size: 12.5px;
    color: ${({ theme }) => theme.cores.primaria};
    word-break: break-all;
`;

export const ListaRespostas = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    padding-left: ${({ theme }) => theme.espacamentos.medio};
    border-left: 2px solid ${({ theme }) => theme.cores.borda};
`;

export const ItemResposta = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const CabecalhoResposta = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
`;

export const CorpoResposta = styled.p`
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-size: 13px;
`;

export const Rodape = styled.footer`
    display: flex;
    justify-content: flex-end;
`;
