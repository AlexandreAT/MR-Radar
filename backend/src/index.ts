import express, { Express } from "express";
import { configuracao, ValidarConfiguracao } from "./configuracao/Configuracao";
import { Provedor } from "./configuracao/types";
import { CriarRotasHoras } from "./controllers/HorasController";
import { CriarRotasRevisao } from "./controllers/RevisaoController";
import { ClienteRevisao } from "./integracao/ClienteRevisao";
import { ClienteGitHub } from "./integracao/github/ClienteGitHub";
import { ClienteGitLab } from "./integracao/gitlab/ClienteGitLab";
import { LogicaHoras } from "./logica/LogicaHoras";
import { LogicaMergeRequest } from "./logica/LogicaMergeRequest";
import { LogicaRevisao } from "./logica/LogicaRevisao";
import { LogicaTrechoCodigo } from "./logica/LogicaTrechoCodigo";
import { LiberarOrigemLocal, SomenteLeitura } from "./middlewares/SomenteLeitura";
import { RotaNaoEncontrada, TratadorDeErros } from "./middlewares/TratadorDeErros";

/** Prefixo de todas as rotas do backend. */
const PREFIXO_API = "/api";

/** Nome exibido de cada provedor, usado nas mensagens do console. */
const NOME_DO_PROVEDOR: Record<Provedor, string> = {
    [Provedor.GitLab]: "GitLab",
    [Provedor.GitHub]: "GitHub",
};

/**
 * Monta a aplicação Express com os middlewares e as rotas do dashboard.
 *
 * A página de horas existe só no GitLab: ela é montada em cima do Time tracking, que o GitHub
 * não tem. No modo GitHub a rota simplesmente não é registrada.
 * @returns Aplicação pronta para escutar em uma porta.
 */
function criarAplicacao(): Express {
    const ehGitLab: boolean = configuracao.provedor === Provedor.GitLab;
    const cliente: ClienteRevisao = ehGitLab ? new ClienteGitLab(configuracao) : new ClienteGitHub(configuracao);

    const logicaTrechoCodigo = new LogicaTrechoCodigo(cliente, configuracao);
    const logicaRevisao = new LogicaRevisao(cliente, logicaTrechoCodigo, configuracao);
    const logicaMergeRequest = new LogicaMergeRequest(cliente);

    const aplicacao: Express = express();
    aplicacao.disable("x-powered-by");
    aplicacao.use(LiberarOrigemLocal);
    aplicacao.use(SomenteLeitura);
    aplicacao.use(PREFIXO_API, CriarRotasRevisao(logicaRevisao, logicaMergeRequest, configuracao));

    if (cliente instanceof ClienteGitLab)
        aplicacao.use(PREFIXO_API, CriarRotasHoras(new LogicaHoras(cliente, configuracao), configuracao));

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
    const nome: string = NOME_DO_PROVEDOR[configuracao.provedor];

    if (!problemas.length) {
        console.log(`${nome} configurado: ${configuracao.urlBase}`);
        return;
    }

    console.warn(`Atenção: o backend subiu, mas ainda não consegue consultar o ${nome}.`);
    problemas.forEach((problema) => console.warn(` - ${problema}`));
    console.warn(`Crie o arquivo backend/.env a partir de backend/.env.example e preencha os dados.`);
}

criarAplicacao().listen(configuracao.porta, configuracao.host, () => {
    console.log(`Backend somente leitura em http://${configuracao.host}:${configuracao.porta}${PREFIXO_API}`);
    avisarProblemasDeConfiguracao();
});
