import styled, { keyframes } from "styled-components";

const girar = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

/**
 * Cobre só o bloco em volta (que precisa ter position: relative), nunca a tela inteira — o
 * conteúdo anterior fica levemente visível por baixo, e o resto da página continua normal.
 */
export const Sobreposicao = styled.div`
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
    background: ${({ theme }) => theme.cores.fundoPainel}cc;
    border-radius: inherit;
    z-index: 1;
`;

export const Aro = styled.div`
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 3px solid ${({ theme }) => theme.cores.borda};
    border-top-color: ${({ theme }) => theme.cores.primaria};
    animation: ${girar} 0.7s linear infinite;
`;

export const Texto = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
`;
