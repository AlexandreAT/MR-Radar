import { Provedor } from "../configuracao/types";

/** Termos usados nas mensagens de erro que mudam conforme o provedor ativo. */
export interface TermosProvedor {
    rotuloProjeto: string;
    dicaProjeto: string;
    rotuloNumero: string;
    nomeItem: string;
}

/** Termos de cada provedor. Espelha o vocabulário exibido na tela (frontend/src/utils/Vocabulario.ts). */
const TERMOS_POR_PROVEDOR: Record<Provedor, TermosProvedor> = {
    [Provedor.GitLab]: {
        rotuloProjeto: "Project ID",
        dicaProjeto: "Use o ID numérico do projeto ou o caminho completo, como grupo/subgrupo/projeto.",
        rotuloNumero: "IID do Merge Request",
        nomeItem: "Merge Request",
    },
    [Provedor.GitHub]: {
        rotuloProjeto: "repositório",
        dicaProjeto: "Use o caminho no formato dono/repositorio.",
        rotuloNumero: "Number do Pull Request",
        nomeItem: "Pull Request",
    },
};

/**
 * Descobre os termos do provedor ativo, para mensagens de erro que citam o item ou o projeto.
 * @param provedor Provedor configurado.
 * @returns Termos usados nas mensagens do backend.
 */
export function GetTermosProvedor(provedor: Provedor): TermosProvedor {
    return TERMOS_POR_PROVEDOR[provedor];
}
