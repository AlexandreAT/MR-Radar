import styled from "styled-components";

export const Pagina = styled.main`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
    max-width: 1100px;
    margin: 0 auto;
    padding: ${({ theme }) => theme.espacamentos.grande} ${({ theme }) => theme.espacamentos.medio};
`;

export const Cabecalho = styled.header`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const BlocoTitulo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const Titulo = styled.h1`
    margin: 0;
    font-size: 22px;
`;

export const Subtitulo = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 13px;
`;

export const EnderecoGitLab = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-family: ${({ theme }) => theme.fontes.codigo};
    font-size: 12px;
    word-break: break-all;
`;

export const CaixaAviso = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px solid ${({ theme }) => theme.cores.aberto};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.aberto};
    font-size: 13px;
`;

export const CaixaErro = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px solid ${({ theme }) => theme.cores.erro};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoErro};
`;

export const TextoErro = styled.strong`
    color: ${({ theme }) => theme.cores.erro};
    font-size: 13.5px;
`;

export const DicaErro = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;

export const TextoAviso = styled.span`
    font-size: 12.5px;
`;

export const Vazio = styled.div`
    padding: ${({ theme }) => theme.espacamentos.grande};
    border: 1px dashed ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    text-align: center;
`;

export const Lista = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const LinhaAcoes = styled.div`
    display: flex;
    justify-content: flex-end;
`;
