import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CONFIGURACAO_PADRAO, ConfiguracaoApp, LIMITE, TOKEN_EXEMPLO, VariavelEnv } from "./types";

const RAIZ_BACKEND: string = path.resolve(__dirname, "..", "..");
const RAIZ_PROJETO: string = path.resolve(RAIZ_BACKEND, "..");
const SUFIXO_API_V4 = /\/api\/v4$/i;
const BARRAS_FINAIS = /\/+$/;

/**
 * Carrega o .env do backend e, como alternativa, o da raiz do projeto.
 * @returns Caminhos dos arquivos .env que foram encontrados e lidos.
 */
function carregarArquivosEnv(): string[] {
    const candidatos: string[] = [path.join(RAIZ_BACKEND, ".env"), path.join(RAIZ_PROJETO, ".env")];
    const encontrados: string[] = candidatos.filter((caminho) => fs.existsSync(caminho));

    encontrados.forEach((caminho) => dotenv.config({ path: caminho }));

    return encontrados;
}

/**
 * Lê uma variável de texto do ambiente.
 * @param variavel Nome da variável no .env.
 * @param padrao Valor usado quando a variável está ausente ou vazia.
 * @returns Valor sem espaços nas pontas.
 */
function lerTexto(variavel: VariavelEnv, padrao = ""): string {
    const valor: string | undefined = process.env[variavel];

    return valor?.trim() ? valor.trim() : padrao;
}

/**
 * Lê uma variável numérica do ambiente, mantendo-a dentro dos limites informados.
 * @param variavel Nome da variável no .env.
 * @param padrao Valor usado quando a variável está ausente ou não é um número.
 * @param minimo Menor valor aceito.
 * @param maximo Maior valor aceito.
 * @returns Número já normalizado.
 */
function lerInteiro(variavel: VariavelEnv, padrao: number, minimo: number, maximo: number): number {
    const bruto: string = lerTexto(variavel);
    const convertido: number = Number.parseInt(bruto, 10);
    const valor: number = Number.isFinite(convertido) ? convertido : padrao;

    return Math.min(Math.max(valor, minimo), maximo);
}

/**
 * Normaliza a URL base do GitLab, removendo barras finais e um /api/v4 colado por engano.
 * @param valor URL informada no .env.
 * @returns URL base pronta para uso.
 */
function normalizarUrl(valor: string): string {
    return valor.replace(BARRAS_FINAIS, "").replace(SUFIXO_API_V4, "");
}

/**
 * Lê uma lista separada por vírgulas do ambiente.
 * @param variavel Nome da variável no .env.
 * @returns Itens sem espaços nas pontas e sem itens vazios, em minúsculo.
 */
function lerLista(variavel: VariavelEnv): string[] {
    return lerTexto(variavel)
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter((item) => item !== "");
}

/**
 * Monta a configuração da aplicação a partir do arquivo .env.
 * @returns Configuração completa, com os valores padrão já aplicados.
 */
function GetConfiguracao(): ConfiguracaoApp {
    const arquivosEnvCarregados: string[] = carregarArquivosEnv();

    return {
        urlGitLab: normalizarUrl(lerTexto(VariavelEnv.UrlGitLab)),
        token: lerTexto(VariavelEnv.Token),
        porta: lerInteiro(VariavelEnv.Porta, CONFIGURACAO_PADRAO.PORTA, LIMITE.PORTA_MIN, LIMITE.PORTA_MAX),
        host: lerTexto(VariavelEnv.Host, CONFIGURACAO_PADRAO.HOST),
        linhasContexto: lerInteiro(VariavelEnv.LinhasContexto, CONFIGURACAO_PADRAO.LINHAS_CONTEXTO, 0, LIMITE.LINHAS_CONTEXTO_MAX),
        timeoutRequisicaoMs: lerInteiro(VariavelEnv.TimeoutRequisicao, CONFIGURACAO_PADRAO.TIMEOUT_REQUISICAO_MS, LIMITE.TIMEOUT_MIN_MS, LIMITE.TIMEOUT_MAX_MS),
        maxPaginas: lerInteiro(VariavelEnv.MaxPaginas, CONFIGURACAO_PADRAO.MAX_PAGINAS, 1, LIMITE.MAX_PAGINAS_LIMITE),
        tempoCacheArquivoMs: lerInteiro(VariavelEnv.TempoCacheArquivo, CONFIGURACAO_PADRAO.TEMPO_CACHE_ARQUIVO_MS, 0, Number.MAX_SAFE_INTEGER),
        tamanhoMaxArquivoBytes: LIMITE.TAMANHO_MAX_ARQUIVO_BYTES,
        consultasSimultaneas: LIMITE.CONSULTAS_SIMULTANEAS,
        arquivosEnvCarregados,
        autoresIgnorados: lerLista(VariavelEnv.AutoresIgnorados),
    };
}

/**
 * Verifica se a configuração permite conversar com o GitLab.
 * @param configuracao Configuração montada a partir do .env.
 * @returns Lista de problemas encontrados. Vazia quando está tudo certo.
 */
export function ValidarConfiguracao(configuracao: ConfiguracaoApp): string[] {
    const problemas: string[] = [];

    if (!configuracao.urlGitLab)
        problemas.push(`A variável ${VariavelEnv.UrlGitLab} não foi definida no arquivo .env.`);
    else if (!ehUrlValida(configuracao.urlGitLab))
        problemas.push(`A variável ${VariavelEnv.UrlGitLab} precisa ser uma URL http ou https válida.`);

    if (!configuracao.token)
        problemas.push(`A variável ${VariavelEnv.Token} não foi definida no arquivo .env.`);
    else if (configuracao.token === TOKEN_EXEMPLO)
        problemas.push(`A variável ${VariavelEnv.Token} ainda está com o valor de exemplo. Informe o seu token pessoal.`);

    return problemas;
}

/**
 * Indica se o texto é uma URL http ou https válida.
 * @param valor Texto a validar.
 * @returns Verdadeiro quando a URL é aceita.
 */
function ehUrlValida(valor: string): boolean {
    try {
        const url = new URL(valor);

        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

export const configuracao: ConfiguracaoApp = GetConfiguracao();
