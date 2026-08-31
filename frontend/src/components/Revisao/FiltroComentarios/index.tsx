import { CampoSelecao } from "src/components/BasicComponents";
import { Container } from "./styles";
import { LARGURA_CAMPO, OPCOES_ORDENACAO, OPCOES_RECORTE, PropriedadesFiltroComentarios, TEXTO_FILTRO_COMENTARIOS } from "./types";
import { useFiltroComentarios } from "./useFiltroComentarios";

export function FiltroComentarios({ comentarios, ordenacao, recorte, onAlterarOrdenacao, onAlterarRecorte }: PropriedadesFiltroComentarios) {
    const { grupos } = useFiltroComentarios(comentarios);

    return (
        <Container>
            <CampoSelecao
                rotulo={TEXTO_FILTRO_COMENTARIOS.ROTULO_ORDENACAO}
                valor={ordenacao}
                opcoes={OPCOES_ORDENACAO}
                onChange={onAlterarOrdenacao}
                largura={LARGURA_CAMPO.ORDENACAO}
            />
            <CampoSelecao
                rotulo={TEXTO_FILTRO_COMENTARIOS.ROTULO_RECORTE}
                valor={recorte}
                opcoes={OPCOES_RECORTE}
                grupos={grupos}
                onChange={onAlterarRecorte}
                largura={LARGURA_CAMPO.RECORTE}
            />
        </Container>
    );
}
