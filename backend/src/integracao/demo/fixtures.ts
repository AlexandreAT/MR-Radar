import { DiscussaoNormalizada, NotaNormalizada } from "../../logica/types";
import {
    ArquivoAlterado,
    Autor,
    LadoDiff,
    MergeRequestAberto,
    MergeRequestResumo,
    SituacaoMergeRequest,
    StatusArquivoAlterado,
    StatusChamado,
    TipoLinhaDiff,
} from "../../models/Revisao/types";
import { GetLinguagem } from "../../utilidades/Linguagem";
import { GetDataDeHoje, GetSegundaDaSemana, SomarDias } from "../../utilidades/Semana";
import { CommitGitLab, EventoGitLab, IssueGitLab, MergeRequestRelacionadoGitLab, NotaGitLab, TipoNoteableGitLab, UsuarioGitLab } from "../gitlab/types";

/**
 * Dados 100% fictícios usados pelo ClienteDemo — nenhum nome aqui representa projeto, chamado,
 * empresa ou pessoa real. Tudo foi inventado só para esta vitrine.
 */

/** Identificador do projeto e do Merge Request aberto usados na demonstração. */
export const PROJETO_DEMO = "42";
export const CAMINHO_PROJETO_DEMO = "equipe-exemplo/projeto-demo";
export const MR_ABERTO_IID = 7;

/** Segunda-feira da semana atual — âncora de todas as datas "desta semana" da demonstração. */
const SEGUNDA_DESTA_SEMANA: string = GetSegundaDaSemana(GetDataDeHoje());

/**
 * Monta um instante ISO a partir da segunda-feira da semana atual mais um deslocamento em dias.
 * @param deslocamentoDias Dias a somar à segunda-feira (0 = segunda, 4 = sexta).
 * @param hora Hora do dia, no formato "HH:MM:SS".
 * @returns Instante ISO completo.
 */
function instanteDaSemana(deslocamentoDias: number, hora: string): string {
    return `${SomarDias(SEGUNDA_DESTA_SEMANA, deslocamentoDias)}T${hora}.000Z`;
}

const AUTORES_DEMO: Record<string, Autor> = {
    dono: { nome: "Conta de demonstração", usuario: "demo", urlAvatar: null },
    revisorUm: { nome: "Revisor 1", usuario: "revisor-1", urlAvatar: null },
    revisorDois: { nome: "Revisor 2", usuario: "revisor-2", urlAvatar: null },
};

/** Conteúdo fictício dos arquivos citados pelos comentários — GetArquivoBruto ignora o "ref". */
export const ARQUIVOS_FICTICIOS: Record<string, string> = {
    "src/Controllers/PedidoController.cs": [
        "using System;",
        "using System.Threading.Tasks;",
        "using Microsoft.AspNetCore.Mvc;",
        "",
        "namespace Exemplo.Api.Controllers",
        "{",
        "    public class PedidoController : ControllerBase",
        "    {",
        "        private readonly IPedidoService _pedidoService;",
        "",
        "        public PedidoController(IPedidoService pedidoService)",
        "        {",
        "            _pedidoService = pedidoService;",
        "        }",
        "",
        "        [HttpGet(\"{id}\")]",
        "        public async Task<IActionResult> ObterPorId(int id)",
        "        {",
        "            var pedido = await _pedidoService.ObterPorIdAsync(id);",
        "",
        "            if (pedido == null)",
        "                return NotFound();",
        "",
        "            return Ok(pedido);",
        "        }",
        "",
        "        [HttpPost(\"{id}/cancelar\")]",
        "        public async Task<IActionResult> Cancelar(int id)",
        "        {",
        "            var sucesso = await _pedidoService.CancelarAsync(id);",
        "",
        "            if (!sucesso)",
        "                return BadRequest(\"Não foi possível cancelar este pedido.\");",
        "",
        "            return NoContent();",
        "        }",
        "",
        "        private static decimal CalcularDesconto(decimal valorTotal, int quantidadeItens)",
        "        {",
        "            if (quantidadeItens >= 10)",
        "                return valorTotal * 0.1m;",
        "",
        "            return 0;",
        "        }",
        "    }",
        "}",
    ].join("\n"),
    "src/hooks/usePedido.ts": [
        "import { useCallback, useEffect, useState } from \"react\";",
        "import { buscarPedidos, cancelarPedido } from \"../services/PedidoService\";",
        "import { Pedido } from \"../types/Pedido\";",
        "",
        "export function usePedido(pagina: number) {",
        "    const [pedidos, setPedidos] = useState<Pedido[]>([]);",
        "    const [carregando, setCarregando] = useState(false);",
        "    const [erro, setErro] = useState<string | null>(null);",
        "",
        "    const carregar = useCallback(async () => {",
        "        setCarregando(true);",
        "",
        "        try {",
        "            const resposta = await buscarPedidos(pagina);",
        "            setPedidos(resposta.itens);",
        "            setErro(null);",
        "        } catch (falha) {",
        "            setErro(\"Não foi possível carregar os pedidos.\");",
        "        } finally {",
        "            setCarregando(false);",
        "        }",
        "    }, [pagina]);",
        "",
        "    useEffect(() => {",
        "        carregar();",
        "    }, [carregar]);",
        "",
        "    async function handleCancelar(id: number) {",
        "        await cancelarPedido(id);",
        "        await carregar();",
        "    }",
        "",
        "    return { pedidos, carregando, erro, handleCancelar };",
        "}",
    ].join("\n"),
};

