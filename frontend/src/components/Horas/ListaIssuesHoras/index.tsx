import { NivelElegibilidade } from "src/api/Horas/types";
import { Etiqueta } from "src/components/BasicComponents";
import { FormatarDataHora, FormatarHoras } from "src/utils/Formatacao";
import {
    Aviso,
    Container,
    Detalhes,
    Horas,
    HorasNaSemana,
    HorasTotais,
    Informacao,
    Item,
    LinhaTitulo,
    Lista,
    MarcadorElegibilidade,
    Referencia,
    Titulo,
    TituloItem,
} from "./styles";
import { ESTADO_FECHADO, PropriedadesListaIssuesHoras, ROTULO_FECHADO, TEXTO_LISTA_ISSUES, TEXTO_POR_ELEGIBILIDADE } from "./types";

export function ListaIssuesHoras({ issues }: PropriedadesListaIssuesHoras) {
    return (
        <Container>
            <Titulo>{TEXTO_LISTA_ISSUES.TITULO}</Titulo>

            {issues.length === 0 ? (
                <Aviso>{TEXTO_LISTA_ISSUES.VAZIA}</Aviso>
            ) : (
                <Lista>
                    {issues.map((issue) => (
                        <Item key={`${issue.projetoId}-${issue.iid}`} href={issue.url} target="_blank" rel="noreferrer">
                            <LinhaTitulo>
                                <TituloItem>{issue.titulo}</TituloItem>
                                <Horas>
                                    {issue.estado === ESTADO_FECHADO && <Etiqueta>{ROTULO_FECHADO}</Etiqueta>}
                                    {issue.elegibilidade !== NivelElegibilidade.SemCommit && (
                                        <MarcadorElegibilidade $nivel={issue.elegibilidade} title={TEXTO_POR_ELEGIBILIDADE[issue.elegibilidade]} />
                                    )}
                                    <HorasNaSemana $temHoras={issue.horasNaSemana > 0}>
                                        {FormatarHoras(issue.horasNaSemana)} {TEXTO_LISTA_ISSUES.NA_SEMANA}
                                    </HorasNaSemana>
                                    <HorasTotais>
                                        {FormatarHoras(issue.horasTotais)} {TEXTO_LISTA_ISSUES.TOTAL}
                                    </HorasTotais>
                                </Horas>
                            </LinhaTitulo>
                            <Detalhes>
                                <Referencia>
                                    {issue.caminhoProjeto}#{issue.iid}
                                </Referencia>
                                <Informacao>
                                    {TEXTO_LISTA_ISSUES.ATUALIZADO_EM} {FormatarDataHora(issue.atualizadoEm)}
                                </Informacao>
                            </Detalhes>
                        </Item>
                    ))}
                </Lista>
            )}
        </Container>
    );
}
