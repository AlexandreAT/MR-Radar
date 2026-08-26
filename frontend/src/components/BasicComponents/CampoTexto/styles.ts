import styled from "styled-components";
import { estiloCampo } from "../sharedStyles";

export { ContainerCampo, RotuloCampo } from "../sharedStyles";

export const Entrada = styled.input`
    ${estiloCampo}

    &::placeholder {
        color: ${({ theme }) => theme.cores.textoSecundario};
    }
`;
