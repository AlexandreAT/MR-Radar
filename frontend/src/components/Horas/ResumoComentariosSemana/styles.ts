import styled, { DefaultTheme } from "styled-components";
import { EstadoComentarioDoDia } from "src/utils/ComentarioDoDia";
import { PainelBase } from "../../sharedStyles";

/**
 * Descobre a cor do marcador conforme o dia já passou (com ou sem comentário) ou ainda vai chegar.
 * @param estado Estado do dia.
 * @param theme Tema da aplicação.
 * @returns Cor em hexadecimal.
 */
function getCorEstado(estado: EstadoComentarioDoDia, theme: DefaultTheme): string {
    const cores: Record<EstadoComentarioDoDia, string> = {
        [EstadoComentarioDoDia.Futuro]: theme.cores.textoSecundario,
        [EstadoComentarioDoDia.ComComentario]: theme.cores.resolvido,
        [EstadoComentarioDoDia.SemComentario]: theme.cores.aberto,
    };

    return cores[estado];
}

export const Container = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 15px;
`;

export const Linha = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const Marcador = styled.span<{ $estado: EstadoComentarioDoDia }>`
    display: flex;
    align-items: center;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid ${({ $estado, theme }) => getCorEstado($estado, theme)};
    background: ${({ $estado, theme }) => `${getCorEstado($estado, theme)}1f`};
    color: ${({ $estado, theme }) => getCorEstado($estado, theme)};
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.04em;
`;
