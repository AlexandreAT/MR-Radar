import { Aro, Sobreposicao, Texto } from "./styles";
import { PropriedadesCarregando } from "./types";

/**
 * Indicador de carregamento central, mas contido: cobre só o bloco em volta dele — que precisa
 * ter position: relative (ver AreaRelativa, em sharedStyles) — nunca a tela inteira. O resto da
 * página continua funcionando normalmente enquanto ele aparece.
 */
export function Carregando({ ativo, texto }: PropriedadesCarregando) {
    if (!ativo)
        return null;

    return (
        <Sobreposicao role="status" aria-live="polite">
            <Aro />
            {texto && <Texto>{texto}</Texto>}
        </Sobreposicao>
    );
}
