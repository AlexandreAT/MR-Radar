import { Botao, CampoSelecao, CampoTexto, VarianteBotao } from "src/components/BasicComponents";
import { Atualizacao, Caixa, Container, GrupoBotoes, GrupoMarcacoes, Marcacao } from "./styles";
import { LARGURA_CAMPO, OPCOES_INTERVALO, OPCOES_STATUS, PropriedadesFiltroRevisao, TEXTO_FILTRO } from "./types";

export function FiltroRevisao({
    vocabulario,
    projetoId,
    mrIid,
    status,
    atualizacaoAutomatica,
    intervaloSegundos,
    carregando,
    temResultado,
    ultimaAtualizacao,
    onAlterarProjeto,
    onAlterarMrIid,
    onAlterarStatus,
    onAlterarAtualizacaoAutomatica,
    onAlterarIntervalo,
    onBuscar,
}: PropriedadesFiltroRevisao) {
    return (
        <Container>
            <CampoTexto
                rotulo={vocabulario.rotuloProjeto}
                valor={projetoId}
                onChange={onAlterarProjeto}
                onEnter={onBuscar}
                placeholder={vocabulario.placeholderProjeto}
                largura={LARGURA_CAMPO.PROJETO}
            />
            <CampoTexto
                rotulo={vocabulario.rotuloNumero}
                valor={mrIid}
                onChange={onAlterarMrIid}
                onEnter={onBuscar}
                placeholder={vocabulario.placeholderNumero}
                largura={LARGURA_CAMPO.MERGE_REQUEST}
            />
            <CampoSelecao
                rotulo={TEXTO_FILTRO.ROTULO_STATUS}
                valor={status}
                opcoes={OPCOES_STATUS}
                onChange={onAlterarStatus}
                largura={LARGURA_CAMPO.SELECAO}
            />
            <CampoSelecao
                rotulo={TEXTO_FILTRO.ROTULO_INTERVALO}
                valor={intervaloSegundos}
                opcoes={OPCOES_INTERVALO}
                onChange={onAlterarIntervalo}
                largura={LARGURA_CAMPO.SELECAO}
            />

            <GrupoMarcacoes>
                <Marcacao>
                    <Caixa type="checkbox" checked={atualizacaoAutomatica} onChange={(evento) => onAlterarAtualizacaoAutomatica(evento.target.checked)} />
                    {TEXTO_FILTRO.AUTOMATICO}
                </Marcacao>
            </GrupoMarcacoes>

            <GrupoBotoes>
                <Botao variante={VarianteBotao.Primario} onClick={onBuscar} desabilitado={carregando}>
                    {carregando ? TEXTO_FILTRO.BUSCANDO : TEXTO_FILTRO.BUSCAR}
                </Botao>
                {temResultado && (
                    <Botao onClick={onBuscar} desabilitado={carregando}>
                        {TEXTO_FILTRO.ATUALIZAR}
                    </Botao>
                )}
            </GrupoBotoes>

            {ultimaAtualizacao && (
                <Atualizacao>
                    {TEXTO_FILTRO.ULTIMA_ATUALIZACAO} {ultimaAtualizacao}
                </Atualizacao>
            )}
        </Container>
    );
}
