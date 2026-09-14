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

/** Medidas do desenho, em unidades do viewBox. */
export const DESENHO = {
    LARGURA: 360,
    ALTURA: 214,
    MARGEM_LATERAL: 16,
    LARGURA_BARRA: 46,
    ESPACO_ENTRE_BARRAS: 24,
    // Deixa uma folga acima da barra mais alta possível (quando o dia bate a meta, ela encosta na
    // linha de referência): sem essa folga, o rótulo da barra e o rótulo da linha de referência
    // ficam colados um no outro quando o último dia da semana bate a meta.
    TOPO_AREA: 34,
    BASE_AREA: 168,
    ALTURA_MINIMA_BARRA: 3,
    RAIO_BARRA: 4,
    ALTURA_ROTULO_VALOR: 8,
    LINHA_ROTULO_ESPERADO: 12,
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
    /** Dia (AAAA-MM-DD) clicado no gráfico, usado como referência na lista de chamados abaixo. */
    diaSelecionado: string | null;
    /** Chamado quando o usuário clica numa barra, para marcar aquele dia como referência. */
    onSelecionarDia: (data: string) => void;
}
