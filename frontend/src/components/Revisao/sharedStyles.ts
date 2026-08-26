import styled from "styled-components";

/** Painel padrão das seções da tela de revisão. */
export const PainelBase = styled.section`
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoPainel};
`;

/** Link para uma página do GitLab. */
export const LinkExterno = styled.a`
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

/** Título curto que identifica um bloco de conteúdo. */
export const TituloBloco = styled.span`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.cores.textoSecundario};
`;
