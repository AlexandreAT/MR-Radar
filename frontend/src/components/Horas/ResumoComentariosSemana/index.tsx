import { AlinhamentoDica, DicaHover } from "src/components/BasicComponents";
import { GetMarcadorComentario, MarcadorComentarioDoDia } from "src/utils/ComentarioDoDia";
import { NOME_CURTO_DO_DIA } from "src/utils/DiasUteis";
import { Container, Linha, Marcador, Titulo } from "./styles";
import { PropriedadesResumoComentariosSemana, TEXTO_RESUMO_COMENTARIOS } from "./types";

export function ResumoComentariosSemana({ horasPorDia }: PropriedadesResumoComentariosSemana) {
    return (
        <Container>
            <Titulo>{TEXTO_RESUMO_COMENTARIOS.TITULO}</Titulo>
            <Linha>
                {horasPorDia.map((dia, indice) => {
                    const marcador: MarcadorComentarioDoDia = GetMarcadorComentario(dia);
                    // A fila de dias fica perto da borda esquerda do painel: uma dica centralizada
                    // corta em qualquer um deles, não só no primeiro. Só o último dia alinha pela
                    // direita; todos os outros alinham pela esquerda, que é o lado com espaço sobrando.
                    const alinhamento: AlinhamentoDica = indice === horasPorDia.length - 1 ? AlinhamentoDica.Direita : AlinhamentoDica.Esquerda;

                    return (
                        <DicaHover key={dia.data} texto={marcador.texto} alinhamento={alinhamento}>
                            <Marcador $estado={marcador.estado}>{NOME_CURTO_DO_DIA[dia.dia] ?? dia.dia}</Marcador>
                        </DicaHover>
                    );
                })}
            </Linha>
        </Container>
    );
}
