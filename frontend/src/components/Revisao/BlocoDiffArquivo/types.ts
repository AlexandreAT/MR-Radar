import { ArquivoAlterado, StatusArquivoAlterado } from "src/api/Revisao/types";

/** Propriedades aceitas pelo bloco de diff de um arquivo. */
export interface PropriedadesBlocoDiffArquivo {
    arquivo: ArquivoAlterado;
}

/** Texto exibido para cada status de arquivo. */
export const TEXTO_POR_STATUS: Record<StatusArquivoAlterado, string> = {
    [StatusArquivoAlterado.Adicionado]: "novo",
    [StatusArquivoAlterado.Removido]: "removido",
    [StatusArquivoAlterado.Modificado]: "modificado",
    [StatusArquivoAlterado.Renomeado]: "renomeado",
};

/** Textos fixos exibidos no bloco de diff. */
export const TEXTO_BLOCO = {
    SEPARADOR: " · ",
    SETA_RENOMEADO: "→",
} as const;
