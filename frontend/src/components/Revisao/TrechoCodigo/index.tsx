import { Aviso, Bloco, CabecalhoBloco, Linguagem, Linha, Linhas, NumeroLinha, Referencia, TextoLinha } from "./styles";
import { PropriedadesTrechoCodigo, TAMANHO_REF_CURTA, TEXTO_TRECHO } from "./types";

export function TrechoCodigo({ trecho, erro }: PropriedadesTrechoCodigo) {
    if (!trecho)
        return <Aviso>{erro?.mensagem ?? TEXTO_TRECHO.INDISPONIVEL}</Aviso>;

    return (
        <Bloco>
            <CabecalhoBloco>
                <Linguagem>{trecho.linguagem}</Linguagem>
                <Referencia>
                    {TEXTO_TRECHO.LINHAS} {trecho.primeiraLinha}
                    {TEXTO_TRECHO.INTERVALO}
                    {trecho.ultimaLinha}
                    {TEXTO_TRECHO.SEPARADOR}
                    {TEXTO_TRECHO.COMMIT} {trecho.ref.slice(0, TAMANHO_REF_CURTA)}
                </Referencia>
            </CabecalhoBloco>
            <Linhas>
                {trecho.linhas.map((linha) => (
                    <Linha key={linha.numero} $destacada={linha.destacada}>
                        <NumeroLinha>{linha.numero}</NumeroLinha>
                        <TextoLinha>{linha.texto || " "}</TextoLinha>
                    </Linha>
                ))}
            </Linhas>
        </Bloco>
    );
}
