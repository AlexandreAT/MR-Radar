/** Erro devolvido pelo backend local, já com mensagem pronta para a tela. */
export class ErroApi extends Error {
    public readonly codigo: string;
    public readonly dica: string;

    /**
     * @param mensagem Mensagem exibida ao usuário.
     * @param codigo Código que identifica o tipo do erro.
     * @param dica Orientação sobre o que fazer para resolver.
     */
    constructor(mensagem: string, codigo: string, dica = "") {
        super(mensagem);
        this.name = "ErroApi";
        this.codigo = codigo;
        this.dica = dica;
    }
}
