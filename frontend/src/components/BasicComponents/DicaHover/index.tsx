import { Bolha, Container } from "./styles";
import { AlinhamentoDica, PropriedadesDicaHover } from "./types";
import { useDicaHover } from "./useDicaHover";

export function DicaHover({ texto, children, alinhamento = AlinhamentoDica.Centro }: PropriedadesDicaHover) {
    const { aberta, handleAbrir, handleFechar, handleAlternar } = useDicaHover();

    return (
        <Container onMouseEnter={handleAbrir} onMouseLeave={handleFechar} onClick={handleAlternar}>
            {children}
            {aberta && (
                <Bolha role="tooltip" $alinhamento={alinhamento}>
                    {texto}
                </Bolha>
            )}
        </Container>
    );
}
