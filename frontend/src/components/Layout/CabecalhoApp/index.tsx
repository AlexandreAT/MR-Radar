import { Etiqueta, TomEtiqueta } from "src/components/BasicComponents";
import {
    Aba,
    Abas,
    Avisos,
    Cabecalho,
    CaixaAviso,
    CaixaErro,
    Conteudo,
    DicaErro,
    Direita,
    EnderecoGitLab,
    TextoAviso,
    TextoErro,
    Titulo,
} from "./styles";
import { ABAS, PropriedadesCabecalhoApp, TEXTO_CABECALHO } from "./types";

export function CabecalhoApp({ pagina, configuracao, erroConfiguracao, onAlterarPagina }: PropriedadesCabecalhoApp) {
    return (
        <Cabecalho>
            <Conteudo>
                <Titulo>{TEXTO_CABECALHO.TITULO}</Titulo>
                <Abas>
                    {ABAS.map((aba) => (
                        <Aba
                            key={aba.pagina}
                            type="button"
                            $ativa={aba.pagina === pagina}
                            aria-current={aba.pagina === pagina ? "page" : undefined}
                            onClick={() => onAlterarPagina(aba.pagina)}
                        >
                            {aba.rotulo}
                        </Aba>
                    ))}
                </Abas>
                <Direita>
                    {configuracao?.urlGitLab && <EnderecoGitLab>{configuracao.urlGitLab}</EnderecoGitLab>}
                    <Etiqueta tom={TomEtiqueta.Resolvido}>{TEXTO_CABECALHO.ETIQUETA_SOMENTE_LEITURA}</Etiqueta>
                </Direita>
            </Conteudo>

            {(erroConfiguracao || (configuracao && configuracao.problemas.length > 0)) && (
                <Avisos>
                    {erroConfiguracao && (
                        <CaixaErro>
                            <TextoErro>{erroConfiguracao.mensagem}</TextoErro>
                            {erroConfiguracao.dica && <DicaErro>{erroConfiguracao.dica}</DicaErro>}
                        </CaixaErro>
                    )}
                    {configuracao && configuracao.problemas.length > 0 && (
                        <CaixaAviso>
                            <TextoAviso>{TEXTO_CABECALHO.BACKEND_NAO_CONFIGURADO}</TextoAviso>
                            {configuracao.problemas.map((problema) => (
                                <TextoAviso key={problema}>{problema}</TextoAviso>
                            ))}
                        </CaixaAviso>
                    )}
                </Avisos>
            )}
        </Cabecalho>
    );
}