/**
 * Monta uma nota normalizada fictícia.
 * @param id Identificador da nota.
 * @param autor Autor da nota.
 * @param corpo Texto do comentário.
 * @param deslocamentoDias Dia da semana atual em que a nota foi escrita.
 * @returns Nota pronta para uma discussão.
 */
function nota(id: number, autor: Autor, corpo: string, deslocamentoDias: number): NotaNormalizada {
    const criadoEm: string = instanteDaSemana(deslocamentoDias, "09:00:00");

    return { id, url: "#", autor, corpo, criadoEm, atualizadoEm: criadoEm };
}

/** As ~15 threads de comentário do Merge Request aberto, cobrindo os 5 rótulos de revisão. */
export const DISCUSSOES_MR_ABERTO: DiscussaoNormalizada[] = [
    {
        id: "1",
        notaPrincipal: nota(1, AUTORES_DEMO.revisorUm, "suggestion: Acho melhor devolver um DTO em vez da entidade direto — evita expor campo interno sem querer.", 0),
        respostas: [],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 19, linhaFinal: 19, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "2",
        notaPrincipal: nota(2, AUTORES_DEMO.revisorDois, "nit: dá pra inverter e usar early return aqui, mas já está bom assim.", 0),
        respostas: [],
        resolvivel: true,
        resolvido: true,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 21, linhaFinal: 22, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "3",
        notaPrincipal: nota(3, AUTORES_DEMO.revisorUm, "question: por que o serviço é injetado como implementação concreta em vez de interface só leitura?", 1),
        respostas: [nota(16, AUTORES_DEMO.dono, "Boa, era pra ser a interface mesmo — ajusto.", 1)],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 9, linhaFinal: 9, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "4",
        notaPrincipal: nota(4, AUTORES_DEMO.revisorDois, "issue: esse 10 é um número mágico — vale virar uma constante com nome.", 1),
        respostas: [],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 40, linhaFinal: 40, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "5",
        notaPrincipal: nota(5, AUTORES_DEMO.revisorUm, "praise: mensagem de erro clara aqui, facilita muito pra quem for debugar depois.", 1),
        respostas: [],
        resolvivel: true,
        resolvido: true,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 33, linhaFinal: 33, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "6",
        notaPrincipal: nota(6, AUTORES_DEMO.revisorDois, "suggestion: renomear \"sucesso\" para algo tipo \"pedidoCancelado\" deixaria mais claro no uso.", 2),
        respostas: [nota(17, AUTORES_DEMO.dono, "Faz sentido, troco no próximo commit.", 2)],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 30, linhaFinal: 30, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "7",
        notaPrincipal: nota(7, AUTORES_DEMO.revisorUm, "Rodei localmente e ficou ok, só os pontos que já comentei acima no controller.", 2),
        respostas: [],
        resolvivel: false,
        resolvido: false,
        posicao: { caminhoArquivo: null, linhaInicial: null, linhaFinal: null, lado: null, refs: [] },
    },
    {
        id: "8",
        notaPrincipal: nota(8, AUTORES_DEMO.revisorDois, "nit: poderia logar o erro original aqui, hoje ele só vira uma mensagem genérica.", 2),
        respostas: [],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 18, linhaFinal: 18, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "9",
        notaPrincipal: nota(9, AUTORES_DEMO.revisorUm, "question: se \"pagina\" mudar enquanto ainda está carregando, o quê acontece com a resposta antiga?", 3),
        respostas: [
            nota(18, AUTORES_DEMO.dono, "Hoje nada — ela ainda pode sobrescrever o estado com um resultado desatualizado.", 3),
            nota(19, AUTORES_DEMO.revisorUm, "Vale um AbortController então, parecido com o que o resto do projeto já faz.", 3),
        ],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 14, linhaFinal: 14, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "10",
        notaPrincipal: nota(10, AUTORES_DEMO.revisorDois, "issue: falta tratar o caso de \"pedidos\" vir indefinido numa borda específica da API.", 3),
        respostas: [],
        resolvivel: true,
        resolvido: true,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 6, linhaFinal: 6, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "11",
        notaPrincipal: nota(11, AUTORES_DEMO.revisorUm, "nit: os imports dessa primeira linha podem ficar em ordem alfabética.", 3),
        respostas: [],
        resolvivel: true,
        resolvido: true,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 1, linhaFinal: 1, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "12",
        notaPrincipal: nota(12, AUTORES_DEMO.revisorDois, "suggestion: mostrar um aviso de sucesso depois de cancelar deixaria a experiência mais clara.", 4),
        respostas: [],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 29, linhaFinal: 29, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "13",
        notaPrincipal: nota(13, AUTORES_DEMO.revisorUm, "Boa, ficou bem direto esse hook — só os pontos acima.", 4),
        respostas: [],
        resolvivel: false,
        resolvido: false,
        posicao: { caminhoArquivo: null, linhaInicial: null, linhaFinal: null, lado: null, refs: [] },
    },
    {
        id: "14",
        notaPrincipal: nota(14, AUTORES_DEMO.revisorDois, "praise: gostei da simplicidade desse endpoint, direto ao ponto.", 4),
        respostas: [],
        resolvivel: true,
        resolvido: true,
        posicao: { caminhoArquivo: "src/Controllers/PedidoController.cs", linhaInicial: 17, linhaFinal: 17, lado: LadoDiff.Novo, refs: ["main"] },
    },
    {
        id: "15",
        notaPrincipal: nota(15, AUTORES_DEMO.revisorUm, "question: \"handleCancelar\" não devolve nada — a tela que chama precisa saber se deu certo?", 4),
        respostas: [],
        resolvivel: true,
        resolvido: false,
        posicao: { caminhoArquivo: "src/hooks/usePedido.ts", linhaInicial: 33, linhaFinal: 33, lado: LadoDiff.Novo, refs: ["main"] },
    },
];

