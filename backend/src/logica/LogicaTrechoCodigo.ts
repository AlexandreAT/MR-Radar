import { ConfiguracaoApp } from "../configuracao/types";
import { ClienteRevisao } from "../integracao/ClienteRevisao";
import { CodigoErroProvedor, ErroProvedor } from "../integracao/ErroProvedor";
import { CodigoErroTrecho, ErroTrecho, LinhaTrecho } from "../models/Revisao/types";
import { GetLinguagem } from "../utilidades/Linguagem";
import { ArquivoEmCache, PosicaoResolvida, ResultadoTrecho } from "./types";

/** Quantidade de arquivos em cache a partir da qual ele é reiniciado. */
const MAX_ARQUIVOS_EM_CACHE = 300;

/** Marca de ordem de bytes que alguns arquivos trazem no início. */
const BOM = "\uFEFF";

/** Mensagem exibida para cada motivo de falha ao montar o trecho. */
const MENSAGEM_POR_ERRO: Record<CodigoErroTrecho, string> = {
    [CodigoErroTrecho.SemPosicao]: "Este comentário não está ligado a um arquivo, é um comentário geral da revisão.",
    [CodigoErroTrecho.SemLinha]: "Este comentário está ligado ao arquivo inteiro ou a um anexo, sem uma linha específica.",
    [CodigoErroTrecho.RefIndisponivel]: "O comentário não informa o commit do trecho, então não foi possível buscar o código.",
    [CodigoErroTrecho.ArquivoNaoEncontrado]: "O arquivo não existe neste commit. Ele pode ter sido removido ou renomeado.",
    [CodigoErroTrecho.ArquivoBinario]: "O arquivo é binário e não tem trecho de código para mostrar.",
    [CodigoErroTrecho.ArquivoMuitoGrande]: "O arquivo é grande demais para ser exibido aqui.",
    [CodigoErroTrecho.LinhaForaDoArquivo]: "A linha comentada não existe mais na versão do arquivo neste commit.",
    [CodigoErroTrecho.FalhaAoBuscar]: "Não foi possível buscar o conteúdo do arquivo.",
    [CodigoErroTrecho.SemPermissao]: "Seu token não tem permissão para buscar o conteúdo deste arquivo.",
};

/** Motivo de falha correspondente a cada erro devolvido pela integração. */
const ERRO_TRECHO_POR_ERRO_PROVEDOR: Partial<Record<CodigoErroProvedor, CodigoErroTrecho>> = {
    [CodigoErroProvedor.NaoEncontrado]: CodigoErroTrecho.ArquivoNaoEncontrado,
    [CodigoErroProvedor.ArquivoBinario]: CodigoErroTrecho.ArquivoBinario,
    [CodigoErroProvedor.ArquivoMuitoGrande]: CodigoErroTrecho.ArquivoMuitoGrande,
    // No GitHub, buscar o conteúdo do arquivo exige a permissão "Contents", separada da usada
    // pelo resto do dashboard — um token sem ela falha só aqui, silenciosamente, sem este mapeamento.
    [CodigoErroProvedor.TokenInvalido]: CodigoErroTrecho.SemPermissao,
    [CodigoErroProvedor.AcessoNegado]: CodigoErroTrecho.SemPermissao,
};

/** Monta o trecho de código exibido em cada comentário de revisão. */
export class LogicaTrechoCodigo {
    private readonly cliente: ClienteRevisao;
    private readonly configuracao: ConfiguracaoApp;
    private readonly cacheArquivos = new Map<string, ArquivoEmCache>();

    /**
     * @param cliente Cliente somente leitura do provedor configurado.
     * @param configuracao Configuração da aplicação.
     */
    constructor(cliente: ClienteRevisao, configuracao: ConfiguracaoApp) {
        this.cliente = cliente;
        this.configuracao = configuracao;
    }

    /**
     * Monta o trecho de código em volta da linha comentada.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param posicao Posição do comentário já interpretada.
     * @param linhasContexto Quantas linhas mostrar antes e depois da linha comentada.
     * @returns Trecho montado ou o motivo de não ter sido possível montá-lo.
     */
    public async GetTrecho(projetoId: string, posicao: PosicaoResolvida, linhasContexto: number): Promise<ResultadoTrecho> {
        if (!posicao.caminhoArquivo)
            return montarFalha(CodigoErroTrecho.SemPosicao);

        if (!posicao.linhaInicial)
            return montarFalha(CodigoErroTrecho.SemLinha);

        if (!posicao.refs.length)
            return montarFalha(CodigoErroTrecho.RefIndisponivel);

        let ultimoErro: ErroTrecho = montarErro(CodigoErroTrecho.RefIndisponivel);

        for (const ref of posicao.refs) {
            const arquivo: ArquivoEmCache = await this.getArquivo(projetoId, posicao.caminhoArquivo, ref);

            if (arquivo.erro || !arquivo.linhas) {
                ultimoErro = arquivo.erro ?? ultimoErro;
                continue;
            }

            if (posicao.linhaInicial > arquivo.linhas.length) {
                ultimoErro = montarErro(CodigoErroTrecho.LinhaForaDoArquivo);
                continue;
            }

            return this.montarTrecho(arquivo.linhas, posicao, ref, linhasContexto);
        }

        return { codigo: null, trecho: null, erroTrecho: ultimoErro };
    }

