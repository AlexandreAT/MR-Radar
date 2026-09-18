import styled, { DefaultTheme } from "styled-components";
import { NivelElegibilidade } from "src/utils/Elegibilidade";
import { PainelBase } from "../../sharedStyles";

/**
 * Descobre a cor do marcador de elegibilidade conforme o nível de confiança.
 * @param nivel Nível de elegibilidade da issue.
 * @param theme Tema da aplicação.
 * @returns Cor em hexadecimal.
 */
function getCorElegibilidade(nivel: NivelElegibilidade, theme: DefaultTheme): string {
    return nivel === NivelElegibilidade.CommitouNoDiaDeReferencia ? theme.cores.resolvido : theme.cores.aberto;
}

export const Container = styled(PainelBase)`
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;

export const Titulo = styled.h2`
    margin: 0;
    font-size: 15px;
`;

export const Lista = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const Item = styled.a`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.raioBorda};
    border: 1px solid ${({ theme }) => theme.cores.borda};
    color: ${({ theme }) => theme.cores.texto};
    text-decoration: none;
    transition: border-color 0.15s ease;

    &:hover {
        border-color: ${({ theme }) => theme.cores.primaria};
    }
`;

export const LinhaTitulo = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

export const TituloItem = styled.strong`
    font-size: 13.5px;
    font-weight: 600;
`;

export const Horas = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: ${({ theme }) => theme.espacamentos.pequeno};
`;

/**
 * Brilho sutil em volta do marcador e do texto de horas do dia de referência — só a issue que já
 * recebeu horas no dia (hoje ou o clicado no gráfico) ganha o efeito, as demais ficam sem glow.
 * @param theme Tema da aplicação.
 * @returns Sombra usada como glow verde.
 */
function getGlow(theme: DefaultTheme): string {
    return `0 0 3px ${theme.cores.resolvido}80`;
}

export const PontoElegibilidade = styled.span<{ $nivel: NivelElegibilidade; $destaque: boolean }>`
    display: inline-block;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $nivel, theme }) => getCorElegibilidade($nivel, theme)};
    box-shadow: ${({ $destaque, theme }) => ($destaque ? getGlow(theme) : "none")};
`;

export const HorasNaSemana = styled.span<{ $temHoras: boolean; $destaque: boolean }>`
    color: ${({ $temHoras, theme }) => ($temHoras ? theme.cores.resolvido : theme.cores.textoSecundario)};
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
    text-shadow: ${({ $destaque, theme }) => ($destaque ? getGlow(theme) : "none")};
`;

export const HorasTotais = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
    white-space: nowrap;
`;

export const Detalhes = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: ${({ theme }) => theme.espacamentos.medio};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
`;

export const Referencia = styled.span`
    font-family: ${({ theme }) => theme.fontes.codigo};
    word-break: break-all;
`;

export const Informacao = styled.span`
    white-space: nowrap;
`;

export const Aviso = styled.div`
    padding: ${({ theme }) => theme.espacamentos.medio};
    border: 1px dashed ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12.5px;
    text-align: center;
`;
