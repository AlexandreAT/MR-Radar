import styled, { DefaultTheme } from "styled-components";
import { EstadoDia } from "./types";

/**
 * Descobre a cor da barra conforme o quanto o dia foi preenchido.
 * @param estado Estado do dia.
 * @param theme Tema da aplicação.
 * @returns Cor em hexadecimal.
 */
function getCorDaBarra(estado: EstadoDia, theme: DefaultTheme): string {
    const cores: Record<EstadoDia, string> = {
        [EstadoDia.Vazio]: theme.cores.borda,
        [EstadoDia.Parcial]: theme.cores.aberto,
        [EstadoDia.Completo]: theme.cores.resolvido,
    };

    return cores[estado];
}

export const Moldura = styled.div`
    position: relative;
`;

export const Desenho = styled.svg`
    display: block;
    width: 100%;
    height: auto;
`;

export const Barra = styled.rect<{ $estado: EstadoDia }>`
    fill: ${({ $estado, theme }) => getCorDaBarra($estado, theme)};
    pointer-events: none;
`;

export const Trilho = styled.rect<{ $selecionada: boolean }>`
    fill: ${({ theme }) => theme.cores.fundoCampo};
    stroke: ${({ $selecionada, theme }) => ($selecionada ? theme.cores.primaria : "transparent")};
    stroke-width: 2;
    cursor: pointer;
`;

export const LinhaEsperada = styled.line`
    stroke: ${({ theme }) => theme.cores.primaria};
    stroke-width: 1;
    stroke-dasharray: 4 4;
`;

export const LinhaBase = styled.line`
    stroke: ${({ theme }) => theme.cores.borda};
    stroke-width: 1;
`;

export const ValorDaBarra = styled.text<{ $estado: EstadoDia }>`
    fill: ${({ $estado, theme }) => getCorDaBarra($estado, theme)};
    font-family: ${({ theme }) => theme.fontes.padrao};
    font-size: 12px;
    font-weight: 700;
    text-anchor: middle;
    pointer-events: none;
`;

export const NomeDoDia = styled.text<{ $hoje: boolean }>`
    fill: ${({ $hoje, theme }) => ($hoje ? theme.cores.texto : theme.cores.textoSecundario)};
    font-family: ${({ theme }) => theme.fontes.padrao};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-anchor: middle;
`;

export const DataDoDia = styled.text<{ $hoje: boolean }>`
    fill: ${({ $hoje, theme }) => ($hoje ? theme.cores.primaria : theme.cores.textoSecundario)};
    font-family: ${({ theme }) => theme.fontes.padrao};
    font-size: 10px;
    text-anchor: middle;
`;

export const RotuloEsperado = styled.text`
    fill: ${({ theme }) => theme.cores.primaria};
    font-family: ${({ theme }) => theme.fontes.padrao};
    font-size: 10px;
    font-weight: 700;
    text-anchor: end;
`;

export const Tooltip = styled.div<{ $percentX: number; $percentY: number }>`
    position: absolute;
    left: ${({ $percentX }) => $percentX}%;
    top: ${({ $percentY }) => $percentY}%;
    transform: translate(-50%, -100%);
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 160px;
    max-width: 220px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.cores.borda};
    border-radius: ${({ theme }) => theme.raioBorda};
    background: ${({ theme }) => theme.cores.fundoPainel};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
    pointer-events: none;
    z-index: 1;
`;

export const TituloTooltip = styled.strong`
    color: ${({ theme }) => theme.cores.texto};
    font-size: 12px;
`;

export const LinhaTooltip = styled.div`
    display: flex;
    align-items: baseline;
    gap: 6px;
    font-size: 12px;
`;

export const HorasDoChamado = styled.span`
    flex: none;
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-weight: 700;
    white-space: nowrap;
`;

export const NomeDoChamado = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.cores.texto};
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const SemLancamentos = styled.span`
    color: ${({ theme }) => theme.cores.textoSecundario};
    font-size: 12px;
`;