/** O Merge Request aberto rico, exibido na lista e usado para todas as consultas de comentários/diff. */
export const MR_ABERTO: MergeRequestAberto = {
    projetoId: PROJETO_DEMO,
    caminhoProjeto: CAMINHO_PROJETO_DEMO,
    iid: MR_ABERTO_IID,
    titulo: "Adiciona paginação e cache no endpoint de relatórios",
    url: "#",
    situacao: SituacaoMergeRequest.Aberto,
    statusChamado: StatusChamado.Testing,
    chamadoValido: true,
    branchOrigem: "feature/relatorios-paginados",
    branchDestino: "main",
    atualizadoEm: instanteDaSemana(4, "16:00:00"),
    autor: AUTORES_DEMO.dono,
    temThreadsAbertas: true,
    totalComentarios: DISCUSSOES_MR_ABERTO.length,
};

export const RESUMO_MR_ABERTO: MergeRequestResumo = {
    iid: MR_ABERTO_IID,
    titulo: MR_ABERTO.titulo,
    url: MR_ABERTO.url,
    situacao: "opened",
    autor: MR_ABERTO.autor,
    branchOrigem: MR_ABERTO.branchOrigem,
    branchDestino: MR_ABERTO.branchDestino,
};

/** Termo de pesquisa fixo que bate com o Merge Request aberto. */
export const TERMO_PESQUISA_ABERTO = "relatorios";

