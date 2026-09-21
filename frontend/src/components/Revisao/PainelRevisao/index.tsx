import { Botao, Carregando } from "src/components/BasicComponents";
import { CartaoComentario } from "src/components/Revisao/CartaoComentario";
import { FiltroComentarios } from "src/components/Revisao/FiltroComentarios";
import { FiltroRevisao } from "src/components/Revisao/FiltroRevisao";
import { ListaMergeRequests } from "src/components/Revisao/ListaMergeRequests";
import { ResumoMergeRequest } from "src/components/Revisao/ResumoMergeRequest";
import { AreaRelativa } from "src/components/sharedStyles";
import { CaixaAviso, CaixaErro, ContadorExibidos, DicaErro, LinhaAcoes, Lista, Pagina, TextoAviso, TextoErro, Vazio } from "./styles";
import { MENSAGEM, PropriedadesPainelRevisao, TEXTO_POR_ESTADO_COPIA } from "./types";
import { usePainelRevisao } from "./usePainelRevisao";

export function PainelRevisao({ configuracao }: PropriedadesPainelRevisao) {
    const {
        vocabulario,
        mensagens,
        projetoId,
        projetoIdCarregado,
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
        handleAlterarProjeto,
        handleAlterarStatus,
        handleAlterarSituacao,
        handleAlterarOrdenacao,
        handleAlterarIntervalo,
        handleSelecionarMergeRequest,
        handleBuscar,
        handleCopiarComentarios,
        setMrIid,
        setRecorte,
        setAtualizacaoAutomatica,
    } = usePainelRevisao(configuracao);

    return (
        <Pagina>
            <ListaMergeRequests configuracao={configuracao} projetoSelecionado={projetoId} mrSelecionado={mrIid} onSelecionar={handleSelecionarMergeRequest} />

            <FiltroRevisao
                vocabulario={vocabulario}
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
                        projetoId={projetoIdCarregado}
                        vocabulario={vocabulario}
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

            {!revisao && !erro && <Vazio>{mensagens.SEM_BUSCA}</Vazio>}

            {revisao && comentarios.length === 0 && <Vazio>{MENSAGEM.SEM_COMENTARIOS}</Vazio>}

            <AreaRelativa>
                <Lista>
                    {comentarios.map((comentario) => (
                        <CartaoComentario key={comentario.id} comentario={comentario} vocabulario={vocabulario} />
                    ))}
                </Lista>
                <Carregando ativo={carregando} />
            </AreaRelativa>
        </Pagina>
    );
}
