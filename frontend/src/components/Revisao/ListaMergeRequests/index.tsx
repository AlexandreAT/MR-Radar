import { Botao, CampoSelecao, CampoTexto, Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { FormatarDataHora } from "src/utils/Formatacao";
import {
    Acoes,
    Aviso,
    AvisoTruncada,
    Branches,
    Container,
    Detalhes,
    Informacao,
    Item,
    Lista,
    LinhaControles,
    LinhaPesquisa,
    LinhaTitulo,
    Referencia,
    Titulo,
    TituloItem,
} from "./styles";
import { LARGURA_ESCOPO, LARGURA_PESQUISA, OPCOES_ESCOPO, PropriedadesListaMergeRequests, TEXTO_LISTA } from "./types";

export function ListaMergeRequests({
    vocabulario,
    mergeRequests,
    escopo,
    carregando,
    paginacaoTruncada,
    projetoSelecionado,
    mrSelecionado,
    termoPesquisa,
    podePesquisar,
    resultadosPesquisa,
    pesquisaTruncada,
    pesquisando,
    erroPesquisa,
    onAlterarEscopo,
    onSelecionar,
    onAtualizar,
    onAlterarTermoPesquisa,
    onPesquisar,
}: PropriedadesListaMergeRequests) {
    const emModoPesquisa: boolean = resultadosPesquisa !== null;
    const itensExibidos: typeof mergeRequests = resultadosPesquisa ?? mergeRequests;
    const truncadaExibida: boolean = emModoPesquisa ? pesquisaTruncada : paginacaoTruncada;
    const carregandoExibido: boolean = emModoPesquisa ? pesquisando : carregando;

    return (
        <Container>
            <Titulo>{emModoPesquisa ? TEXTO_LISTA.RESULTADOS_PESQUISA : `Meus ${vocabulario.nomeItemPlural} abertos`}</Titulo>

            <LinhaControles>
                <LinhaPesquisa>
                    <CampoTexto
                        rotulo={TEXTO_LISTA.PESQUISAR}
                        valor={termoPesquisa}
                        onChange={onAlterarTermoPesquisa}
                        onEnter={onPesquisar}
                        placeholder={`Título do ${vocabulario.nomeItem}`}
                        largura={LARGURA_PESQUISA}
                    />
                    <Botao onClick={onPesquisar} desabilitado={pesquisando || !podePesquisar}>
                        {pesquisando ? TEXTO_LISTA.PESQUISANDO : TEXTO_LISTA.PESQUISAR}
                    </Botao>
                    {emModoPesquisa && <Botao onClick={() => onAlterarTermoPesquisa("")}>{TEXTO_LISTA.LIMPAR_PESQUISA}</Botao>}
                </LinhaPesquisa>

                {!emModoPesquisa && (
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
                )}
            </LinhaControles>

            {erroPesquisa && <Aviso>{erroPesquisa}</Aviso>}

            {truncadaExibida && <AvisoTruncada>{TEXTO_LISTA.TRUNCADA}</AvisoTruncada>}

            {itensExibidos.length === 0 ? (
                <Aviso>
                    {carregandoExibido
                        ? TEXTO_LISTA.CARREGANDO
                        : emModoPesquisa
                          ? TEXTO_LISTA.NENHUM_RESULTADO
                          : `Nenhum ${vocabulario.nomeItem} aberto encontrado para este filtro.`}
                </Aviso>
            ) : (
                <Lista>
                    {itensExibidos.map((mergeRequest) => (
                        <Item
                            key={`${mergeRequest.projetoId}-${mergeRequest.iid}`}
                            type="button"
                            $selecionado={mergeRequest.projetoId === projetoSelecionado && String(mergeRequest.iid) === mrSelecionado}
                            onClick={() => onSelecionar(mergeRequest)}
                        >
                            <LinhaTitulo>
                                <TituloItem>{mergeRequest.titulo}</TituloItem>
                                {mergeRequest.statusChamado && <Etiqueta tom={TomEtiqueta.EmAndamento}>{mergeRequest.statusChamado}</Etiqueta>}
                                {mergeRequest.chamadoValido !== null && (
                                    <Etiqueta tom={mergeRequest.chamadoValido ? TomEtiqueta.Resolvido : TomEtiqueta.Issue}>
                                        {mergeRequest.chamadoValido ? TEXTO_LISTA.VALIDO : TEXTO_LISTA.INVALIDO}
                                    </Etiqueta>
                                )}
                                {mergeRequest.temThreadsAbertas && <Etiqueta tom={TomEtiqueta.Aberto}>{TEXTO_LISTA.THREADS_ABERTAS}</Etiqueta>}
                            </LinhaTitulo>
                            <Detalhes>
                                <Referencia>
                                    {mergeRequest.caminhoProjeto}
                                    {vocabulario.prefixoReferencia}
                                    {mergeRequest.iid}
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