/** Termo de pesquisa fixo que bate com um dos Merge Requests encerrados. */
export const TERMO_PESQUISA_ENCERRADO = "login";

/**
 * Gera uma lista de Merge Requests encerrados fictícios.
 * @param quantidade Quantos itens gerar.
 * @param iidInicial Primeiro IID usado.
 * @returns Merge Requests encerrados, do mais recente para o mais antigo.
 */
function gerarEncerrados(quantidade: number, iidInicial: number): MergeRequestAberto[] {
    const titulos: string[] = [
        "Corrige validação de e-mail no formulário de login",
        "Atualiza dependências de segurança",
        "Remove código morto do módulo de notificações",
        "Ajusta timeout da fila de processamento",
        "Corrige quebra de layout em telas pequenas",
        "Adiciona índice na tabela de pedidos",
        "Melhora mensagem de erro de autenticação",
        "Padroniza nomes de rotas da API",
        "Corrige vazamento de memória no worker",
        "Atualiza biblioteca de geração de PDF",
    ];

    return Array.from({ length: quantidade }, (_, indice) => {
        const iid: number = iidInicial + indice;
        const mesclado: boolean = indice % 3 !== 0;

        return {
            projetoId: PROJETO_DEMO,
            caminhoProjeto: CAMINHO_PROJETO_DEMO,
            iid,
            titulo: titulos[indice % titulos.length],
            url: "#",
            situacao: mesclado ? SituacaoMergeRequest.Mesclado : SituacaoMergeRequest.Fechado,
            statusChamado: null,
            chamadoValido: null,
            branchOrigem: `feature/item-${iid}`,
            branchDestino: "main",
            atualizadoEm: SomarDias(GetDataDeHoje(), -(indice + 1)) + "T12:00:00.000Z",
            autor: indice % 2 === 0 ? AUTORES_DEMO.dono : AUTORES_DEMO.revisorUm,
            temThreadsAbertas: false,
            totalComentarios: 0,
        };
    });
}

/** ~25 Merge Requests encerrados no escopo "criados por mim" — prova a paginação real (2 páginas). */
export const MRS_ENCERRADOS_CRIADOS_POR_MIM: MergeRequestAberto[] = gerarEncerrados(25, 100);

/** Um conjunto pequeno no escopo "atribuídos a mim" — deliberadamente 1 página só. */
export const MRS_ENCERRADOS_ATRIBUIDOS_A_MIM: MergeRequestAberto[] = gerarEncerrados(6, 200);

