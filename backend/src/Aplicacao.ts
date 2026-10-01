import express, { Express } from "express";
import { ConfiguracaoApp, Provedor } from "./configuracao/types";
import { CriarRotasHoras } from "./controllers/HorasController";
import { CriarRotasRevisao } from "./controllers/RevisaoController";
import { ClienteHoras } from "./integracao/ClienteHoras";
import { ClienteRevisao } from "./integracao/ClienteRevisao";
import { ClienteDemo } from "./integracao/demo/ClienteDemo";
import { ClienteGitHub } from "./integracao/github/ClienteGitHub";
import { ClienteGitLab } from "./integracao/gitlab/ClienteGitLab";
import { LogicaHoras } from "./logica/LogicaHoras";
import { LogicaMergeRequest } from "./logica/LogicaMergeRequest";
import { LogicaRevisao } from "./logica/LogicaRevisao";
import { LogicaTrechoCodigo } from "./logica/LogicaTrechoCodigo";
import { LiberarOrigemLocal, SomenteLeitura } from "./middlewares/SomenteLeitura";
import { RotaNaoEncontrada, TratadorDeErros } from "./middlewares/TratadorDeErros";

/** Prefixo de todas as rotas do backend. */
export const PREFIXO_API = "/api";

/**
 * Escolhe o adapter do provedor ativo. GitLab e Demo implementam `ClienteHoras` também — é o que
 * decide, logo abaixo, se a rota de Horas é registrada.
 * @param configuracao Configuração da aplicação.
 * @returns Cliente pronto, já no formato que `ClienteRevisao` espera.
 */
function criarCliente(configuracao: ConfiguracaoApp): ClienteRevisao {
    if (configuracao.provedor === Provedor.GitLab)
        return new ClienteGitLab(configuracao);

    if (configuracao.provedor === Provedor.Demo)
        return new ClienteDemo(configuracao);

    return new ClienteGitHub(configuracao);
}

/**
 * Monta a aplicação Express com os middlewares e as rotas do dashboard.
 *
 * A página de horas existe no GitLab e no modo Demo: ela é montada em cima do Time tracking, que
 * o GitHub não tem. No modo GitHub a rota simplesmente não é registrada.
 *
 * Fica separada do `index.ts` (que lê o .env e sobe o servidor) para o script de geração de
 * fixtures poder montar uma aplicação com `provedor: Demo` sem carregar .env nenhum.
 * @param configuracao Configuração da aplicação.
 * @returns Aplicação pronta para escutar em uma porta.
 */
export function criarAplicacao(configuracao: ConfiguracaoApp): Express {
    const cliente: ClienteRevisao = criarCliente(configuracao);

    const logicaTrechoCodigo = new LogicaTrechoCodigo(cliente, configuracao);
    const logicaRevisao = new LogicaRevisao(cliente, logicaTrechoCodigo, configuracao);
    const logicaMergeRequest = new LogicaMergeRequest(cliente);

    const aplicacao: Express = express();
    aplicacao.disable("x-powered-by");
    aplicacao.use(LiberarOrigemLocal);
    aplicacao.use(SomenteLeitura);
    aplicacao.use(PREFIXO_API, CriarRotasRevisao(logicaRevisao, logicaMergeRequest, configuracao));

    // Seguro por construção: criarCliente só devolve ClienteGitHub quando o provedor é GitHub —
    // nos outros dois (GitLab e Demo) o cliente sempre implementa ClienteHoras também.
    if (configuracao.provedor !== Provedor.GitHub)
        aplicacao.use(PREFIXO_API, CriarRotasHoras(new LogicaHoras(cliente as unknown as ClienteHoras, configuracao), configuracao));

    aplicacao.use(RotaNaoEncontrada);
    aplicacao.use(TratadorDeErros);

    return aplicacao;
}
