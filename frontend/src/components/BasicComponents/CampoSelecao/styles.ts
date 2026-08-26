import styled from "styled-components";
import { estiloCampo } from "../sharedStyles";

export { ContainerCampo, RotuloCampo } from "../sharedStyles";

export const Selecao = styled.select`
    ${estiloCampo}
    padding: 0 8px;
    cursor: pointer;
`;

export const Opcao = styled.option``;
