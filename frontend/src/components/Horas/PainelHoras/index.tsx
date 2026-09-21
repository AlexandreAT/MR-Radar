import { Botao, Carregando, Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { GraficoHoras } from "src/components/Horas/GraficoHoras";
import { ListaIssuesHoras } from "src/components/Horas/ListaIssuesHoras";
import { ResumoComentariosSemana } from "src/components/Horas/ResumoComentariosSemana";
import { FormatarHoras } from "src/utils/Formatacao";
import {
    AreaConteudo,
    BlocoTitulo,
    Cabecalho,
    CaixaAviso,
    CaixaErro,
    DicaErro,
    Navegacao,
    Pagina,
    Painel,
    Periodo,
    Resumo,
    Subtitulo,
    TextoAviso,
    TextoErro,
    Titulo,
    Vazio,
} from "./styles";
import { PropriedadesPainelHoras, TEXTO_HORAS } from "./types";
import { usePainelHoras } from "./usePainelHoras";

export function PainelHoras({ configuracao }: PropriedadesPainelHoras) {
    const {
        resumo,
        carregando,
        erro,
        mensagemVazio,
        periodo,
        diaSelecionado,
        diaReferencia,
        ehDiaReferenciaHoje,
        handleSemanaAnterior,
        handleSemanaSeguinte,
        handleSelecionarDia,
        handleAtualizar,
    } = usePainelHoras(configuracao);

    return (
        <Pagina>
            {erro && (
                <CaixaErro>
                    <TextoErro>{erro.mensagem}</TextoErro>
                    {erro.dica && <DicaErro>{erro.dica}</DicaErro>}
                </CaixaErro>
            )}

            <AreaConteudo>
                {resumo && (
                    <Painel>
                        <Cabecalho>
                            <BlocoTitulo>
                                <Titulo>{TEXTO_HORAS.TITULO}</Titulo>
                                <Subtitulo>{TEXTO_HORAS.SUBTITULO}</Subtitulo>
                            </BlocoTitulo>
                            <Navegacao>
                                <Botao onClick={handleSemanaAnterior} desabilitado={carregando}>
                                    {TEXTO_HORAS.SEMANA_ANTERIOR}
                                </Botao>
                                <Periodo>{periodo}</Periodo>
                                <Botao onClick={handleSemanaSeguinte} desabilitado={carregando || resumo.ehSemanaAtual}>
                                    {TEXTO_HORAS.SEMANA_SEGUINTE}
                                </Botao>
                                <Botao onClick={handleAtualizar} desabilitado={carregando}>
                                    {carregando ? TEXTO_HORAS.CARREGANDO : TEXTO_HORAS.ATUALIZAR}
                                </Botao>
                            </Navegacao>
                        </Cabecalho>

                        <Resumo>
                            <Etiqueta tom={TomEtiqueta.Resolvido}>
                                {FormatarHoras(resumo.horasLancadas)} {TEXTO_HORAS.LANCADAS}
                            </Etiqueta>
                            <Etiqueta>
                                {FormatarHoras(resumo.horasEsperadas)} {TEXTO_HORAS.ESPERADAS}
                            </Etiqueta>
                            {resumo.horasFaltando > 0 ? (
                                <Etiqueta tom={TomEtiqueta.Aberto}>
                                    {FormatarHoras(resumo.horasFaltando)} {TEXTO_HORAS.FALTANDO}
                                </Etiqueta>
                            ) : (
                                <Etiqueta tom={TomEtiqueta.Resolvido}>{TEXTO_HORAS.SEMANA_FECHADA}</Etiqueta>
                            )}
                            {resumo.horasNoFimDeSemana > 0 && (
                                <Etiqueta tom={TomEtiqueta.Nit}>
                                    {FormatarHoras(resumo.horasNoFimDeSemana)} {TEXTO_HORAS.FIM_DE_SEMANA}
                                </Etiqueta>
                            )}
                        </Resumo>

                        <GraficoHoras
                            horasPorDia={resumo.horasPorDia}
                            horasPorDiaEsperadas={resumo.horasPorDiaEsperadas}
                            diaSelecionado={diaSelecionado}
                            onSelecionarDia={handleSelecionarDia}
                        />

                        <ResumoComentariosSemana horasPorDia={resumo.horasPorDia} />
                    </Painel>
                )}

                {!resumo && !erro && <Vazio>{mensagemVazio}</Vazio>}

                {resumo && <ListaIssuesHoras issues={resumo.issues} diaReferencia={diaReferencia} ehHoje={ehDiaReferenciaHoje} />}

                <Carregando ativo={carregando} texto={TEXTO_HORAS.CARREGANDO} />
            </AreaConteudo>

            {resumo?.paginacaoTruncada && (
                <CaixaAviso>
                    <TextoAviso>{TEXTO_HORAS.TRUNCADA}</TextoAviso>
                </CaixaAviso>
            )}
        </Pagina>
    );
}
