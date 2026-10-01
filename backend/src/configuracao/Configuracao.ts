import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { CodigoErroProvedor, ErroProvedor } from "../integracao/ErroProvedor";
import { StatusHttp } from "../utilidades/types";
import { CONFIGURACAO_PADRAO, ConfiguracaoApp, DOMINIO_EXEMPLO, LIMITE, Provedor, TOKEN_EXEMPLO, VariavelEnv } from "./types";

const RAIZ_BACKEND: string = path.resolve(__dirname, "..", "..");
const RAIZ_PROJETO: string = path.resolve(RAIZ_BACKEND, "..");
const SUFIXO_API_GITLAB = /\/api\/v4$/i;
const SUFIXO_API_GITHUB = /\/api\/v3$/i;
const BARRAS_FINAIS = /\/+$/;

/** Caminho da API v3, usado pelo GitHub Enterprise Server (o github.com público não usa). */
const CAMINHO_API_GITHUB_ENTERPRISE = "/api/v3";

/** Nome exibido de cada provedor, usado nas mensagens de configuração. */
const NOME_DO_PROVEDOR: Record<Provedor, string> = {
    [Provedor.GitLab]: "GitLab",
    [Provedor.GitHub]: "GitHub",
    [Provedor.Demo]: "Demo",
};

/**
 * Variável que guarda o token de cada provedor. A entrada de Demo nunca é lida de verdade —
 * `ValidarConfiguracao` sai antes de chegar nela, porque o modo demo não exige token nenhum — ela
 * só existe para satisfazer o tipo `Record<Provedor, VariavelEnv>`.
 */
const VARIAVEL_DO_TOKEN: Record<Provedor, VariavelEnv> = {
    [Provedor.GitLab]: VariavelEnv.TokenGitLab,
    [Provedor.GitHub]: VariavelEnv.TokenGitHub,
    [Provedor.Demo]: VariavelEnv.Provedor,
};

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
 * Lê qual provedor o dashboard deve consultar.
 * @returns Provedor escolhido no .env, ou o GitLab quando nada for informado.
 */
function lerProvedor(): Provedor {
    const valor: string = lerTexto(VariavelEnv.Provedor).toLowerCase();
    const provedoresValidos: string[] = Object.values(Provedor);

    return provedoresValidos.includes(valor) ? (valor as Provedor) : CONFIGURACAO_PADRAO.PROVEDOR;
}

/**
 * Monta a URL base da API do provedor ativo, a partir do que está no .env.
 * @param provedor Provedor ativo.
 * @returns URL base já pronta para receber os caminhos da API, sem barra no final. Vazia no modo
 * demo, que não fala com nenhuma API real — o cabeçalho então não mostra endereço nenhum.
 */
function getUrlBase(provedor: Provedor): string {
    if (provedor === Provedor.Demo)
        return "";

    if (provedor === Provedor.GitLab)
        return lerTexto(VariavelEnv.UrlGitLab).replace(BARRAS_FINAIS, "").replace(SUFIXO_API_GITLAB, "");

    const informada: string = lerTexto(VariavelEnv.UrlGitHub).replace(BARRAS_FINAIS, "").replace(SUFIXO_API_GITHUB, "");

    // Sem URL informada é o github.com público. Qualquer outro endereço é GitHub Enterprise
    // Server, que serve a API no /api/v3 — diferente do público, que já responde na raiz.
    if (!informada)
        return CONFIGURACAO_PADRAO.URL_GITHUB_PUBLICO;

    return informada === CONFIGURACAO_PADRAO.URL_GITHUB_PUBLICO ? informada : informada + CAMINHO_API_GITHUB_ENTERPRISE;
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
 * Monta a configuração da aplicação a partir do arquivo .env. Só é chamada por quem sobe o
 * servidor de verdade: importar este módulo não lê .env nenhum — é o que garante que o script de
 * geração de fixtures da demo nunca tenha token nem URL real em memória.
 * @returns Configuração completa, com os valores padrão já aplicados.
 */
export function GetConfiguracao(): ConfiguracaoApp {
    const arquivosEnvCarregados: string[] = carregarArquivosEnv();
    const provedor: Provedor = lerProvedor();

    return {
        provedor,
        urlBase: getUrlBase(provedor),
        // O modo demo não usa token nenhum — fica vazio de propósito, em vez de ler alguma
        // variável de verdade (a entrada de Demo em VARIAVEL_DO_TOKEN nunca é lida por aqui).
        token: provedor === Provedor.Demo ? "" : lerTexto(VARIAVEL_DO_TOKEN[provedor]),
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
 * Verifica se a configuração permite conversar com o provedor ativo.
 * @param configuracao Configuração montada a partir do .env.
 * @returns Lista de problemas encontrados. Vazia quando está tudo certo.
 */
export function ValidarConfiguracao(configuracao: ConfiguracaoApp): string[] {
    // O modo demo não fala com nenhum provedor real: não exige token nem URL nenhuma.
    if (configuracao.provedor === Provedor.Demo)
        return [];

    const problemas: string[] = [];
    const variavelDoToken: VariavelEnv = VARIAVEL_DO_TOKEN[configuracao.provedor];

    // A URL só é obrigatória no GitLab: no GitHub, sem URL informada o padrão é o github.com público.
    if (configuracao.provedor === Provedor.GitLab && !configuracao.urlBase)
        problemas.push(`A variável ${VariavelEnv.UrlGitLab} não foi definida no arquivo .env.`);
    else if (!ehUrlValida(configuracao.urlBase))
        problemas.push(`A URL do ${NOME_DO_PROVEDOR[configuracao.provedor]} precisa ser uma URL http ou https válida.`);
    else if (ehUrlDeExemplo(configuracao.urlBase))
        problemas.push(`A URL do ${NOME_DO_PROVEDOR[configuracao.provedor]} ainda está com o valor de exemplo. Informe o endereço da sua instância.`);

    if (!configuracao.token)
        problemas.push(`A variável ${variavelDoToken} não foi definida no arquivo .env.`);
    else if (configuracao.token === TOKEN_EXEMPLO)
        problemas.push(`A variável ${variavelDoToken} ainda está com o valor de exemplo. Informe o seu token pessoal.`);

    return problemas;
}

/**
 * Interrompe a consulta quando o arquivo .env não está completo.
 * @param configuracao Configuração da aplicação.
 * @returns Nada.
 */
export function GarantirConfiguracaoValida(configuracao: ConfiguracaoApp): void {
    const problemas: string[] = ValidarConfiguracao(configuracao);

    if (!problemas.length)
        return;

    const mensagem = `O backend ainda não está configurado para acessar o ${NOME_DO_PROVEDOR[configuracao.provedor]}.`;

    throw new ErroProvedor(CodigoErroProvedor.ConfiguracaoInvalida, mensagem, StatusHttp.ErroInterno, problemas.join(" "));
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

/**
 * Indica se a URL ainda aponta para o domínio de exemplo do .env.example.
 * @param valor URL já validada por `ehUrlValida`.
 * @returns Verdadeiro quando o endereço é o de exemplo, e não uma instância real.
 */
function ehUrlDeExemplo(valor: string): boolean {
    const host: string = new URL(valor).hostname.toLowerCase();

    return host === DOMINIO_EXEMPLO || host.endsWith(`.${DOMINIO_EXEMPLO}`);
}