/** Arquivos alterados do Merge Request aberto, exibidos no "Ver alterações". */
export const ARQUIVOS_ALTERADOS: ArquivoAlterado[] = [
    {
        caminho: "src/Controllers/PedidoController.cs",
        caminhoAntigo: null,
        status: StatusArquivoAlterado.Modificado,
        linguagem: GetLinguagem("src/Controllers/PedidoController.cs"),
        linhas: [
            { tipo: TipoLinhaDiff.Contexto, numeroAntigo: 15, numeroNovo: 15, texto: "        [HttpGet(\"{id}\")]" },
            { tipo: TipoLinhaDiff.Contexto, numeroAntigo: 16, numeroNovo: 16, texto: "        public async Task<IActionResult> ObterPorId(int id)" },
            { tipo: TipoLinhaDiff.Contexto, numeroAntigo: 17, numeroNovo: 17, texto: "        {" },
            { tipo: TipoLinhaDiff.Removida, numeroAntigo: 18, numeroNovo: null, texto: "            var pedido = _pedidoService.ObterPorId(id);" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 18, texto: "            var pedido = await _pedidoService.ObterPorIdAsync(id);" },
            { tipo: TipoLinhaDiff.Contexto, numeroAntigo: 19, numeroNovo: 19, texto: "" },
            { tipo: TipoLinhaDiff.Contexto, numeroAntigo: 20, numeroNovo: 20, texto: "            if (pedido == null)" },
        ],
        motivoIndisponivel: null,
        adicoes: 1,
        remocoes: 1,
    },
    {
        caminho: "src/hooks/usePedido.ts",
        caminhoAntigo: null,
        status: StatusArquivoAlterado.Adicionado,
        linguagem: GetLinguagem("src/hooks/usePedido.ts"),
        linhas: [
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 1, texto: "import { useCallback, useEffect, useState } from \"react\";" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 2, texto: "import { buscarPedidos, cancelarPedido } from \"../services/PedidoService\";" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 3, texto: "import { Pedido } from \"../types/Pedido\";" },
        ],
        motivoIndisponivel: null,
        adicoes: 34,
        remocoes: 0,
    },
    {
        caminho: "src/services/PedidoService.ts",
        caminhoAntigo: null,
        status: StatusArquivoAlterado.Modificado,
        linguagem: GetLinguagem("src/services/PedidoService.ts"),
        linhas: [
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 12, texto: "export async function cancelarPedido(id: number): Promise<void> {" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 13, texto: "    await api.post(`/pedidos/${id}/cancelar`);" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 14, texto: "}" },
        ],
        motivoIndisponivel: null,
        adicoes: 3,
        remocoes: 0,
    },
    {
        caminho: "src/types/Pedido.ts",
        caminhoAntigo: null,
        status: StatusArquivoAlterado.Adicionado,
        linguagem: GetLinguagem("src/types/Pedido.ts"),
        linhas: [
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 1, texto: "export interface Pedido {" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 2, texto: "    id: number;" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 3, texto: "    status: string;" },
            { tipo: TipoLinhaDiff.Adicionada, numeroAntigo: null, numeroNovo: 4, texto: "}" },
        ],
        motivoIndisponivel: null,
        adicoes: 4,
        remocoes: 0,
    },
    {
        caminho: "docs/relatorio-exemplo.pdf",
        caminhoAntigo: null,
        status: StatusArquivoAlterado.Adicionado,
        linguagem: GetLinguagem("docs/relatorio-exemplo.pdf"),
        linhas: null,
        motivoIndisponivel: "Arquivo grande demais para exibir aqui.",
        adicoes: null,
        remocoes: null,
    },
];

// ---------------------------------------------------------------------------
// Horas (ClienteHoras) — só usado quando a aba Horas está disponível no demo.
// ---------------------------------------------------------------------------

/** Usuário fictício dono do token, no formato bruto do GitLab. */
export const USUARIO_DEMO: UsuarioGitLab = {
    id: 999,
    username: "demo",
    name: "Conta de demonstração",
    email: "demo@example.invalid",
    commit_email: "demo@example.invalid",
};

