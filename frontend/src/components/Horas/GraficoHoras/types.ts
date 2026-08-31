import { DiaDeHoras, HorasPorIssueNoDia } from "src/api/Horas/types";

/** Como o dia é pintado no gráfico. */
export enum EstadoDia {
    Vazio = "vazio",
    Parcial = "parcial",
    Completo = "completo",
}

/** Textos fixos exibidos no detalhe do gráfico. */
export const TEXTO_GRAFICO = {
    SEPARADOR: "·",
    SEPARADOR_ITEM: "-",
    SEM_LANCAMENTOS: "Sem lançamentos",
} as const;

/** Nome curto exibido embaixo de cada barra. */
export const NOME_CURTO_DO_DIA: Record<string, string> = {
    segunda: "SEG",
    terca: "TER",
    quarta: "QUA",
    quinta: "QUI",
    sexta: "SEX",
};

/** Medidas do desenho, em unidades do viewBox. */
export const DESENHO = {
    LARGURA: 360,
    ALTURA: 214,
    MARGEM_LATERAL: 16,
    LARGURA_BARRA: 46,
    ESPACO_ENTRE_BARRAS: 24,
    TOPO_AREA: 22,
    BASE_AREA: 168,
    ALTURA_MINIMA_BARRA: 3,
    RAIO_BARRA: 4,
    ALTURA_ROTULO_VALOR: 8,
    LINHA_NOME_DIA: 187,
    LINHA_DATA: 203,
} as const;

/** Barra já posicionada, pronta para ser desenhada. */
export interface BarraDia {
    data: string;
    nome: string;
    diaMes: string;
    texto: string;
    estado: EstadoDia;
    hoje: boolean;
    x: number;
    y: number;
    altura: number;
    yTexto: number;
    porIssue: HorasPorIssueNoDia[];
    percentX: number;
    percentY: number;
}

/** Linha de referência das horas esperadas por dia. */
export interface LinhaReferencia {
    y: number;
    texto: string;
}

/** Propriedades aceitas pelo gráfico de horas da semana. */
export interface PropriedadesGraficoHoras {
    horasPorDia: DiaDeHoras[];
    horasPorDiaEsperadas: number;
}
