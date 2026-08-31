import { Botao } from "src/components/BasicComponents";
import { CartaoComentario } from "src/components/Revisao/CartaoComentario";
import { FiltroComentarios } from "src/components/Revisao/FiltroComentarios";
import { FiltroRevisao } from "src/components/Revisao/FiltroRevisao";
import { ListaMergeRequests } from "src/components/Revisao/ListaMergeRequests";
import { ResumoMergeRequest } from "src/components/Revisao/ResumoMergeRequest";
import { CaixaAviso, CaixaErro, ContadorExibidos, DicaErro, LinhaAcoes, Lista, Pagina, TextoAviso, TextoErro, Vazio } from "./styles";
import { MENSAGEM, PropriedadesPainelRevisao, TEXTO_POR_ESTADO_COPIA } from "./types";
import { usePainelRevisao } from "./usePainelRevisao";

export function PainelRevisao({ configuracao }: PropriedadesPainelRevisao) {
    const {
        projetoId,
        mrIid,
        status,
        situacao,
        ordenacao,
        recorte,
        atualizacaoAutomatica,
        intervaloSegundos,
        revisao,
        carregando,
        erro,
        ultimaAtualizacao,
        temResultado,
        comentarios,
        textoContador,
        estadoCopia,
        escopo,
        meusMergeRequests,
        listaTruncada,
        carregandoLista,
        erroLista,
        handleAlterarProjeto,
        handleAlterarStatus,
        handleAlterarSituacao,
        handleAlterarOrdenacao,
        handleAlterarIntervalo,
        handleAlterarEscopo,
        handleAtualizarLista,
        handleSelecionarMergeRequest,
        handleBuscar,
        handleCopiarComentarios,
        setMrIid,
        setRecorte,
        setAtualizacaoAutomatica,
    } = usePainelRevisao(configuracao);

    return (
        <Pagina>
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
                <>
                    <ResumoMergeRequest
                        mergeRequest={revisao.mergeRequest}
                        contagem={revisao.contagem}
                        situacao={situacao}
                        onAlterarSituacao={handleAlterarSituacao}
                    />
                    <FiltroComentarios
                        comentarios={revisao.comentarios}
                        ordenacao={ordenacao}
                        recorte={recorte}
                        onAlterarOrdenacao={handleAlterarOrdenacao}
                        onAlterarRecorte={setRecorte}
                    />
                </>
            )}

            {comentarios.length > 0 && (
                <LinhaAcoes>
                    <ContadorExibidos>{textoContador}</ContadorExibidos>
                    <Botao onClick={handleCopiarComentarios}>{TEXTO_POR_ESTADO_COPIA[estadoCopia]}</Botao>
                </LinhaAcoes>
            )}

            {revisao?.paginacaoTruncada && (
                <CaixaAviso>
                    <TextoAviso>{MENSAGEM.PAGINACAO_TRUNCADA}</TextoAviso>
                </CaixaAviso>
            )}

            {!revisao && !erro && <Vazio>{MENSAGEM.SEM_BUSCA}</Vazio>}

            {revisao && comentarios.length === 0 && <Vazio>{MENSAGEM.SEM_COMENTARIOS}</Vazio>}

            <Lista>
                {comentarios.map((comentario) => (
                    <CartaoComentario key={comentario.id} comentario={comentario} />
                ))}
            </Lista>
        </Pagina>
    );
}
