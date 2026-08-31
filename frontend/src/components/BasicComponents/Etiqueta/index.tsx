import { EtiquetaEstilizada } from "./styles";
import { PropriedadesEtiqueta, TomEtiqueta } from "./types";

export function Etiqueta({ children, tom = TomEtiqueta.Neutro, selecionada = false }: PropriedadesEtiqueta) {
    return (
        <EtiquetaEstilizada $tom={tom} $selecionada={selecionada}>
            {children}
        </EtiquetaEstilizada>
    );
}
