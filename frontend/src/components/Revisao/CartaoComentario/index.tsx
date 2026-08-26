import { Etiqueta } from "src/components/BasicComponents";
import { TrechoCodigo } from "src/components/Revisao/TrechoCodigo";
import { FormatarDataHora } from "src/utils/Formatacao";
import {
    Cabecalho,
    CabecalhoResposta,
    Cartao,
    CorpoResposta,
    DataComentario,
    IdentificacaoAutor,
    ItemResposta,
    LinkExterno,
    ListaRespostas,
    Local,
    NomeAutor,
    Rodape,
    Secao,
    TextoComentario,
    TituloBloco,
} from "./styles";
import { PropriedadesCartaoComentario, TEXTO_CARTAO } from "./types";
import { useCartaoComentario } from "./useCartaoComentario";

export function CartaoComentario({ comentario }: PropriedadesCartaoComentario) {
    const { aparencia, dataFormatada, local, temRespostas } = useCartaoComentario(comentario);

    return (
        <Cartao>
            <Cabecalho>
                <IdentificacaoAutor>
                    <NomeAutor>{comentario.autor.nome}</NomeAutor>
                    <DataComentario>{dataFormatada}</DataComentario>
                </IdentificacaoAutor>
                <Etiqueta tom={aparencia.tom}>{aparencia.rotulo}</Etiqueta>
            </Cabecalho>

            <Secao>
                <TituloBloco>{TEXTO_CARTAO.TITULO_COMENTARIO}</TituloBloco>
                <TextoComentario>{comentario.comentario}</TextoComentario>
            </Secao>

            <Secao>
                <TituloBloco>{TEXTO_CARTAO.TITULO_LOCAL}</TituloBloco>
                <Local>{local}</Local>
            </Secao>

            <Secao>
                <TituloBloco>{TEXTO_CARTAO.TITULO_CODIGO}</TituloBloco>
                <TrechoCodigo trecho={comentario.trecho} erro={comentario.erroTrecho} />
            </Secao>

            {temRespostas && (
                <Secao>
                    <TituloBloco>
                        {TEXTO_CARTAO.TITULO_RESPOSTAS} ({comentario.respostas.length})
                    </TituloBloco>
                    <ListaRespostas>
                        {comentario.respostas.map((resposta) => (
                            <ItemResposta key={resposta.id}>
                                <CabecalhoResposta>
                                    {resposta.autor.nome}
                                    {TEXTO_CARTAO.SEPARADOR}
                                    {FormatarDataHora(resposta.criadoEm)}
                                </CabecalhoResposta>
                                <CorpoResposta>{resposta.corpo}</CorpoResposta>
                            </ItemResposta>
                        ))}
                    </ListaRespostas>
                </Secao>
            )}

            <Rodape>
                <LinkExterno href={comentario.url} target="_blank" rel="noreferrer">
                    {TEXTO_CARTAO.LINK_GITLAB}
                </LinkExterno>
            </Rodape>
        </Cartao>
    );
}
