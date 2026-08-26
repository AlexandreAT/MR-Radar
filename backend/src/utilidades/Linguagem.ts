/** Linguagem usada quando a extensão do arquivo não é reconhecida. */
export const LINGUAGEM_PADRAO = "text";

/** Linguagem correspondente a cada extensão de arquivo. */
const LINGUAGEM_POR_EXTENSAO: Record<string, string> = {
    cs: "csharp",
    csx: "csharp",
    cshtml: "razor",
    razor: "razor",
    vb: "vbnet",
    fs: "fsharp",
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    vue: "vue",
    svelte: "svelte",
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    php: "php",
    c: "c",
    h: "c",
    cpp: "cpp",
    hpp: "cpp",
    scala: "scala",
    dart: "dart",
    sql: "sql",
    json: "json",
    xml: "xml",
    csproj: "xml",
    config: "xml",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    less: "less",
    md: "markdown",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    ini: "ini",
    sh: "bash",
    ps1: "powershell",
    bat: "batch",
    cmd: "batch",
    tf: "terraform",
    gradle: "groovy",
};

/** Linguagem correspondente a arquivos sem extensão. */
const LINGUAGEM_POR_NOME: Record<string, string> = {
    dockerfile: "dockerfile",
    makefile: "makefile",
};

/**
 * Descobre a linguagem de um arquivo a partir do seu nome.
 * @param caminhoArquivo Caminho do arquivo dentro do repositório.
 * @returns Nome da linguagem ou "text" quando não for possível identificar.
 */
export function GetLinguagem(caminhoArquivo: string | null): string {
    if (!caminhoArquivo)
        return LINGUAGEM_PADRAO;

    const nomeArquivo: string = caminhoArquivo.split("/").pop()?.toLowerCase() ?? "";

    if (LINGUAGEM_POR_NOME[nomeArquivo])
        return LINGUAGEM_POR_NOME[nomeArquivo];

    const posicaoPonto: number = nomeArquivo.lastIndexOf(".");

    if (posicaoPonto <= 0 || posicaoPonto === nomeArquivo.length - 1)
        return LINGUAGEM_PADRAO;

    return LINGUAGEM_POR_EXTENSAO[nomeArquivo.slice(posicaoPonto + 1)] ?? LINGUAGEM_PADRAO;
}
