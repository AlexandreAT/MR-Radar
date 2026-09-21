import { ReactNode } from "react";
import { MergeRequestAberto, SituacaoMergeRequest } from "src/api/Revisao/types";
import { Botao, CampoSelecao, CampoTexto, Carregando, Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { AreaRelativa } from "src/components/sharedStyles";
import { FormatarDataHora } from "src/utils/Formatacao";
import {
    Abas,
    AbaBotao,
    Acoes,
    Aviso,
    AvisoTruncada,
    Branches,
    Container,
    Detalhes,
    Informacao,
    Item,
    InfoPaginacao,
    Lista,
    LinhaControles,
    LinhaPesquisa,
    LinhaTitulo,
    Paginacao,
    Referencia,
    Titulo,
    TituloItem,
} from "./styles";
import { AbaMergeRequests, LARGURA_ESCOPO, LARGURA_PESQUISA, OPCOES_ESCOPO, PropriedadesListaMergeRequests, ROTULO_SITUACAO, TEXTO_LISTA } from "./types";
import { useListaMergeRequests } from "./useListaMergeRequests";

export function ListaMergeRequests({ configuracao, projetoSelecionado, mrSelecionado, onSelecionar }: PropriedadesListaMergeRequests) {
    const {
        vocabulario,
        aba,
        escopo,
        itensAbertosExibidos,
        truncadaAbertosExibida,
        carregandoAbertosExibido,
        erroLista,
        termoPesquisa,
        podePesquisar,
        emModoPesquisa,
        erroPesquisa,
        escopoEncerrados,
        itensEncerradosExibidos,
        truncadaEncerradosExibida,
        carregandoEncerradosExibido,
        erroEncerradosExibido,
        paginaEncerradosExibida,
        totalPaginasEncerradosExibida,
        totalItensEncerradosExibido,
        emModoPesquisaEncerrados,
        termoPesquisaEncerrados,
        podePesquisarEncerrados,
        handleAlterarAba,
        handleAlterarEscopo,
        handleAtualizar,
        handleAlterarTermoPesquisa,
        handlePesquisar,
        handleAlterarEscopoEncerrados,
        handleAtualizarEncerrados,
        handleAlterarPaginaEncerrados,
        handleAlterarTermoPesquisaEncerrados,
        handlePesquisarEncerrados,
        handleAlterarPaginaPesquisaEncerrados,
    } = useListaMergeRequests(configuracao);

    const ehAbaAbertos: boolean = aba === AbaMergeRequests.Abertos;
    const handleAlterarPaginaExibida = emModoPesquisaEncerrados ? handleAlterarPaginaPesquisaEncerrados : handleAlterarPaginaEncerrados;

    /**
     * Monta a lista de itens (ou o aviso de vazio), compartilhada pelas duas abas. O carregamento
     * em si não entra mais aqui: quem chama envolve o resultado com Carregando, por cima.
     * @param itens Merge Requests a exibir.
     * @param textoVazio Texto exibido quando não há item nenhum.
     * @returns Lista pronta para o JSX.
     */
    function renderItens(itens: MergeRequestAberto[], textoVazio: string): ReactNode {
        if (itens.length === 0)
            return <Aviso>{textoVazio}</Aviso>;

        return (
            <Lista>
                {itens.map((mergeRequest) => (
                    <Item
                        key={`${mergeRequest.projetoId}-${mergeRequest.iid}`}
                        type="button"
                        $selecionado={mergeRequest.projetoId === projetoSelecionado && String(mergeRequest.iid) === mrSelecionado}
                        onClick={() => onSelecionar(mergeRequest)}
                    >
                        <LinhaTitulo>
                            <TituloItem>{mergeRequest.titulo}</TituloItem>
                            {ROTULO_SITUACAO[mergeRequest.situacao] && (
                                <Etiqueta tom={mergeRequest.situacao === SituacaoMergeRequest.Mesclado ? TomEtiqueta.Resolvido : TomEtiqueta.Neutro}>
                                    {ROTULO_SITUACAO[mergeRequest.situacao]}
                                </Etiqueta>
                            )}
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
        );
    }

    return (
        <Container>
            <Abas>
                <AbaBotao type="button" $ativa={ehAbaAbertos} onClick={() => handleAlterarAba(AbaMergeRequests.Abertos)}>
                    {TEXTO_LISTA.ABA_ABERTOS}
                </AbaBotao>
                <AbaBotao type="button" $ativa={!ehAbaAbertos} onClick={() => handleAlterarAba(AbaMergeRequests.Encerrados)}>
                    {TEXTO_LISTA.ABA_ENCERRADOS}
                </AbaBotao>
            </Abas>

            {ehAbaAbertos ? (
                <>
                    <Titulo>{emModoPesquisa ? TEXTO_LISTA.RESULTADOS_PESQUISA : `Meus ${vocabulario.nomeItemPlural} abertos`}</Titulo>

                    <LinhaControles>
                        <LinhaPesquisa>
                            <CampoTexto
                                rotulo={TEXTO_LISTA.PESQUISAR}
                                valor={termoPesquisa}
                                onChange={handleAlterarTermoPesquisa}
                                onEnter={handlePesquisar}
                                placeholder={`Título do ${vocabulario.nomeItem}`}
                                largura={LARGURA_PESQUISA}
                            />
                            <Botao onClick={handlePesquisar} desabilitado={!podePesquisar}>
                                {TEXTO_LISTA.PESQUISAR}
                            </Botao>
                            {emModoPesquisa && <Botao onClick={() => handleAlterarTermoPesquisa("")}>{TEXTO_LISTA.LIMPAR_PESQUISA}</Botao>}
                        </LinhaPesquisa>

                        {!emModoPesquisa && (
                            <Acoes>
                                <CampoSelecao rotulo={TEXTO_LISTA.ROTULO_ESCOPO} valor={escopo} opcoes={OPCOES_ESCOPO} onChange={handleAlterarEscopo} largura={LARGURA_ESCOPO} />
                                <Botao onClick={handleAtualizar} desabilitado={carregandoAbertosExibido}>
                                    {carregandoAbertosExibido ? TEXTO_LISTA.CARREGANDO : TEXTO_LISTA.ATUALIZAR}
                                </Botao>
                            </Acoes>
                        )}
                    </LinhaControles>

                    {erroLista && <Aviso>{erroLista.mensagem}</Aviso>}
                    {erroPesquisa && <Aviso>{erroPesquisa.mensagem}</Aviso>}
                    {truncadaAbertosExibida && <AvisoTruncada>{TEXTO_LISTA.TRUNCADA}</AvisoTruncada>}

                    <AreaRelativa>
                        {renderItens(itensAbertosExibidos, emModoPesquisa ? TEXTO_LISTA.NENHUM_RESULTADO : `Nenhum ${vocabulario.nomeItem} aberto encontrado para este filtro.`)}
                        <Carregando ativo={carregandoAbertosExibido} />
                    </AreaRelativa>
                </>
            ) : (
                <>
                    <Titulo>{emModoPesquisaEncerrados ? TEXTO_LISTA.RESULTADOS_PESQUISA : `Meus ${vocabulario.nomeItemPlural} encerrados`}</Titulo>

                    <LinhaControles>
                        <LinhaPesquisa>
                            <CampoTexto
                                rotulo={TEXTO_LISTA.PESQUISAR}
                                valor={termoPesquisaEncerrados}
                                onChange={handleAlterarTermoPesquisaEncerrados}
                                onEnter={handlePesquisarEncerrados}
                                placeholder={`Título do ${vocabulario.nomeItem}`}
                                largura={LARGURA_PESQUISA}
                            />
                            <Botao onClick={handlePesquisarEncerrados} desabilitado={!podePesquisarEncerrados}>
                                {TEXTO_LISTA.PESQUISAR}
                            </Botao>
                            {emModoPesquisaEncerrados && <Botao onClick={() => handleAlterarTermoPesquisaEncerrados("")}>{TEXTO_LISTA.LIMPAR_PESQUISA}</Botao>}
                        </LinhaPesquisa>

                        {!emModoPesquisaEncerrados && (
                            <Acoes>
                                <CampoSelecao rotulo={TEXTO_LISTA.ROTULO_ESCOPO} valor={escopoEncerrados} opcoes={OPCOES_ESCOPO} onChange={handleAlterarEscopoEncerrados} largura={LARGURA_ESCOPO} />
                                <Botao onClick={handleAtualizarEncerrados} desabilitado={carregandoEncerradosExibido}>
                                    {carregandoEncerradosExibido ? TEXTO_LISTA.CARREGANDO : TEXTO_LISTA.ATUALIZAR}
                                </Botao>
                            </Acoes>
                        )}
                    </LinhaControles>

                    {erroEncerradosExibido && <Aviso>{erroEncerradosExibido.mensagem}</Aviso>}
                    {truncadaEncerradosExibida && <AvisoTruncada>{TEXTO_LISTA.TRUNCADA}</AvisoTruncada>}

                    <AreaRelativa>
                        {renderItens(
                            itensEncerradosExibidos,
                            emModoPesquisaEncerrados ? TEXTO_LISTA.NENHUM_RESULTADO : `Nenhum ${vocabulario.nomeItem} encerrado encontrado para este filtro.`,
                        )}
                        <Carregando ativo={carregandoEncerradosExibido} />
                    </AreaRelativa>

                    {totalItensEncerradosExibido > 0 && (
                        <Paginacao>
                            <Botao onClick={() => handleAlterarPaginaExibida(paginaEncerradosExibida - 1)} desabilitado={paginaEncerradosExibida <= 1 || carregandoEncerradosExibido}>
                                {TEXTO_LISTA.ANTERIOR}
                            </Botao>
                            <InfoPaginacao>
                                Página {paginaEncerradosExibida} de {totalPaginasEncerradosExibida} · {totalItensEncerradosExibido}{" "}
                                {totalItensEncerradosExibido === 1 ? "item" : "itens"}
                            </InfoPaginacao>
                            <Botao
                                onClick={() => handleAlterarPaginaExibida(paginaEncerradosExibida + 1)}
                                desabilitado={paginaEncerradosExibida >= totalPaginasEncerradosExibida || carregandoEncerradosExibido}
                            >
                                {TEXTO_LISTA.PROXIMA}
                            </Botao>
                        </Paginacao>
                    )}
                </>
            )}
        </Container>
    );
}
