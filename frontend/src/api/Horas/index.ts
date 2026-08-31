import { GetJson } from "src/services";
import { ResumoHorasSemana } from "./types";

/**
 * Busca as horas que o usuário lançou nas issues dele em uma semana.
 * @param semana Data dentro da semana desejada, ou texto vazio para a semana atual.
 * @param sinal Sinal usado para cancelar a consulta anterior.
 * @returns Horas por dia útil, total da semana e as issues do usuário.
 */
export async function GetHorasDaSemana(semana: string, sinal?: AbortSignal): Promise<ResumoHorasSemana> {
    return GetJson<ResumoHorasSemana>("/horas", semana ? { semana } : {}, sinal);
}
