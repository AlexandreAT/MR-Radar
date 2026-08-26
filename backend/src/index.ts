import express, { Express } from "express";
import { configuracao, ValidarConfiguracao } from "./configuracao/Configuracao";
import { CriarRotasRevisao } from "./controllers/RevisaoController";
import { ClienteGitLab } from "./integracao/gitlab/ClienteGitLab";
import { LogicaMergeRequest } from "./logica/LogicaMergeRequest";
import { LogicaRevisao } from "./logica/LogicaRevisao";
import { LogicaTrechoCodigo } from "./logica/LogicaTrechoCodigo";
import { LiberarOrigemLocal, SomenteLeitura } from "./middlewares/SomenteLeitura";
import { RotaNaoEncontrada, TratadorDeErros } from "./middlewares/TratadorDeErros";

/** Prefixo de todas as rotas do backend. */
const PREFIXO_API = "/api";

/**
 * Monta a aplicação Express com os middlewares e as rotas do dashboard.
 * @returns Aplicação pronta para escutar em uma porta.
 */
function criarAplicacao(): Express {
    const cliente = new ClienteGitLab(configuracao);
    const logicaTrechoCodigo = new LogicaTrechoCodigo(cliente, configuracao);
    const logicaRevisao = new LogicaRevisao(cliente, logicaTrechoCodigo, configuracao);
    const logicaMergeRequest = new LogicaMergeRequest(cliente);

    const aplicacao: Express = express();
    aplicacao.disable("x-powered-by");
    aplicacao.use(LiberarOrigemLocal);
    aplicacao.use(SomenteLeitura);
    aplicacao.use(PREFIXO_API, CriarRotasRevisao(logicaRevisao, logicaMergeRequest, configuracao));
    aplicacao.use(RotaNaoEncontrada);
    aplicacao.use(TratadorDeErros);

    return aplicacao;
}

/**
 * Escreve no console o estado da configuração ao subir o servidor.
 * @returns Nada.
 */
function avisarProblemasDeConfiguracao(): void {
    const problemas: string[] = ValidarConfiguracao(configuracao);

    if (!problemas.length) {
        console.log(`GitLab configurado: ${configuracao.urlGitLab}`);
        return;
    }

    console.warn("Atenção: o backend subiu, mas ainda não consegue consultar o GitLab.");
    problemas.forEach((problema) => console.warn(` - ${problema}`));
    console.warn(`Crie o arquivo backend/.env a partir de backend/.env.example e preencha os dados.`);
}

criarAplicacao().listen(configuracao.porta, configuracao.host, () => {
    console.log(`Backend somente leitura em http://${configuracao.host}:${configuracao.porta}${PREFIXO_API}`);
    avisarProblemasDeConfiguracao();
});
