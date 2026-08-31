import { Etiqueta } from "src/components/BasicComponents";
import { BotaoContador, Branches, Contadores, Container, Detalhes, Informacao, LinkExterno, Titulo } from "./styles";
import { CONTADORES, PropriedadesResumoMergeRequest, TEXTO_RESUMO } from "./types";

export function ResumoMergeRequest({ mergeRequest, contagem, situacao, onAlterarSituacao }: PropriedadesResumoMergeRequest) {
    return (
        <Container>
            <Titulo>
                !{mergeRequest.iid} {TEXTO_RESUMO.SEPARADOR} {mergeRequest.titulo}
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
            <LinkExterno href={mergeRequest.url} target="_blank" rel="noreferrer">
                {TEXTO_RESUMO.LINK_GITLAB}
            </LinkExterno>
        </Container>
    );
}
