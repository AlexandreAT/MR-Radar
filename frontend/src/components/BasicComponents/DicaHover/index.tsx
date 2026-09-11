import { Bolha, Container } from "./styles";
import { PropriedadesDicaHover } from "./types";
import { useDicaHover } from "./useDicaHover";

export function DicaHover({ texto, children }: PropriedadesDicaHover) {
    const { aberta, handleAbrir, handleFechar, handleAlternar } = useDicaHover();

    return (
        <Container onMouseEnter={handleAbrir} onMouseLeave={handleFechar} onClick={handleAlternar}>
            {children}
            {aberta && <Bolha role="tooltip">{texto}</Bolha>}
        </Container>
    );
}