/** As três issues fictícias atribuídas, movimentadas nesta semana. */
export const ISSUES_ATRIBUIDAS: IssueGitLab[] = [
    {
        id: 9001,
        iid: 201,
        project_id: Number(PROJETO_DEMO),
        title: "Paginação do endpoint de relatórios",
        state: "opened",
        web_url: "#",
        updated_at: instanteDaSemana(1, "11:00:00"),
        references: { short: "#201", relative: "#201", full: `${CAMINHO_PROJETO_DEMO}#201` },
        time_stats: { time_estimate: 0, total_time_spent: 12600, human_time_estimate: null, human_total_time_spent: "3h 30m" },
    },
    {
        id: 9002,
        iid: 202,
        project_id: Number(PROJETO_DEMO),
        title: "Cache de relatórios gerados",
        state: "opened",
        web_url: "#",
        updated_at: instanteDaSemana(2, "11:00:00"),
        references: { short: "#202", relative: "#202", full: `${CAMINHO_PROJETO_DEMO}#202` },
        time_stats: { time_estimate: 0, total_time_spent: 10800, human_time_estimate: null, human_total_time_spent: "3h" },
    },
    {
        id: 9003,
        iid: 203,
        project_id: Number(PROJETO_DEMO),
        title: "Corrige validação de e-mail no formulário de login",
        state: "closed",
        web_url: "#",
        updated_at: instanteDaSemana(4, "11:00:00"),
        references: { short: "#203", relative: "#203", full: `${CAMINHO_PROJETO_DEMO}#203` },
        time_stats: { time_estimate: 0, total_time_spent: 10800, human_time_estimate: null, human_total_time_spent: "3h" },
    },
];

/**
 * Monta uma nota de sistema fictícia de tempo lançado, no formato que `TempoGasto.ts` reconhece.
 * @param id Identificador da nota.
 * @param horas Texto da duração, no mesmo formato que o GitLab aceita ("2h", "1h 30m").
 * @param deslocamentoDias Dia da semana atual em que o tempo foi lançado.
 * @returns Nota de sistema pronta.
 */
function notaDeTempo(id: number, horas: string, deslocamentoDias: number): NotaGitLab {
    const criadoEm: string = instanteDaSemana(deslocamentoDias, "17:30:00");

    return {
        id,
        body: `added ${horas} of time spent`,
        author: { id: USUARIO_DEMO.id, name: USUARIO_DEMO.name, username: USUARIO_DEMO.username, avatar_url: null, web_url: "#" },
        created_at: criadoEm,
        updated_at: criadoEm,
        system: true,
        resolvable: false,
    };
}

/** Notas de tempo gasto, por issue — segunda e terça na #201, quarta na #202, quinta e sexta na #203. */
export const NOTAS_POR_ISSUE: Record<number, NotaGitLab[]> = {
    201: [notaDeTempo(1, "2h", 0), notaDeTempo(2, "1h 30m", 1)],
    202: [notaDeTempo(3, "3h", 2)],
    203: [notaDeTempo(4, "1h", 3), notaDeTempo(5, "2h", 4)],
};

/** Um Merge Request relacionado por issue — é por onde a elegibilidade encontra os commits. */
export const RELACIONADOS_POR_ISSUE: Record<number, MergeRequestRelacionadoGitLab[]> = {
    201: [{ iid: 301, project_id: Number(PROJETO_DEMO) }],
    202: [],
    203: [{ iid: 303, project_id: Number(PROJETO_DEMO) }],
};

/**
 * Monta um commit fictício do dono do token.
 * @param deslocamentoDias Dia da semana atual em que o commit foi feito.
 * @returns Commit pronto.
 */
function commit(deslocamentoDias: number): CommitGitLab {
    return { author_name: USUARIO_DEMO.name, author_email: USUARIO_DEMO.email, committed_date: instanteDaSemana(deslocamentoDias, "16:45:00") };
}

/** Commits por Merge Request relacionado — só #301 e #303 têm; #202 fica sem (sem pontinho). */
export const COMMITS_POR_MR: Record<number, CommitGitLab[]> = {
    301: [commit(0), commit(1)],
    303: [commit(3), commit(4)],
};

/**
 * Eventos de comentário do dono do token — um por dia útil, exceto quinta (de propósito, para
 * mostrar o indicador de "sem comentário no dia" na tela).
 */
export const EVENTOS_DE_COMENTARIO: EventoGitLab[] = [0, 1, 2, 4].map((deslocamentoDias) => ({
    created_at: instanteDaSemana(deslocamentoDias, "18:00:00"),
    note: { noteable_type: TipoNoteableGitLab.Issue, system: false },
}));
