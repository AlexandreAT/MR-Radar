import { FormatarHoras } from "src/utils/Formatacao";
import {
    Barra,
    DataDoDia,
    Desenho,
    HorasDoChamado,
    LinhaBase,
    LinhaEsperada,
    LinhaTooltip,
    Moldura,
    NomeDoChamado,
    NomeDoDia,
    RotuloEsperado,
    SemLancamentos,
    Tooltip,
    Trilho,
    TituloTooltip,
    ValorDaBarra,
} from "./styles";
import { DESENHO, PropriedadesGraficoHoras, TEXTO_GRAFICO } from "./types";
import { useGraficoHoras } from "./useGraficoHoras";

export function GraficoHoras({ horasPorDia, horasPorDiaEsperadas }: PropriedadesGraficoHoras) {
    const { barras, referencia, descricao, barraEmFoco, handleFoco, handleDesfoco } = useGraficoHoras(horasPorDia, horasPorDiaEsperadas);

    return (
        <Moldura>
            <Desenho viewBox={`0 0 ${DESENHO.LARGURA} ${DESENHO.ALTURA}`} role="img" aria-label={descricao}>
                {barras.map((barra, indice) => (
                    <Trilho
                        key={barra.data}
                        x={barra.x}
                        y={DESENHO.TOPO_AREA}
                        width={DESENHO.LARGURA_BARRA}
                        height={DESENHO.BASE_AREA - DESENHO.TOPO_AREA}
                        rx={DESENHO.RAIO_BARRA}
                        onMouseEnter={() => handleFoco(indice)}
                        onMouseLeave={handleDesfoco}
                    />
                ))}

                {barras.map((barra) => (
                    <Barra key={barra.data} $estado={barra.estado} x={barra.x} y={barra.y} width={DESENHO.LARGURA_BARRA} height={barra.altura} rx={DESENHO.RAIO_BARRA} />
                ))}

                <LinhaEsperada x1={DESENHO.MARGEM_LATERAL} y1={referencia.y} x2={DESENHO.LARGURA - DESENHO.MARGEM_LATERAL} y2={referencia.y} />
                <RotuloEsperado x={DESENHO.LARGURA - DESENHO.MARGEM_LATERAL} y={referencia.y - 4}>
                    {referencia.texto}
                </RotuloEsperado>

                <LinhaBase x1={DESENHO.MARGEM_LATERAL} y1={DESENHO.BASE_AREA} x2={DESENHO.LARGURA - DESENHO.MARGEM_LATERAL} y2={DESENHO.BASE_AREA} />

                {barras.map((barra) => (
                    <ValorDaBarra key={barra.data} $estado={barra.estado} x={barra.x + DESENHO.LARGURA_BARRA / 2} y={barra.yTexto}>
                        {barra.texto}
                    </ValorDaBarra>
                ))}

                {barras.map((barra) => (
                    <NomeDoDia key={barra.data} $hoje={barra.hoje} x={barra.x + DESENHO.LARGURA_BARRA / 2} y={DESENHO.LINHA_NOME_DIA}>
                        {barra.nome}
                    </NomeDoDia>
                ))}

                {barras.map((barra) => (
                    <DataDoDia key={barra.data} $hoje={barra.hoje} x={barra.x + DESENHO.LARGURA_BARRA / 2} y={DESENHO.LINHA_DATA}>
                        {barra.diaMes}
                    </DataDoDia>
                ))}
            </Desenho>

            {barraEmFoco && (
                <Tooltip $percentX={barraEmFoco.percentX} $percentY={barraEmFoco.percentY}>
                    <TituloTooltip>
                        {barraEmFoco.nome} {barraEmFoco.diaMes} {TEXTO_GRAFICO.SEPARADOR} {barraEmFoco.texto}
                    </TituloTooltip>
                    {barraEmFoco.porIssue.length === 0 ? (
                        <SemLancamentos>{TEXTO_GRAFICO.SEM_LANCAMENTOS}</SemLancamentos>
                    ) : (
                        barraEmFoco.porIssue.map((item) => (
                            <LinhaTooltip key={item.titulo}>
                                <HorasDoChamado>
                                    {FormatarHoras(item.horas)} {TEXTO_GRAFICO.SEPARADOR_ITEM}
                                </HorasDoChamado>
                                <NomeDoChamado>{item.titulo}</NomeDoChamado>
                            </LinhaTooltip>
                        ))
                    )}
                </Tooltip>
            )}
        </Moldura>
    );
}
