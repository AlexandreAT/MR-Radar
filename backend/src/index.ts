import { criarAplicacao, PREFIXO_API } from "./Aplicacao";
import { GetConfiguracao, ValidarConfiguracao } from "./configuracao/Configuracao";
import { ConfiguracaoApp, Provedor } from "./configuracao/types";

/** Nome exibido de cada provedor, usado nas mensagens do console. */
const NOME_DO_PROVEDOR: Record<Provedor, string> = {
    [Provedor.GitLab]: "GitLab",
    [Provedor.GitHub]: "GitHub",
    [Provedor.Demo]: "Demo",
};

/**
 * Escreve no console o estado da configuração ao subir o servidor.
 * @param configuracao Configuração lida do .env.
 * @returns Nada.
 */
function avisarProblemasDeConfiguracao(configuracao: ConfiguracaoApp): void {
    const problemas: string[] = ValidarConfiguracao(configuracao);
    const nome: string = NOME_DO_PROVEDOR[configuracao.provedor];

    if (!problemas.length) {
        console.log(`${nome} configurado: ${configuracao.urlBase}`);
        return;
    }

    console.warn(`Atenção: o backend subiu, mas ainda não consegue consultar o ${nome}.`);
    problemas.forEach((problema) => console.warn(` - ${problema}`));
    console.warn(`Crie o arquivo backend/.env a partir de backend/.env.example e preencha os dados.`);
}

const configuracao: ConfiguracaoApp = GetConfiguracao();

criarAplicacao(configuracao).listen(configuracao.porta, configuracao.host, () => {
    console.log(`Backend somente leitura em http://${configuracao.host}:${configuracao.porta}${PREFIXO_API}`);
    avisarProblemasDeConfiguracao(configuracao);
});
