/** Códigos de erro devolvidos pela integração com o provedor configurado (GitLab ou GitHub). */
export enum CodigoErroProvedor {
    ConfiguracaoInvalida = "CONFIGURACAO_INVALIDA",
    ParametroInvalido = "PARAMETRO_INVALIDO",
    TokenInvalido = "TOKEN_INVALIDO",
    AcessoNegado = "ACESSO_NEGADO",
    NaoEncontrado = "NAO_ENCONTRADO",
    LimiteRequisicoes = "LIMITE_REQUISICOES",
    ErroServidorProvedor = "ERRO_SERVIDOR_PROVEDOR",
    RespostaInesperada = "RESPOSTA_INESPERADA",
    FalhaRede = "FALHA_REDE",
    TempoEsgotado = "TEMPO_ESGOTADO",
    ArquivoMuitoGrande = "ARQUIVO_MUITO_GRANDE",
    ArquivoBinario = "ARQUIVO_BINARIO",
}

/** Erro conhecido da integração com o provedor, com mensagem pronta para o usuário. */
export class ErroProvedor extends Error {
    public readonly codigo: CodigoErroProvedor;
    public readonly statusHttp: number;
    public readonly dica: string;

    /**
     * Cria um erro já pronto para virar resposta HTTP do backend.
     * @param codigo Código que identifica o tipo do erro.
     * @param mensagem Mensagem exibida ao usuário.
     * @param statusHttp Status HTTP que o backend deve devolver.
     * @param dica Orientação sobre o que fazer para resolver.
     */
    constructor(codigo: CodigoErroProvedor, mensagem: string, statusHttp: number, dica = "") {
        super(mensagem);
        this.name = "ErroProvedor";
        this.codigo = codigo;
        this.statusHttp = statusHttp;
        this.dica = dica;
    }
}
