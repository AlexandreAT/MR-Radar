import styled from "styled-components";

/** Painel padrão das seções das telas. */
export const PainelBase = styled.section`
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoPainel};
`;

/** Moldura de uma página inteira do dashboard. */
export const Pagina = styled.main`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
    max-width: 1100px;
    margin: 0 auto;
    padding: ${({ theme }) => theme.espacamentos.grande} ${({ theme }) => theme.espacamentos.medio};
`;

/** Caixa de aviso, para o que não impede a tela de funcionar. */
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

/** Texto de uma linha dentro da caixa de aviso. */
export const TextoAviso = styled.span`
    font-size: 12.5px;
`;

/** Caixa de erro, para o que impediu a consulta. */
export const CaixaErro = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px solid ${({ theme }) => theme.cores.erro};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoErro};
`;

/** Mensagem principal de um erro. */
export const TextoErro = styled.strong`
    color: ${({ theme }) => theme.cores.erro};
    font-size: 13.5px;
`;

/** Orientação que acompanha a mensagem de erro. */
export const DicaErro = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;

/** Espaço reservado para quando não há nada a mostrar. */
export const Vazio = styled.div`
    padding: ${({ theme }) => theme.espacamentos.grande};
    border: 1px dashed ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    text-align: center;
`;

/** Link para uma página do provedor. */
export const LinkExterno = styled.a`
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

/** Ancora um indicador de carregamento (ou qualquer sobreposição) só a este bloco, nunca à tela inteira. */
export const AreaRelativa = styled.div`
    position: relative;
`;

/** Título curto que identifica um bloco de conteúdo. */
export const TituloBloco = styled.span`
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.cores.textoSecundario};
`;
