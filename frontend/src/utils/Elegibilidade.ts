import { FormatarDiaMes } from "./Formatacao";

/** Cor do marcador de elegibilidade de um chamado. */
export enum NivelElegibilidade {
    CommitouNoDiaDeReferencia = "commitou_no_dia_de_referencia",
    CommitouNaSemana = "commitou_na_semana",
}

/** Marcador de elegibilidade já pronto para exibir, com o texto da dica. */
export interface MarcadorElegibilidade {
    nivel: NivelElegibilidade;
    texto: string;
}

/**
 * Descobre a data de hoje no fuso local, no formato AAAA-MM-DD.
 * Usa os getters locais do Date, não `toISOString` — esse converte para UTC primeiro e pode
 * voltar o dia errado perto da virada da meia-noite, dependendo do fuso do navegador.
 * @returns Data de hoje, no fuso do navegador.
 */
export function GetDataDeHojeLocal(): string {
    const agora = new Date();
    const ano: number = agora.getFullYear();
    const mes: string = String(agora.getMonth() + 1).padStart(2, "0");
    const dia: string = String(agora.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
}

/**
 * Calcula o marcador de elegibilidade de um chamado, conforme o dia usado como referência — o
 * dia de hoje por padrão, ou o dia clicado no gráfico de horas.
 * @param diasComCommit Dias em que o usuário commitou neste chamado, dentro da semana.
 * @param diaReferencia Dia usado como referência (hoje, ou o dia clicado no gráfico).
 * @param ehHoje Indica se o dia de referência é hoje, para escolher o texto da dica.
 * @returns Marcador pronto para exibir, ou nulo quando não há commit nenhum na semana.
 */
export function GetMarcadorElegibilidade(diasComCommit: string[], diaReferencia: string, ehHoje: boolean): MarcadorElegibilidade | null {
    if (diasComCommit.length === 0)
        return null;

    if (diasComCommit.includes(diaReferencia))
        return {
            nivel: NivelElegibilidade.CommitouNoDiaDeReferencia,
            texto: ehHoje ? "Você commitou neste chamado hoje" : `Você commitou neste chamado em ${FormatarDiaMes(diaReferencia)}`,
        };

    return { nivel: NivelElegibilidade.CommitouNaSemana, texto: "Você commitou neste chamado nesta semana" };
}
