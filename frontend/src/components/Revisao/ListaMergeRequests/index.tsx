import { Botao, CampoSelecao, Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { FormatarDataHora } from "src/utils/Formatacao";
import {
    Acoes,
    Aviso,
    AvisoTruncada,
    Branches,
    Cabecalho,
    Container,
    Detalhes,
    Informacao,
    Item,
    Lista,
    LinhaTitulo,
    Referencia,
    Titulo,
    TituloItem,
} from "./styles";
import { LARGURA_ESCOPO, OPCOES_ESCOPO, PropriedadesListaMergeRequests, TEXTO_LISTA } from "./types";

export function ListaMergeRequests({
    mergeRequests,
    escopo,
    carregando,
    paginacaoTruncada,
    projetoSelecionado,
    mrSelecionado,
    onAlterarEscopo,
    onSelecionar,
    onAtualizar,
}: PropriedadesListaMergeRequests) {
    return (
        <Container>
            <Cabecalho>
                <Titulo>{TEXTO_LISTA.TITULO}</Titulo>
                <Acoes>
                    <CampoSelecao
                        rotulo={TEXTO_LISTA.ROTULO_ESCOPO}
                        valor={escopo}
                        opcoes={OPCOES_ESCOPO}
                        onChange={onAlterarEscopo}
                        largura={LARGURA_ESCOPO}
                    />
                    <Botao onClick={onAtualizar} desabilitado={carregando}>
                        {carregando ? TEXTO_LISTA.CARREGANDO : TEXTO_LISTA.ATUALIZAR}
                    </Botao>
                </Acoes>
            </Cabecalho>

            {paginacaoTruncada && <AvisoTruncada>{TEXTO_LISTA.TRUNCADA}</AvisoTruncada>}

            {mergeRequests.length === 0 ? (
                <Aviso>{carregando ? TEXTO_LISTA.CARREGANDO : TEXTO_LISTA.VAZIA}</Aviso>
            ) : (
                <Lista>
                    {mergeRequests.map((mergeRequest) => (
                        <Item
                            key={`${mergeRequest.projetoId}-${mergeRequest.iid}`}
                            type="button"
                            $selecionado={mergeRequest.projetoId === projetoSelecionado && String(mergeRequest.iid) === mrSelecionado}
                            onClick={() => onSelecionar(mergeRequest)}
                        >
                            <LinhaTitulo>
                                <TituloItem>{mergeRequest.titulo}</TituloItem>
                                {mergeRequest.rascunho && <Etiqueta>{TEXTO_LISTA.RASCUNHO}</Etiqueta>}
                                {mergeRequest.temThreadsAbertas && <Etiqueta tom={TomEtiqueta.Aberto}>{TEXTO_LISTA.THREADS_ABERTAS}</Etiqueta>}
                            </LinhaTitulo>
                            <Detalhes>
                                <Referencia>
                                    {mergeRequest.caminhoProjeto}!{mergeRequest.iid}
                                </Referencia>
                                <Branches>
                                    {mergeRequest.branchOrigem} {TEXTO_LISTA.SETA} {mergeRequest.branchDestino}
                                </Branches>
                                <Informacao>
                                    {TEXTO_LISTA.ATUALIZADO_EM} {FormatarDataHora(mergeRequest.atualizadoEm)}
                                </Informacao>
                            </Detalhes>
                        </Item>
                    ))}
                </Lista>
            )}
        </Container>
    );
}
