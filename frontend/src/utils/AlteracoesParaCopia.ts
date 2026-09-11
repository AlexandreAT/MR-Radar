import { ArquivoAlterado, LinhaDiff, TipoLinhaDiff } from "src/api/Revisao/types";

/** Linhas em branco entre um arquivo e o próximo no texto copiado. */
const SEPARADOR_ENTRE_ARQUIVOS = "\n\n\n";

/** Marcador de cada tipo de linha do diff, no mesmo formato que o GitLab e o GitHub usam. */
const MARCADOR_POR_TIPO: Record<TipoLinhaDiff, string> = {
    [TipoLinhaDiff.Adicionada]: "+",
    [TipoLinhaDiff.Removida]: "-",
    [TipoLinhaDiff.Contexto]: " ",
};

/**
 * Descobre o rótulo do bloco de código: "removido" só quando o arquivo não tem nenhuma linha
 * adicionada (arquivo inteiro removido, ou um modificado que só removeu código); caso contrário
 * "feito", que cobre tanto arquivo novo quanto alteração comum.
 * @param linhas Linhas já carregadas do diff.
 * @returns "feito" ou "removido".
 */
function getRotuloCodigo(linhas: LinhaDiff[]): string {
    return linhas.some((linha) => linha.tipo === TipoLinhaDiff.Adicionada) ? "feito" : "removido";
}

/**
 * Monta o texto de um arquivo alterado no formato pronto para colar em outro lugar.
 * @param arquivo Arquivo alterado já carregado.
 * @returns Bloco com o caminho do arquivo e o código (ou o motivo de estar indisponível).
 */
function FormatarArquivo(arquivo: ArquivoAlterado): string {
    const cabecalho = `Arquivo: "${arquivo.caminho}"`;

    if (!arquivo.linhas)
        return [cabecalho, `Código: ${arquivo.motivoIndisponivel}`].join("\n");

    const codigo: string = arquivo.linhas.map((linha) => MARCADOR_POR_TIPO[linha.tipo] + linha.texto).join("\n");

    return [cabecalho, `Código ${getRotuloCodigo(arquivo.linhas)}:`, "```" + arquivo.linguagem, codigo, "```"].join("\n");
}

/**
 * Monta o texto de todos os arquivos selecionados, prontos para colar em outro lugar (Ctrl+V).
 * @param arquivos Arquivos a incluir, na ordem em que devem aparecer no texto.
 * @returns Um bloco por arquivo, separado por linhas em branco.
 */
export function FormatarAlteracoesParaCopia(arquivos: ArquivoAlterado[]): string {
    return arquivos.map(FormatarArquivo).join(SEPARADOR_ENTRE_ARQUIVOS);
}
