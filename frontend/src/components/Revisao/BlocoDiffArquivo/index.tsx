import { StatusArquivoAlterado } from "src/api/Revisao/types";
import { Aviso, Bloco, CabecalhoBloco, Caminho, CaminhoAntigo, Contadores, Linha, Linhas, NumeroLinha, TextoLinha } from "./styles";
import { PropriedadesBlocoDiffArquivo, TEXTO_BLOCO, TEXTO_POR_STATUS } from "./types";

export function BlocoDiffArquivo({ arquivo }: PropriedadesBlocoDiffArquivo) {
    return (
        <Bloco>
            <CabecalhoBloco>
                {arquivo.status === StatusArquivoAlterado.Renomeado && arquivo.caminhoAntigo && (
                    <>
                        <CaminhoAntigo>{arquivo.caminhoAntigo}</CaminhoAntigo>
                        {TEXTO_BLOCO.SETA_RENOMEADO}
                    </>
                )}
                <Caminho>{arquivo.caminho}</Caminho>
                {TEXTO_BLOCO.SEPARADOR}
                {TEXTO_POR_STATUS[arquivo.status]}
                {(arquivo.adicoes !== null || arquivo.remocoes !== null) && (
                    <>
                        {TEXTO_BLOCO.SEPARADOR}
                        <Contadores>
                            <span>+{arquivo.adicoes ?? 0}</span> <span>-{arquivo.remocoes ?? 0}</span>
                        </Contadores>
                    </>
                )}
            </CabecalhoBloco>

            {arquivo.linhas ? (
                <Linhas>
                    {arquivo.linhas.map((linha, indice) => (
                        <Linha key={indice} $tipo={linha.tipo}>
                            <NumeroLinha>{linha.numeroAntigo ?? ""}</NumeroLinha>
                            <NumeroLinha>{linha.numeroNovo ?? ""}</NumeroLinha>
                            <TextoLinha>{linha.texto || " "}</TextoLinha>
                        </Linha>
                    ))}
                </Linhas>
            ) : (
                <Aviso>{arquivo.motivoIndisponivel}</Aviso>
            )}
        </Bloco>
    );
}
