import { EtiquetaEstilizada } from "./styles";
import { PropriedadesEtiqueta, TomEtiqueta } from "./types";

export function Etiqueta({ children, tom = TomEtiqueta.Neutro }: PropriedadesEtiqueta) {
    return <EtiquetaEstilizada $tom={tom}>{children}</EtiquetaEstilizada>;
}