    /**
     * Busca o conteúdo de um arquivo, reaproveitando o cache quando possível.
     * O conteúdo de um commit nunca muda, então o cache também guarda as falhas.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param caminhoArquivo Caminho do arquivo no repositório.
     * @param ref Commit usado como referência.
     * @returns Linhas do arquivo ou o motivo da falha.
     */
    private async getArquivo(projetoId: string, caminhoArquivo: string, ref: string): Promise<ArquivoEmCache> {
        const chave = `${projetoId}|${ref}|${caminhoArquivo}`;
        const emCache: ArquivoEmCache | undefined = this.cacheArquivos.get(chave);

        if (emCache && emCache.expiraEm > Date.now())
            return emCache;

        const resultado: ArquivoEmCache = await this.buscarArquivo(projetoId, caminhoArquivo, ref);

        return this.guardarEmCache(chave, resultado);
    }

    /**
     * Busca o conteúdo de um arquivo no provedor e converte falhas conhecidas em motivos de erro.
     * @param projetoId ID numérico ou caminho do projeto.
     * @param caminhoArquivo Caminho do arquivo no repositório.
     * @param ref Commit usado como referência.
     * @returns Linhas do arquivo ou o motivo da falha.
     */
    private async buscarArquivo(projetoId: string, caminhoArquivo: string, ref: string): Promise<ArquivoEmCache> {
        try {
            const conteudo: string = await this.cliente.GetArquivoBruto(projetoId, caminhoArquivo, ref);

            return { expiraEm: 0, linhas: separarLinhas(conteudo) };
        } catch (erro) {
            const codigoProvedor: CodigoErroProvedor | null = erro instanceof ErroProvedor ? erro.codigo : null;
            const codigoTrecho: CodigoErroTrecho = (codigoProvedor && ERRO_TRECHO_POR_ERRO_PROVEDOR[codigoProvedor]) ?? CodigoErroTrecho.FalhaAoBuscar;

            return { expiraEm: 0, erro: montarErro(codigoTrecho) };
        }
    }

    /**
     * Guarda o resultado no cache, respeitando o tempo configurado e o tamanho máximo.
     * @param chave Chave formada por projeto, commit e arquivo.
     * @param resultado Conteúdo ou falha a ser guardado.
     * @returns O mesmo resultado recebido.
     */
    private guardarEmCache(chave: string, resultado: ArquivoEmCache): ArquivoEmCache {
        if (this.configuracao.tempoCacheArquivoMs <= 0)
            return resultado;

        if (this.cacheArquivos.size >= MAX_ARQUIVOS_EM_CACHE)
            this.cacheArquivos.clear();

        this.cacheArquivos.set(chave, { ...resultado, expiraEm: Date.now() + this.configuracao.tempoCacheArquivoMs });

        return resultado;
    }

    /**
     * Recorta as linhas do arquivo em volta da linha comentada.
     * @param linhasArquivo Todas as linhas do arquivo.
     * @param posicao Posição do comentário já interpretada.
     * @param ref Commit de onde o conteúdo veio.
     * @param linhasContexto Quantas linhas mostrar antes e depois.
     * @returns Trecho pronto para exibição.
     */
    private montarTrecho(linhasArquivo: string[], posicao: PosicaoResolvida, ref: string, linhasContexto: number): ResultadoTrecho {
        const total: number = linhasArquivo.length;
        const inicioDestaque: number = Math.min(posicao.linhaInicial ?? 1, total);
        const fimDestaque: number = Math.min(Math.max(posicao.linhaFinal ?? inicioDestaque, inicioDestaque), total);
        const primeiraLinha: number = Math.max(1, inicioDestaque - linhasContexto);
        const ultimaLinha: number = Math.min(total, fimDestaque + linhasContexto);

        const linhas: LinhaTrecho[] = [];

        for (let numero = primeiraLinha; numero <= ultimaLinha; numero += 1) {
            linhas.push({
                numero,
                texto: linhasArquivo[numero - 1],
                destacada: numero >= inicioDestaque && numero <= fimDestaque,
            });
        }

        return {
            codigo: linhas.map((linha) => linha.texto).join("\n"),
            trecho: {
                linguagem: GetLinguagem(posicao.caminhoArquivo),
                ref,
                primeiraLinha,
                ultimaLinha,
                linhaInicialDestaque: inicioDestaque,
                linhaFinalDestaque: fimDestaque,
                linhas,
            },
            erroTrecho: null,
        };
    }
}

/**
 * Separa o conteúdo do arquivo em linhas, normalizando quebras de linha do Windows.
 * @param conteudo Texto completo do arquivo.
 * @returns Linhas do arquivo.
 */
function separarLinhas(conteudo: string): string[] {
    const semBom: string = conteudo.startsWith(BOM) ? conteudo.slice(BOM.length) : conteudo;
    const linhas: string[] = semBom.replace(/\r\n?/g, "\n").split("\n");

    if (linhas.length > 1 && linhas[linhas.length - 1] === "")
        linhas.pop();

    return linhas;
}

/**
 * Monta o objeto de erro de um trecho a partir do código do motivo.
 * @param codigo Motivo da falha.
 * @returns Erro com a mensagem correspondente.
 */
function montarErro(codigo: CodigoErroTrecho): ErroTrecho {
    return { codigo, mensagem: MENSAGEM_POR_ERRO[codigo] };
}

/**
 * Monta o resultado de um trecho que não pôde ser exibido.
 * @param codigo Motivo da falha.
 * @returns Resultado sem código e com o motivo preenchido.
 */
function montarFalha(codigo: CodigoErroTrecho): ResultadoTrecho {
    return { codigo: null, trecho: null, erroTrecho: montarErro(codigo) };
}
