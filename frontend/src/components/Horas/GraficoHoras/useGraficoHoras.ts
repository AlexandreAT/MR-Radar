import { useState } from "react";
import { DiaDeHoras, HorasPorIssueNoDia } from "src/api/Horas/types";
import { FormatarDiaMes, FormatarHoras, LimparTituloChamado } from "src/utils/Formatacao";
import { BarraDia, DESENHO, EstadoDia, LinhaReferencia, NOME_CURTO_DO_DIA } from "./types";

/**
 * Calcula as coordenadas das barras e da linha de referência do gráfico, e controla qual barra
 * está em foco para mostrar o detalhe por chamado.
 * @param horasPorDia Horas lançadas em cada dia útil.
 * @param horasPorDiaEsperadas Horas esperadas por dia, que viram a linha de referência.
 * @returns Barras posicionadas, linha de referência, texto alternativo e o controle do detalhe em foco.
 */
export function useGraficoHoras(horasPorDia: DiaDeHoras[], horasPorDiaEsperadas: number) {
    const [indiceEmFoco, setIndiceEmFoco] = useState<number | null>(null);

    // A escala nunca é menor que o esperado por dia, senão um dia sozinho de 1h encheria o gráfico
    // e a linha de referência sairia da área desenhada.
    const maiorValor: number = Math.max(horasPorDiaEsperadas, ...horasPorDia.map((dia) => dia.horas));
    const alturaArea: number = DESENHO.BASE_AREA - DESENHO.TOPO_AREA;

    // O detalhe sempre aparece na mesma altura, no topo do gráfico, para não pular de posição
    // conforme a barra em foco é alta ou baixa.
    const percentYDoDetalhe: number = (DESENHO.TOPO_AREA / DESENHO.ALTURA) * 100;

    const barras: BarraDia[] = horasPorDia.map((dia, indice) => {
        const altura: number = Math.max(DESENHO.ALTURA_MINIMA_BARRA, (dia.horas / maiorValor) * alturaArea);
        const y: number = DESENHO.BASE_AREA - altura;
        const x: number = DESENHO.MARGEM_LATERAL + indice * (DESENHO.LARGURA_BARRA + DESENHO.ESPACO_ENTRE_BARRAS);

        return {
            data: dia.data,
            nome: NOME_CURTO_DO_DIA[dia.dia] ?? "",
            diaMes: FormatarDiaMes(dia.data),
            texto: FormatarHoras(dia.horas),
            estado: getEstado(dia),
            hoje: dia.hoje,
            x,
            y,
            altura,
            yTexto: y - DESENHO.ALTURA_ROTULO_VALOR,
            porIssue: limparPorIssue(dia.porIssue),
            percentX: ((x + DESENHO.LARGURA_BARRA / 2) / DESENHO.LARGURA) * 100,
            percentY: percentYDoDetalhe,
        };
    });

    const referencia: LinhaReferencia = {
        y: DESENHO.BASE_AREA - (horasPorDiaEsperadas / maiorValor) * alturaArea,
        texto: FormatarHoras(horasPorDiaEsperadas),
    };

    return {
        barras,
        referencia,
        descricao: montarDescricao(horasPorDia, horasPorDiaEsperadas),
        barraEmFoco: indiceEmFoco === null ? null : barras[indiceEmFoco],
        handleFoco: (indice: number) => setIndiceEmFoco(indice),
        handleDesfoco: () => setIndiceEmFoco(null),
    };
}

/**
 * Limpa o título de cada chamado do detalhe do dia, tirando a tag de ticket que alguns títulos
 * trazem no começo, só para exibição no gráfico — a lista de chamados mostra o título original.
 * @param porIssue Horas do dia, por chamado, como vieram do backend.
 * @returns A mesma lista, com o título já limpo.
 */
function limparPorIssue(porIssue: HorasPorIssueNoDia[]): HorasPorIssueNoDia[] {
    return porIssue.map((item) => ({ ...item, titulo: LimparTituloChamado(item.titulo) }));
}

/**
 * Descobre como o dia deve ser pintado.
 * @param dia Horas lançadas no dia.
 * @returns Estado usado para escolher a cor da barra.
 */
function getEstado(dia: DiaDeHoras): EstadoDia {
    if (dia.completo)
        return EstadoDia.Completo;

    return dia.horas > 0 ? EstadoDia.Parcial : EstadoDia.Vazio;
}

/**
 * Monta o texto alternativo do gráfico, para quem não enxerga o desenho.
 * @param horasPorDia Horas lançadas em cada dia útil.
 * @param horasPorDiaEsperadas Horas esperadas por dia.
 * @returns Frase com as horas de cada dia.
 */
function montarDescricao(horasPorDia: DiaDeHoras[], horasPorDiaEsperadas: number): string {
    const dias: string = horasPorDia.map((dia) => `${NOME_CURTO_DO_DIA[dia.dia] ?? ""} ${FormatarHoras(dia.horas)}`).join(", ");

    return `Horas lançadas por dia, com referência de ${FormatarHoras(horasPorDiaEsperadas)} por dia: ${dias}.`;
}
