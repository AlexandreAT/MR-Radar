import { Etiqueta } from "src/components/BasicComponents";
import { ModalAlteracoes } from "src/components/Revisao/ModalAlteracoes";
import { BotaoAbrirModal, BotaoContador, Branches, Contadores, Container, Detalhes, Informacao, Titulo } from "./styles";
import { CONTADORES, PropriedadesResumoMergeRequest, TEXTO_RESUMO } from "./types";
import { useResumoMergeRequest } from "./useResumoMergeRequest";

export function ResumoMergeRequest({ projetoId, vocabulario, mergeRequest, contagem, situacao, onAlterarSituacao }: PropriedadesResumoMergeRequest) {
    const { modalAberto, handleAbrirModal, handleFecharModal } = useResumoMergeRequest();

    return (
        <Container>
            <Titulo>
                {vocabulario.prefixoReferencia}
                {mergeRequest.iid} {TEXTO_RESUMO.SEPARADOR} {mergeRequest.titulo}
            </Titulo>
            <Detalhes>
                <Informacao>{mergeRequest.autor.nome}</Informacao>
                <Informacao>{mergeRequest.situacao}</Informacao>
                <Branches>
                    {mergeRequest.branchOrigem} {TEXTO_RESUMO.SETA} {mergeRequest.branchDestino}
                </Branches>
            </Detalhes>
            <Contadores>
                {CONTADORES.map((contador) => (
                    <BotaoContador key={contador.chave} type="button" onClick={() => onAlterarSituacao(contador.situacao)}>
                        <Etiqueta tom={contador.tom} selecionada={situacao === contador.situacao}>
                            {contagem[contador.chave]} {contador.texto}
                        </Etiqueta>
                    </BotaoContador>
                ))}
            </Contadores>
            <BotaoAbrirModal type="button" onClick={handleAbrirModal}>
                Abrir o {vocabulario.nomeItem}
            </BotaoAbrirModal>

            {modalAberto && <ModalAlteracoes projetoId={projetoId} mergeRequest={mergeRequest} vocabulario={vocabulario} onFechar={handleFecharModal} />}
        </Container>
    );
}
