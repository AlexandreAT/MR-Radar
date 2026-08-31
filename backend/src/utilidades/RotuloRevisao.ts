import { RotuloRevisao } from "../models/Revisao/types";

/**
 * Rótulo escrito no começo do comentário. O trecho inicial aceita marcações de markdown e
 * marcadores de lista ("- **issue:**", "> nit:") e o complemento entre parênteses usado no
 * padrão de conventional comments ("suggestion (non-blocking):").
 */
const PADRAO_ROTULO = /^[\s>*_`~-]*([a-z]+)[\s*_`~]*(?:\([^)]*\))?[\s*_`~]*:/i;

/** Rótulos aceitos, do jeito que aparecem escritos no comentário. */
const ROTULOS_ACEITOS: string[] = Object.values(RotuloRevisao);

/**
 * Descobre o rótulo de revisão escrito no começo do comentário.
 * @param corpo Texto do comentário como o autor escreveu.
 * @returns Rótulo reconhecido ou nulo quando o comentário não começa com um deles.
 */
export function GetRotuloRevisao(corpo: string | null | undefined): RotuloRevisao | null {
    const correspondencia: RegExpMatchArray | null = (corpo ?? "").match(PADRAO_ROTULO);

    if (!correspondencia)
        return null;

    const escrito: string = correspondencia[1].toLowerCase();

    return ROTULOS_ACEITOS.includes(escrito) ? (escrito as RotuloRevisao) : null;
}
