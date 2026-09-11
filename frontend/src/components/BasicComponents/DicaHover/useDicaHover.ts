import { MouseEvent, useEffect, useRef, useState } from "react";
import { TEMPO_AUTO_FECHAR_MS } from "./types";

/**
 * Controla a visibilidade de uma dica flutuante: aberta no hover (mouse) e alternada no
 * clique/toque (para telas sem hover), fechando sozinha depois de um tempo nesse segundo caso.
 * @returns Se a dica está aberta e os manipuladores usados pelo componente.
 */
export function useDicaHover() {
    const [aberta, setAberta] = useState(false);
    const temporizador = useRef<number | null>(null);

    useEffect(() => () => limparTemporizador(), []);

    /**
     * Cancela o fechamento automático agendado, se houver.
     * @returns Nada.
     */
    function limparTemporizador(): void {
        if (temporizador.current) {
            window.clearTimeout(temporizador.current);
            temporizador.current = null;
        }
    }

    /**
     * Abre a dica ao passar o mouse.
     * @returns Nada.
     */
    function handleAbrir(): void {
        limparTemporizador();
        setAberta(true);
    }

    /**
     * Fecha a dica ao tirar o mouse.
     * @returns Nada.
     */
    function handleFechar(): void {
        limparTemporizador();
        setAberta(false);
    }

    /**
     * Alterna a dica no clique/toque, sem deixar o clique afetar o que estiver por baixo (o
     * marcador normalmente fica dentro de um cartão clicável).
     * @param evento Evento do clique.
     * @returns Nada.
     */
    function handleAlternar(evento: MouseEvent): void {
        evento.preventDefault();
        evento.stopPropagation();
        limparTemporizador();

        setAberta((atual) => {
            const proxima: boolean = !atual;

            if (proxima)
                temporizador.current = window.setTimeout(() => setAberta(false), TEMPO_AUTO_FECHAR_MS);

            return proxima;
        });
    }

    return { aberta, handleAbrir, handleFechar, handleAlternar };
}
