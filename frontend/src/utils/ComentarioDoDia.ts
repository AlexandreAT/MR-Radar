import { DiaDeHoras } from "src/api/Horas/types";
import { GetDataDeHojeLocal } from "./Elegibilidade";

/** Estado do marcador de um dia, conforme já passou ou não e teve comentário ou não. */
export enum EstadoComentarioDoDia {
    Futuro = "futuro",
    ComComentario = "com_comentario",
    SemComentario = "sem_comentario",
}

/** Nome completo de cada dia útil, usado no texto da dica. */
const NOME_COMPLETO_DO_DIA: Record<string, string> = {
    segunda: "segunda-feira",
    terca: "terça-feira",
    quarta: "quarta-feira",
    quinta: "quinta-feira",
    sexta: "sexta-feira",
};

/** Marcador de comentário de um dia, já pronto para exibir. */
export interface MarcadorComentarioDoDia {
    estado: EstadoComentarioDoDia;
    texto: string;
}

/**
 * Calcula o estado do marcador de comentário de um dia útil: ainda não chegou, teve comentário
 * de status em algum Merge Request, ou não teve.
 * @param dia Dia útil já com horas e a informação de comentário.
 * @returns Marcador pronto para exibir.
 */
export function GetMarcadorComentario(dia: DiaDeHoras): MarcadorComentarioDoDia {
    const nomeDia: string = NOME_COMPLETO_DO_DIA[dia.dia] ?? dia.dia;

    if (dia.data > GetDataDeHojeLocal())
        return { estado: EstadoComentarioDoDia.Futuro, texto: "Esse dia ainda não chegou." };

    if (dia.temComentario)
        return { estado: EstadoComentarioDoDia.ComComentario, texto: `Você comentou em algum chamado nesta ${nomeDia}.` };

    return { estado: EstadoComentarioDoDia.SemComentario, texto: `Nenhum comentário seu em chamado nesta ${nomeDia} ainda.` };
}
