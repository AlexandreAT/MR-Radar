import { CodigoErroGitLab } from "./types";

/** Erro conhecido da integração com o GitLab, com mensagem pronta para o usuário. */
export class ErroGitLab extends Error {
    public readonly codigo: CodigoErroGitLab;
    public readonly statusHttp: number;
    public readonly dica: string;

    /**
     * Cria um erro já pronto para virar resposta HTTP do backend.
     * @param codigo Código que identifica o tipo do erro.
     * @param mensagem Mensagem exibida ao usuário.
     * @param statusHttp Status HTTP que o backend deve devolver.
     * @param dica Orientação sobre o que fazer para resolver.
     */
    constructor(codigo: CodigoErroGitLab, mensagem: string, statusHttp: number, dica = "") {
        super(mensagem);
        this.name = "ErroGitLab";
        this.codigo = codigo;
        this.statusHttp = statusHttp;
        this.dica = dica;
    }
}
