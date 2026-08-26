import { ContainerCampo, Entrada, RotuloCampo } from "./styles";
import { LARGURA_PADRAO, PropriedadesCampoTexto, TECLA_ENTER } from "./types";

export function CampoTexto({ rotulo, valor, onChange, onEnter, placeholder = "", largura = LARGURA_PADRAO }: PropriedadesCampoTexto) {
    return (
        <ContainerCampo $largura={largura}>
            <RotuloCampo>{rotulo}</RotuloCampo>
            <Entrada
                value={valor}
                placeholder={placeholder}
                onChange={(evento) => onChange(evento.target.value)}
                onKeyDown={(evento) => evento.key === TECLA_ENTER && onEnter?.()}
            />
        </ContainerCampo>
    );
}
