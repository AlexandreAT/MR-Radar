import { Botao, Carregando, VarianteBotao } from "src/components/BasicComponents";
import { BlocoDiffArquivo } from "src/components/Revisao/BlocoDiffArquivo";
import { AreaRelativa } from "src/components/sharedStyles";
import {
    BotaoFechar,
    Cabecalho,
    Caixa,
    CaixaErro,
    CaminhoSelecao,
    Checkbox,
    DicaErro,
    ItemSelecao,
    LinhaAcoesSelecao,
    LinkExterno,
    ListaArquivos,
    ListaSelecao,
    PainelSelecao,
    Rodape,
    Sobreposicao,
    TextoErro,
    Titulo,
    Toolbar,
    Vazio,
} from "./styles";
import { PropriedadesModalAlteracoes, TEXTO_MODAL, TEXTO_POR_ESTADO_COPIA } from "./types";
import { useModalAlteracoes } from "./useModalAlteracoes";

export function ModalAlteracoes({ projetoId, mergeRequest, vocabulario, onFechar }: PropriedadesModalAlteracoes) {
    const {
        arquivos,
        proximaPagina,
        carregouAoMenosUmaVez,
        carregando,
        erro,
        mostrandoSelecao,
        selecionados,
        estadoCopia,
        handleVerAlteracoes,
        handleCarregarMais,
        handleAbrirSelecao,
        handleAlternarSelecao,
        handleMarcarTodos,
        handleDesmarcarTodos,
        handleConfirmarCopia,
    } = useModalAlteracoes({ projetoId, mergeRequest });

    return (
        <Sobreposicao onClick={onFechar}>
            <Caixa onClick={(evento) => evento.stopPropagation()}>
                <Cabecalho>
                    <Titulo>
                        {vocabulario.prefixoReferencia}
                        {mergeRequest.iid} {TEXTO_MODAL.SEPARADOR} {mergeRequest.titulo}
                    </Titulo>
                    <BotaoFechar type="button" onClick={onFechar} aria-label={TEXTO_MODAL.FECHAR}>
                        ×
                    </BotaoFechar>
                </Cabecalho>

                <Toolbar>
                    <LinkExterno href={mergeRequest.url} target="_blank" rel="noreferrer">
                        Abrir no {vocabulario.nomeProvedor}
                    </LinkExterno>
                    <Botao onClick={handleVerAlteracoes} desabilitado={carregouAoMenosUmaVez || carregando}>
                        {carregando && !carregouAoMenosUmaVez ? TEXTO_MODAL.CARREGANDO : TEXTO_MODAL.VER_ALTERACOES}
                    </Botao>
                    <Botao onClick={handleAbrirSelecao} desabilitado={!carregouAoMenosUmaVez || arquivos.length === 0}>
                        {TEXTO_POR_ESTADO_COPIA[estadoCopia]}
                    </Botao>
                </Toolbar>

                {erro && (
                    <CaixaErro>
                        <TextoErro>{erro.mensagem}</TextoErro>
                        {erro.dica && <DicaErro>{erro.dica}</DicaErro>}
                    </CaixaErro>
                )}

                {mostrandoSelecao && (
                    <PainelSelecao>
                        <LinhaAcoesSelecao>
                            <Botao onClick={handleMarcarTodos}>{TEXTO_MODAL.MARCAR_TODOS}</Botao>
                            <Botao onClick={handleDesmarcarTodos}>{TEXTO_MODAL.DESMARCAR_TODOS}</Botao>
                        </LinhaAcoesSelecao>
                        <ListaSelecao>
                            {arquivos.map((arquivo) => (
                                <ItemSelecao key={arquivo.caminho}>
                                    <Checkbox
                                        type="checkbox"
                                        checked={selecionados.has(arquivo.caminho)}
                                        onChange={() => handleAlternarSelecao(arquivo.caminho)}
                                    />
                                    <CaminhoSelecao>{arquivo.caminho}</CaminhoSelecao>
                                </ItemSelecao>
                            ))}
                        </ListaSelecao>
                        <Botao variante={VarianteBotao.Primario} onClick={handleConfirmarCopia} desabilitado={selecionados.size === 0}>
                            {TEXTO_MODAL.COPIAR_SELECIONADOS}
                        </Botao>
                    </PainelSelecao>
                )}

                {carregouAoMenosUmaVez && arquivos.length === 0 && <Vazio>{TEXTO_MODAL.SEM_ARQUIVOS}</Vazio>}

                {arquivos.length > 0 && (
                    <AreaRelativa>
                        <ListaArquivos>
                            {arquivos.map((arquivo) => (
                                <BlocoDiffArquivo key={arquivo.caminho} arquivo={arquivo} />
                            ))}
                        </ListaArquivos>
                        <Carregando ativo={carregando} />
                    </AreaRelativa>
                )}

                {proximaPagina !== null && (
                    <Rodape>
                        <Botao onClick={handleCarregarMais} desabilitado={carregando}>
                            {carregando ? TEXTO_MODAL.CARREGANDO : TEXTO_MODAL.CARREGAR_MAIS}
                        </Botao>
                    </Rodape>
                )}
            </Caixa>
        </Sobreposicao>
    );
}
