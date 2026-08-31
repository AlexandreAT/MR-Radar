import styled from "styled-components";

export { CaixaAviso, CaixaErro, DicaErro, TextoAviso, TextoErro } from "../../sharedStyles";

export const Cabecalho = styled.header`
    position: sticky;
    top: 0;
    z-index: 1;
    border-bottom: 1px solid ${({ theme }) => theme.cores.borda};
    background: ${({ theme }) => theme.cores.fundoPainel};
`;

export const Conteudo = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.medio};
    max-width: 1100px;
    margin: 0 auto;
    padding: ${({ theme }) => theme.espacamentos.pequeno} ${({ theme }) => theme.espacamentos.medio};
`;

export const Titulo = styled.h1`
    margin: 0;
    font-size: 18px;
`;

export const Abas = styled.nav`
    display: flex;
    gap: 4px;
`;

export const Aba = styled.button<{ $ativa: boolean }>`
    padding: 6px 14px;
    border-radius: ${({ theme }) => theme.raioBorda};
    border: 1px solid ${({ $ativa, theme }) => ($ativa ? theme.cores.primaria : "transparent")};
    background: ${({ $ativa, theme }) => ($ativa ? theme.cores.fundoCampo : "transparent")};
    color: ${({ $ativa, theme }) => ($ativa ? theme.cores.texto : theme.cores.textoSecundario)};
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;

    &:hover {
        color: ${({ theme }) => theme.cores.texto};
        border-color: ${({ theme }) => theme.cores.borda};
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.cores.primaria};
        outline-offset: 2px;
    }
`;

export const Direita = styled.div`
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    margin-left: auto;
`;

export const EnderecoGitLab = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-family: ${({ theme }) => theme.fontes.codigo};
    font-size: 12px;
    word-break: break-all;
`;

export const Avisos = styled.div`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 ${({ theme }) => theme.espacamentos.medio} ${({ theme }) => theme.espacamentos.medio};
`;
