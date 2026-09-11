import { Provedor } from "src/api/Revisao/types";

/** Termos que mudam conforme o provedor ativo. */
export interface Vocabulario {
    nomeProvedor: string;
    nomeItem: string;
    nomeItemPlural: string;
    rotuloProjeto: string;
    placeholderProjeto: string;
    rotuloNumero: string;
    placeholderNumero: string;
    prefixoReferencia: string;
}

/** Vocabulário de cada provedor. */
const VOCABULARIO_POR_PROVEDOR: Record<Provedor, Vocabulario> = {
    [Provedor.GitLab]: {
        nomeProvedor: "GitLab",
        nomeItem: "Merge Request",
        nomeItemPlural: "Merge Requests",
        rotuloProjeto: "Project ID ou caminho",
        placeholderProjeto: "123 ou grupo/projeto",
        rotuloNumero: "IID do Merge Request",
        placeholderNumero: "456",
        prefixoReferencia: "!",
    },
    [Provedor.GitHub]: {
        nomeProvedor: "GitHub",
        nomeItem: "Pull Request",
        nomeItemPlural: "Pull Requests",
        rotuloProjeto: "Repositório",
        placeholderProjeto: "dono/repositorio",
        rotuloNumero: "Number do Pull Request",
        placeholderNumero: "456",
        prefixoReferencia: "#",
    },
};

/**
 * Descobre o vocabulário do provedor ativo.
 * @param provedor Provedor informado pelo backend, ou indefinido enquanto a configuração carrega.
 * @returns Termos a usar na tela. Antes da configuração chegar, vale o vocabulário do GitLab.
 */
export function GetVocabulario(provedor: Provedor | undefined): Vocabulario {
    return VOCABULARIO_POR_PROVEDOR[provedor ?? Provedor.GitLab];
}
