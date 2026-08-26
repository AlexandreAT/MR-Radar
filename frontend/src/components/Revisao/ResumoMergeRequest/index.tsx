import { Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import { BotaoContador, Branches, Contadores, Container, Detalhes, Informacao, LinkExterno, Titulo } from "./styles";
import { PropriedadesResumoMergeRequest, TEXTO_RESUMO } from "./types";

export function ResumoMergeRequest({ mergeRequest, contagem, mostrarGerais, podeAlternarGerais, onAlternarGerais }: PropriedadesResumoMergeRequest) {
    const etiquetaGerais = (
        <Etiqueta>
            {contagem.naoResolviveis} {TEXTO_RESUMO.GERAIS}
            {podeAlternarGerais && ` ${mostrarGerais ? TEXTO_RESUMO.SETA_ABERTA : TEXTO_RESUMO.SETA_FECHADA}`}
        </Etiqueta>
    );

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
                <Etiqueta tom={TomEtiqueta.Aberto}>
                    {contagem.abertos} {TEXTO_RESUMO.ABERTOS}
                </Etiqueta>
                <Etiqueta tom={TomEtiqueta.Resolvido}>
                    {contagem.resolvidos} {TEXTO_RESUMO.RESOLVIDOS}
                </Etiqueta>
                {podeAlternarGerais ? (
                    <BotaoContador type="button" onClick={onAlternarGerais}>
                        {etiquetaGerais}
                    </BotaoContador>
                ) : (
                    etiquetaGerais
                )}
                <Etiqueta>
                    {contagem.total} {TEXTO_RESUMO.TOTAL}
                </Etiqueta>
            </Contadores>
            <LinkExterno href={mergeRequest.url} target="_blank" rel="noreferrer">
                {TEXTO_RESUMO.LINK_GITLAB}
            </LinkExterno>
        </Container>
    );
}
