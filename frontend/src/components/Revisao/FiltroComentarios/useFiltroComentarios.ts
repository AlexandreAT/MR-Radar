import { useMemo } from "react";
import { ComentarioRevisao } from "src/api/Revisao/types";
import { GrupoOpcoes } from "src/components/BasicComponents";
import { GetRevisores, GetRotulosPresentes, MontarRecorte, TEXTO_POR_ROTULO, TipoRecorte } from "src/utils/ComentariosRevisao";
import { TEXTO_FILTRO_COMENTARIOS } from "./types";

/**
 * Monta as opções de rótulo e de revisor a partir dos comentários já carregados.
 * @param comentarios Comentários carregados do Merge Request, antes de qualquer filtro.
 * @returns Grupos de opções do campo de rótulo ou revisor, sem os grupos vazios.
 */
export function useFiltroComentarios(comentarios: ComentarioRevisao[]) {
    const grupos: GrupoOpcoes[] = useMemo(() => {
        const porRotulo: GrupoOpcoes = {
            rotulo: TEXTO_FILTRO_COMENTARIOS.GRUPO_ROTULOS,
            opcoes: GetRotulosPresentes(comentarios).map((rotulo) => ({
                valor: MontarRecorte(TipoRecorte.Rotulo, rotulo),
                rotulo: TEXTO_POR_ROTULO[rotulo],
            })),
        };

        const porRevisor: GrupoOpcoes = {
            rotulo: TEXTO_FILTRO_COMENTARIOS.GRUPO_REVISORES,
            opcoes: GetRevisores(comentarios).map((autor) => ({
                valor: MontarRecorte(TipoRecorte.Revisor, autor.usuario),
                rotulo: autor.nome,
            })),
        };

        return [porRotulo, porRevisor].filter((grupo) => grupo.opcoes.length > 0);
    }, [comentarios]);

    return { grupos };
}
