import { useState } from "react";

/**
 * Controla a abertura do modal de alterações do Merge Request.
 * @returns Se o modal está aberto e os manipuladores para abrir/fechar.
 */
export function useResumoMergeRequest() {
    const [modalAberto, setModalAberto] = useState(false);

    return {
        modalAberto,
        handleAbrirModal: () => setModalAberto(true),
        handleFecharModal: () => setModalAberto(false),
    };
}
