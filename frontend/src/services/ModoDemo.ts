import { ResolverDatasDemoHoras, ResumoHorasRelativo } from "src/utils/ModoDemo";
import { ErroApi } from "./ErroApi";
import { CODIGO_ERRO_COMUNICACAO, MENSAGEM_SERVICO } from "./types";

/** Pasta, dentro de `public/`, onde `scripts/gerar-fixtures-demo.ts` grava as fixtures estáticas. */
const PASTA_DADOS_DEMO = "demo-data";

/** Caminho da rota de Horas — único caso que precisa resolver datas relativas (ver ModoDemo do frontend). */
const CAMINHO_HORAS = "/horas";

/** Manifesto carregado uma vez e reaproveitado no resto da sessão. */
let manifestoEmCache: Record<string, string> | null = null;

/**
 * Monta a mesma chave que `scripts/gerar-fixtures-demo.ts` usa no manifesto: o caminho da rota
 * mais a query string, com os parâmetros sempre em ordem alfabética — assim a chave não depende
 * da ordem em que cada chamador monta o objeto de parâmetros.
 * @param caminho Caminho da rota, sem o prefixo /api.
 * @param parametros Parâmetros de query string.
 * @returns Chave estável para procurar no manifesto.
 */
function montarChave(caminho: string, parametros: Record<string, string>): string {
    const query = new URLSearchParams();

    Object.keys(parametros)
        .sort()
        .forEach((chave) => query.set(chave, parametros[chave]));

    const queryTexto: string = query.toString();

    return `${caminho}${queryTexto ? `?${queryTexto}` : ""}`;
}

/**
 * Carrega o manifesto das fixtures, reaproveitando depois da primeira leitura.
 * @returns Mapa de chave (caminho + query) para o nome do arquivo estático correspondente.
 */
async function getManifesto(): Promise<Record<string, string>> {
    if (manifestoEmCache)
        return manifestoEmCache;

    const resposta: Response = await fetch(`${PASTA_DADOS_DEMO}/manifest.json`);

    manifestoEmCache = (await resposta.json()) as Record<string, string>;

    return manifestoEmCache;
}

/**
 * Busca a fixture estática correspondente a uma consulta, no lugar de um backend de verdade.
 * Usada só quando o build é o modo demo (ver `EH_MODO_DEMO`, em `src/utils/ModoDemo.ts`).
 * @param caminho Caminho da rota, sem o prefixo /api.
 * @param parametros Parâmetros de query string.
 * @returns Conteúdo já convertido, no mesmo formato que o backend devolveria.
 */
export async function BuscarFixtureDemo<T>(caminho: string, parametros: Record<string, string>): Promise<T> {
    const chave: string = montarChave(caminho, parametros);
    const manifesto: Record<string, string> = await getManifesto();
    const arquivo: string | undefined = manifesto[chave];

    if (!arquivo)
        throw new ErroApi(MENSAGEM_SERVICO.FORA_DA_DEMONSTRACAO, CODIGO_ERRO_COMUNICACAO, MENSAGEM_SERVICO.DICA_FORA_DA_DEMONSTRACAO);

    const resposta: Response = await fetch(`${PASTA_DADOS_DEMO}/${arquivo}`);
    const dados: unknown = await resposta.json();

    return (caminho === CAMINHO_HORAS ? ResolverDatasDemoHoras(dados as ResumoHorasRelativo) : dados) as T;
}
