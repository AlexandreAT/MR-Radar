import styled from "styled-components";
import { PainelBase } from "../../sharedStyles";

export { CaixaAviso, CaixaErro, DicaErro, LinkExterno, TextoAviso, TextoErro } from "../../sharedStyles";

export const Sobreposicao = styled.div`
    position: fixed;
    inset: 0;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: ${({ theme }) => theme.espacamentos.grande} ${({ theme }) => theme.espacamentos.medio};
    background: rgba(0, 0, 0, 0.6);
    overflow-y: auto;
    z-index: 100;
`;

export const Caixa = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
    width: 100%;
    max-width: 860px;
`;

export const Cabecalho = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 16px;
    line-height: 1.3;
`;

export const BotaoFechar = styled.button`
    all: unset;
    cursor: pointer;
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 20px;
    line-height: 1;
    padding: 2px 4px;

    &:hover {
        color: ${({ theme }) => theme.cores.texto};
    }
`;

export const Toolbar = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const PainelSelecao = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    padding: ${({ theme }) => theme.espacamentos.pequeno};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoCampo};
`;

export const LinhaAcoesSelecao = styled.div`
    display: flex;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const ListaSelecao = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 220px;
    overflow-y: auto;
`;

export const ItemSelecao = styled.label`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12.5px;
    cursor: pointer;
`;

export const Checkbox = styled.input`
    cursor: pointer;
`;

export const CaminhoSelecao = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    word-break: break-all;
`;

export const ListaArquivos = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    max-height: 60vh;
    overflow-y: auto;
`;

export const Rodape = styled.div`
    display: flex;
    justify-content: center;
`;

export const Vazio = styled.div`
    padding: ${({ theme }) => theme.espacamentos.medio};
    color: ${({ theme }) => theme.cores.textoSecundario};
    text-align: center;
    font-size: 13px;
`;
