import { BotaoEstilizado } from "./styles";
import { PropriedadesBotao, VarianteBotao } from "./types";

export function Botao({ children, onClick, variante = VarianteBotao.Secundario, desabilitado = false }: PropriedadesBotao) {
    return (
        <BotaoEstilizado type="button" $variante={variante} disabled={desabilitado} onClick={onClick}>
            {children}
        </BotaoEstilizado>
    );
}
