import { Botao, Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { CartaoComentario } from "src/components/Revisao/CartaoComentario";
import { FiltroRevisao } from "src/components/Revisao/FiltroRevisao";
import { ListaMergeRequests } from "src/components/Revisao/ListaMergeRequests";
import { ResumoMergeRequest } from "src/components/Revisao/ResumoMergeRequest";
import { TituloBloco } from "src/components/Revisao/sharedStyles";
import {
    BlocoTitulo,
    Cabecalho,
    CaixaAviso,
    CaixaErro,
    DicaErro,
    EnderecoGitLab,
    LinhaAcoes,
    Lista,
    Pagina,
    Subtitulo,
    TextoAviso,
    TextoErro,
    Titulo,
    Vazio,
} from "./styles";
import { MENSAGEM, TEXTO_POR_ESTADO_COPIA } from "./types";
import { usePainelRevisao } from "./usePainelRevisao";

export function PainelRevisao() {
    const {
        configuracao,
        projetoId,
        mrIid,
        status,
        atualizacaoAutomatica,
        intervaloSegundos,
        revisao,
        carregando,
        erro,
        ultimaAtualizacao,
        temResultado,
        comentariosPrincipais,
        comentariosGerais,
        mostrarGerais,
        estadoCopia,
        escopo,
        meusMergeRequests,
        listaTruncada,
        carregandoLista,
        erroLista,
        handleAlterarProjeto,
        handleAlterarStatus,
        handleAlterarIntervalo,
        handleAlterarEscopo,
        handleAtualizarLista,
        handleSelecionarMergeRequest,
        handleBuscar,
        handleAlternarGerais,
        handleCopiarComentarios,
        setMrIid,
        setAtualizacaoAutomatica,
    } = usePainelRevisao();

    return (
        <Pagina>
            <Cabecalho>
                <BlocoTitulo>
                    <Titulo>{MENSAGEM.TITULO}</Titulo>
                    <Subtitulo>{MENSAGEM.SUBTITULO}</Subtitulo>
                </BlocoTitulo>
                <Etiqueta tom={TomEtiqueta.Resolvido}>{MENSAGEM.ETIQUETA_SOMENTE_LEITURA}</Etiqueta>
            </Cabecalho>

            {configuracao?.urlGitLab && <EnderecoGitLab>{configuracao.urlGitLab}</EnderecoGitLab>}

            {configuracao && configuracao.problemas.length > 0 && (
                <CaixaAviso>
                    <TextoAviso>{MENSAGEM.BACKEND_NAO_CONFIGURADO}</TextoAviso>
                    {configuracao.problemas.map((problema) => (
                        <TextoAviso key={problema}>{problema}</TextoAviso>
                    ))}
                </CaixaAviso>
            )}

            {erroLista && (
                <CaixaErro>
                    <TextoErro>{erroLista.mensagem}</TextoErro>
                    {erroLista.dica && <DicaErro>{erroLista.dica}</DicaErro>}
                </CaixaErro>
            )}

            <ListaMergeRequests
                mergeRequests={meusMergeRequests}
                escopo={escopo}
                carregando={carregandoLista}
                paginacaoTruncada={listaTruncada}
                projetoSelecionado={projetoId}
                mrSelecionado={mrIid}
                onAlterarEscopo={handleAlterarEscopo}
                onSelecionar={handleSelecionarMergeRequest}
                onAtualizar={handleAtualizarLista}
            />

            <FiltroRevisao
                projetoId={projetoId}
                mrIid={mrIid}
                status={status}
                atualizacaoAutomatica={atualizacaoAutomatica}
                intervaloSegundos={intervaloSegundos}
                carregando={carregando}
                temResultado={temResultado}
                ultimaAtualizacao={ultimaAtualizacao}
                onAlterarProjeto={handleAlterarProjeto}
                onAlterarMrIid={setMrIid}
                onAlterarStatus={handleAlterarStatus}
                onAlterarAtualizacaoAutomatica={setAtualizacaoAutomatica}
                onAlterarIntervalo={handleAlterarIntervalo}
                onBuscar={handleBuscar}
            />

            {erro && (
                <CaixaErro>
                    <TextoErro>{erro.mensagem}</TextoErro>
                    {erro.dica && <DicaErro>{erro.dica}</DicaErro>}
                </CaixaErro>
            )}

            {revisao && (
                <ResumoMergeRequest
                    mergeRequest={revisao.mergeRequest}
                    contagem={revisao.contagem}
                    mostrarGerais={mostrarGerais}
                    podeAlternarGerais={comentariosGerais.length > 0}
                    onAlternarGerais={handleAlternarGerais}
                />
            )}

            {revisao && (comentariosPrincipais.length > 0 || comentariosGerais.length > 0) && (
                <LinhaAcoes>
                    <Botao onClick={handleCopiarComentarios}>{TEXTO_POR_ESTADO_COPIA[estadoCopia]}</Botao>
                </LinhaAcoes>
            )}

            {revisao?.paginacaoTruncada && (
                <CaixaAviso>
                    <TextoAviso>{MENSAGEM.PAGINACAO_TRUNCADA}</TextoAviso>
                </CaixaAviso>
            )}

            {!revisao && !erro && <Vazio>{MENSAGEM.SEM_BUSCA}</Vazio>}

            {revisao && comentariosPrincipais.length === 0 && <Vazio>{MENSAGEM.SEM_COMENTARIOS}</Vazio>}

            <Lista>
                {comentariosPrincipais.map((comentario) => (
                    <CartaoComentario key={comentario.id} comentario={comentario} />
                ))}
            </Lista>

            {mostrarGerais && comentariosGerais.length > 0 && (
                <>
                    <TituloBloco>{MENSAGEM.TITULO_GERAIS}</TituloBloco>
                    <Lista>
                        {comentariosGerais.map((comentario) => (
                            <CartaoComentario key={comentario.id} comentario={comentario} />
                        ))}
                    </Lista>
                </>
            )}
        </Pagina>
    );
}
