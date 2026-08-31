/** Chaves usadas para lembrar as escolhas do usuário entre uma sessão e outra. */
export enum ChavePreferencia {
    ProjetoId = "mr-radar:projetoId",
    MrIid = "mr-radar:mrIid",
}

/**
 * Lê um valor lembrado da última sessão.
 * @param chave Chave da preferência.
 * @returns Valor guardado ou texto vazio.
 */
export function GetPreferencia(chave: ChavePreferencia): string {
    try {
        return window.localStorage.getItem(chave) ?? "";
    } catch {
        return "";
    }
}

/**
 * Guarda um valor para a próxima sessão.
 * @param chave Chave da preferência.
 * @param valor Valor a guardar.
 * @returns Nada.
 */
export function SalvarPreferencia(chave: ChavePreferencia, valor: string): void {
    try {
        window.localStorage.setItem(chave, valor);
    } catch {
        // Navegador com armazenamento bloqueado: a tela continua funcionando sem lembrar as escolhas.
    }
}
