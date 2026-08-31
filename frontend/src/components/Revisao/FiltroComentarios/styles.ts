import styled from "styled-components";
import { PainelBase } from "../../sharedStyles";

export const Container = styled(PainelBase)`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    gap: ${({ theme }) => theme.espacamentos.medio};
`;
