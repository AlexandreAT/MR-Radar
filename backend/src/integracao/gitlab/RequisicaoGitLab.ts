import http, { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";
import https from "https";
import { ErroGitLab } from "./ErroGitLab";
import { API_GITLAB, CabecalhoGitLab, CodigoErroGitLab } from "./types";

const STATUS_REDIRECIONAMENTO: number[] = [301, 302, 303, 307, 308];

/** Resposta bruta de uma chamada HTTP. */
export interface RespostaHttp {
    status: number;
    cabecalhos: IncomingHttpHeaders;
    corpo: Buffer;
}

/** Parâmetros aceitos por ExecutarGet. */
export interface OpcoesRequisicao {
    cabecalhos: OutgoingHttpHeaders;
    timeoutMs: number;
    redirecionamentosRestantes?: number;
}

/** Mensagens de orientação por código de erro de rede do Node. */
const DICA_POR_ERRO_DE_REDE: Record<string, string> = {
    ENOTFOUND: "Host não encontrado. Confira a variável GITLAB_URL e sua conexão de rede (VPN, se for o caso).",
    ECONNREFUSED: "A conexão foi recusada pelo servidor. Confira a URL e a porta configuradas.",
    ETIMEDOUT: "O servidor não respondeu a tempo. Confira sua conexão de rede.",
    EAI_AGAIN: "Houve uma falha temporária de DNS. Confira sua conexão de rede.",
    CERT_HAS_EXPIRED: "O certificado do servidor GitLab está expirado.",
    DEPTH_ZERO_SELF_SIGNED_CERT: "O certificado é autoassinado. Aponte NODE_EXTRA_CA_CERTS para o certificado correto, conforme o README.",
    SELF_SIGNED_CERT_IN_CHAIN: "Há um certificado autoassinado na cadeia. Aponte NODE_EXTRA_CA_CERTS para o certificado correto, conforme o README.",
    UNABLE_TO_VERIFY_LEAF_SIGNATURE: "Não foi possível validar a cadeia de certificados. Aponte NODE_EXTRA_CA_CERTS para o certificado correto, conforme o README.",
};

/**
 * Remove cabeçalhos de autenticação para que o token nunca vá para outra origem.
 * @param cabecalhos Cabeçalhos originais da requisição.
 * @returns Cópia dos cabeçalhos sem o token.
 */
function removerToken(cabecalhos: OutgoingHttpHeaders): OutgoingHttpHeaders {
    const copia: OutgoingHttpHeaders = { ...cabecalhos };
    delete copia[CabecalhoGitLab.Token];
    delete copia.authorization;

    return copia;
}

/**
 * Converte um erro de rede do Node em um erro com mensagem clara para o usuário.
 * @param erro Erro original lançado pelo módulo http/https.
 * @returns Erro pronto para ser devolvido ao frontend.
 */
function converterErroDeRede(erro: NodeJS.ErrnoException): ErroGitLab {
    const codigoNode: string = erro.code ?? "";
    const dica: string = DICA_POR_ERRO_DE_REDE[codigoNode] ?? "Verifique sua conexão, a VPN e a URL configurada no arquivo .env.";

    return new ErroGitLab(CodigoErroGitLab.FalhaRede, "Não foi possível conectar ao GitLab.", 502, dica);
}

/**
 * Executa uma requisição GET. O método é fixo e não há como enviar corpo,
 * garantindo que a aplicação seja somente leitura por construção.
 * @param urlAlvo URL completa a ser consultada.
 * @param opcoes Cabeçalhos, tempo limite e saldo de redirecionamentos.
 * @returns Status, cabeçalhos e corpo da resposta.
 */
export function ExecutarGet(urlAlvo: string, opcoes: OpcoesRequisicao): Promise<RespostaHttp> {
    const { cabecalhos, timeoutMs, redirecionamentosRestantes = API_GITLAB.MAX_REDIRECIONAMENTOS } = opcoes;

    return new Promise<RespostaHttp>((resolver, rejeitar) => {
        const url: URL | null = converterUrl(urlAlvo);

        if (!url) {
            rejeitar(new ErroGitLab(CodigoErroGitLab.ConfiguracaoInvalida, "A URL do GitLab configurada é inválida.", 500, "Revise a variável GITLAB_URL no arquivo .env."));
            return;
        }

        const biblioteca = url.protocol === "https:" ? https : http;
        let finalizada = false;

        const requisicao = biblioteca.request(url, { method: "GET", headers: cabecalhos }, (resposta) => {
            const status: number = resposta.statusCode ?? 0;
            const destino: string | undefined = resposta.headers.location;

            if (STATUS_REDIRECIONAMENTO.includes(status) && destino && redirecionamentosRestantes > 0) {
                resposta.resume();
                finalizada = true;
                seguirRedirecionamento(url, destino, opcoes, redirecionamentosRestantes).then(resolver, rejeitar);
                return;
            }

            const partes: Buffer[] = [];
            let tamanho = 0;

            resposta.on("data", (parte: Buffer) => {
                tamanho += parte.length;

                if (tamanho > API_GITLAB.TAMANHO_MAX_RESPOSTA_BYTES) {
                    requisicao.destroy(new ErroGitLab(CodigoErroGitLab.ArquivoMuitoGrande, "A resposta do GitLab passou do tamanho máximo permitido.", 502));
                    return;
                }
                partes.push(parte);
            });

            resposta.on("end", () => {
                if (finalizada)
                    return;
                finalizada = true;
                resolver({ status, cabecalhos: resposta.headers, corpo: Buffer.concat(partes) });
            });
        });

        requisicao.setTimeout(timeoutMs, () => {
            requisicao.destroy(new ErroGitLab(CodigoErroGitLab.TempoEsgotado, `O GitLab não respondeu em ${timeoutMs}ms.`, 504, "Aumente REQUEST_TIMEOUT_MS no .env ou verifique a rede."));
        });

        requisicao.on("error", (erro: NodeJS.ErrnoException) => {
            if (finalizada)
                return;
            finalizada = true;
            rejeitar(erro instanceof ErroGitLab ? erro : converterErroDeRede(erro));
        });

        requisicao.end();
    });
}

/**
 * Refaz a requisição no destino do redirecionamento, sem levar o token para outra origem.
 * @param origem URL que respondeu com o redirecionamento.
 * @param destino Conteúdo do cabeçalho Location.
 * @param opcoes Opções da requisição original.
 * @param redirecionamentosRestantes Saldo de redirecionamentos ainda permitidos.
 * @returns Resposta da nova requisição.
 */
function seguirRedirecionamento(origem: URL, destino: string, opcoes: OpcoesRequisicao, redirecionamentosRestantes: number): Promise<RespostaHttp> {
    const novaUrl: URL | null = converterUrl(destino, origem);

    if (!novaUrl)
        return Promise.reject(new ErroGitLab(CodigoErroGitLab.RespostaInesperada, "O GitLab respondeu com um redirecionamento inválido.", 502));

    const mesmaOrigem: boolean = novaUrl.origin === origem.origin;

    return ExecutarGet(novaUrl.toString(), {
        ...opcoes,
        cabecalhos: mesmaOrigem ? opcoes.cabecalhos : removerToken(opcoes.cabecalhos),
        redirecionamentosRestantes: redirecionamentosRestantes - 1,
    });
}

/**
 * Converte um texto em URL sem lançar exceção.
 * @param valor Texto da URL.
 * @param base URL base usada quando o valor é relativo.
 * @returns URL montada ou nulo quando o texto é inválido.
 */
function converterUrl(valor: string, base?: URL): URL | null {
    try {
        const url = new URL(valor, base);

        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch {
        return null;
    }
}
