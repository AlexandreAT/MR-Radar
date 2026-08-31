import styled from "styled-components";

export { CaixaAviso, CaixaErro, DicaErro, Pagina, TextoAviso, TextoErro, Vazio } from "../../sharedStyles";

export const Lista = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const LinhaAcoes = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const ContadorExibidos = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;
