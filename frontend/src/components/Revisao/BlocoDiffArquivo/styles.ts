import styled from "styled-components";
import { TipoLinhaDiff } from "src/api/Revisao/types";

export const Bloco = styled.div`
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoCodigo};
    overflow: hidden;
    /* Dentro do flex column de ListaArquivos (max-height + overflow-y), "overflow: hidden" faz o
       min-height automático deste item virar 0 em vez de respeitar o conteúdo — o navegador então
       espreme cada bloco em vez de deixar a LISTA inteira rolar, cortando quase todo o diff.
       flex-shrink: 0 mantém a altura natural de cada arquivo; quem rola é o ListaArquivos. */
    flex-shrink: 0;
`;

export const CabecalhoBloco = styled.div`
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
    padding: 6px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.cores.borda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 11.5px;
`;

export const Caminho = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    color: ${({ theme }) => theme.cores.texto};
    font-weight: 600;
    word-break: break-all;
`;

export const CaminhoAntigo = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    text-decoration: line-through;
`;

export const Contadores = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};

    span:first-child {
        color: ${({ theme }) => theme.cores.resolvido};
    }

    span:last-child {
        color: ${({ theme }) => theme.cores.erro};
    }
`;

export const Linhas = styled.div`
    overflow-x: auto;
    padding: 4px 0;
`;

export const Linha = styled.div<{ $tipo: TipoLinhaDiff }>`
    display: flex;
    gap: 12px;
    padding: 0 12px;
    background: ${({ $tipo, theme }) =>
        $tipo === TipoLinhaDiff.Adicionada ? `${theme.cores.resolvido}1f` : $tipo === TipoLinhaDiff.Removida ? `${theme.cores.erro}1f` : "transparent"};
    border-left: 3px solid
        ${({ $tipo, theme }) => ($tipo === TipoLinhaDiff.Adicionada ? theme.cores.resolvido : $tipo === TipoLinhaDiff.Removida ? theme.cores.erro : "transparent")};
`;

export const NumeroLinha = styled.span`
    min-width: 32px;
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
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;
