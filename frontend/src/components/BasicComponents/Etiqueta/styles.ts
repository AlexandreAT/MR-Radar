import styled, { DefaultTheme } from "styled-components";
import { TomEtiqueta } from "./types";

/**
 * Descobre a cor correspondente ao tom da etiqueta.
 * @param tom Tom escolhido.
 * @param theme Tema da aplicação.
 * @returns Cor em hexadecimal.
 */
function getCor(tom: TomEtiqueta, theme: DefaultTheme): string {
    const cores: Record<TomEtiqueta, string> = {
        [TomEtiqueta.Neutro]: theme.cores.textoSecundario,
        [TomEtiqueta.Aberto]: theme.cores.aberto,
        [TomEtiqueta.Resolvido]: theme.cores.resolvido,
        [TomEtiqueta.EmAndamento]: theme.cores.emAndamento,
        [TomEtiqueta.Alerta]: theme.cores.erro,
        [TomEtiqueta.Issue]: theme.cores.rotuloIssue,
        [TomEtiqueta.Suggestion]: theme.cores.rotuloSuggestion,
        [TomEtiqueta.Nit]: theme.cores.rotuloNit,
        [TomEtiqueta.Question]: theme.cores.rotuloQuestion,
        [TomEtiqueta.Praise]: theme.cores.rotuloPraise,
    };

    return cores[tom];
}

export const EtiquetaEstilizada = styled.span<{ $tom: TomEtiqueta; $selecionada: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 2px 10px;
    border-radius: 999px;
    border: 1px solid ${({ $tom, theme }) => getCor($tom, theme)};
    background: ${({ $selecionada, $tom, theme }) => ($selecionada ? getCor($tom, theme) : "transparent")};
    color: ${({ $selecionada, $tom, theme }) => ($selecionada ? theme.cores.fundo : getCor($tom, theme))};
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    white-space: nowrap;
`;
