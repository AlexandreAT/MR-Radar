import { LinhaDiff, TipoLinhaDiff } from "../models/Revisao/types";

/** Reconhece o cabeçalho de um bloco (hunk) de diff unificado: "@@ -linhaAntiga,tamanho +linhaNova,tamanho @@". */
const CABECALHO_HUNK = /^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/;

/**
 * Interpreta um diff unificado (o mesmo formato usado no campo "diff" do GitLab e "patch" do
 * GitHub) em linhas com a numeração de cada lado, para exibir e copiar como no GitLab/GitHub.
 *
 * O texto já vem recortado pelo provedor nos blocos em volta de cada alteração — esta função não
 * tenta reconstruir o arquivo inteiro, só interpreta o que veio. Corta cedo (devolve nulo) assim
 * que o total de linhas passa de maxLinhas, sem terminar de processar um diff enorme só para
 * descartá-lo depois: é a proteção de CPU para arquivos de diff muito grandes.
 * @param diffTexto Texto do diff de um único arquivo, começando em uma linha "@@".
 * @param maxLinhas Quantidade máxima de linhas de diff aceitas para este arquivo.
 * @returns Linhas do diff, ou nulo quando o texto é vazio ou passa do limite.
 */
export function InterpretarDiffUnificado(diffTexto: string, maxLinhas: number): LinhaDiff[] | null {
    if (!diffTexto)
        return null;

    const linhas: LinhaDiff[] = [];
    let numeroAntigo = 0;
    let numeroNovo = 0;

    for (const linhaBruta of diffTexto.split("\n")) {
        const hunk: RegExpMatchArray | null = linhaBruta.match(CABECALHO_HUNK);

        if (hunk) {
            numeroAntigo = Number.parseInt(hunk[1], 10);
            numeroNovo = Number.parseInt(hunk[2], 10);
            continue;
        }

        // "\ No newline at end of file" não é conteúdo de linha nenhuma: não conta e não numera.
        // Uma linha vazia de verdade só aparece como artefato do "\n" final do texto (toda linha
        // real do diff tem ao menos o marcador de 1 caractere) — também é ignorada, sem numerar.
        if (linhaBruta.length === 0 || linhaBruta.startsWith("\\"))
            continue;

        const marcador: string = linhaBruta.charAt(0);
        const texto: string = linhaBruta.slice(1);

        if (marcador === "+") {
            linhas.push({ tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo, texto });
            numeroNovo += 1;
        } else if (marcador === "-") {
            linhas.push({ tipo: TipoLinhaDiff.Removida, numeroAntigo, numeroNovo: null, texto });
            numeroAntigo += 1;
        } else {
            linhas.push({ tipo: TipoLinhaDiff.Contexto, numeroAntigo, numeroNovo, texto });
            numeroAntigo += 1;
            numeroNovo += 1;
        }

        if (linhas.length > maxLinhas)
            return null;
    }

    return linhas;
}
