import { ContainerCampo, Opcao, RotuloCampo, Selecao } from "./styles";
import { LARGURA_PADRAO, PropriedadesCampoSelecao } from "./types";

export function CampoSelecao({ rotulo, valor, opcoes, onChange, largura = LARGURA_PADRAO }: PropriedadesCampoSelecao) {
    return (
        <ContainerCampo $largura={largura}>
            <RotuloCampo>{rotulo}</RotuloCampo>
            <Selecao value={valor} onChange={(evento) => onChange(evento.target.value)}>
                {opcoes.map((opcao) => (
                    <Opcao key={opcao.valor} value={opcao.valor}>
                        {opcao.rotulo}
                    </Opcao>
                ))}
            </Selecao>
        </ContainerCampo>
    );
}
