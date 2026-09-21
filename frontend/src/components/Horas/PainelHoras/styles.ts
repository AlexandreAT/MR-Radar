import styled from "styled-components";
import { AreaRelativa, PainelBase } from "../../sharedStyles";

export { CaixaAviso, CaixaErro, DicaErro, Pagina, TextoAviso, TextoErro, Vazio } from "../../sharedStyles";

export const Painel = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

/** AreaRelativa com a mesma pilha vertical de Pagina — âncora do Carregando sem perder o espaçamento. */
export const AreaConteudo = styled(AreaRelativa)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Cabecalho = styled.header`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const BlocoTitulo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 15px;
`;

export const Subtitulo = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;

export const Navegacao = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const Periodo = styled.strong`
    min-width: 110px;
    font-size: 13px;
    text-align: center;
`;

export const Resumo = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;
