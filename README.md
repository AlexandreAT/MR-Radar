# MR Radar

> 🔎 **[Veja funcionando, sem instalar nada](#)** — demonstração pública com dados 100% fictícios, sem conexão nenhuma com GitLab ou GitHub de verdade.

Dashboard local que lista, em uma tela só, todos os comentários de revisão de um Merge Request do GitLab — ou de um Pull Request do GitHub — com o texto do comentário, o arquivo, a linha e o trecho de código marcado, para não precisar abrir thread por thread.

O provedor é escolhido em uma linha do `.env` (`PROVEDOR=gitlab` ou `PROVEDOR=github`). As telas e as funcionalidades são as mesmas nos dois; o que muda está em [Diferenças entre GitLab e GitHub](#diferenças-entre-gitlab-e-github).

São até duas páginas, escolhidas no cabeçalho:

- **Merge Requests** (**Pull Requests**, no GitHub) — os comentários de revisão de um Merge Request. Ao abrir, já mostra os seus Merge Requests abertos, antes de qualquer pesquisa.
- **Horas** — quanto tempo você lançou em cada dia da semana nos chamados que estão no seu nome, com a meta de 8h por dia. **Só existe no modo GitLab**, porque o GitHub não tem time tracking.

Roda inteiramente na sua máquina, usando o seu Personal Access Token, e **é somente leitura**.

---

## Segurança

Não existe versão hospedada com credencial nenhuma, de propósito: para usar de verdade (GitLab ou GitHub), você clona o repositório e coloca as suas credenciais no `backend/.env`, que fica apenas na sua máquina e está no `.gitignore`. Assim o seu token e os dados da sua conta nunca passam por terceiros nem vão para o repositório.

A única coisa hospedada publicamente é a demonstração (link no topo deste README): uma build estática do frontend, gerada a partir de um terceiro adapter (`PROVEDOR=demo`) com dados 100% fictícios. Ela não faz nenhuma chamada de rede a nenhum provedor, não lê nenhuma variável de `.env` e não tem backend nenhum rodando por trás — é só o frontend lendo arquivos JSON estáticos.

O projeto também não faz nenhuma alteração no GitLab nem no GitHub. Isso não é só uma convenção — está garantido em três camadas:

| Camada | Garantia |
| --- | --- |
| Cliente HTTP | `ExecutarGet` fixa `method: "GET"` e não tem como enviar corpo. Não existe nenhuma chamada `PUT`, `PATCH` ou `DELETE` no código, e existe um único `POST` — o descrito logo abaixo. |
| Backend | O middleware `SomenteLeitura` responde `405` para qualquer método que não seja `GET`, `HEAD` ou `OPTIONS`. |
| Token | O escopo recomendado é só de leitura (`read_api` no GitLab; permissões *read-only* no GitHub), que o próprio provedor impede de escrever. |

### A única exceção: o `POST` do GraphQL do GitHub

Saber se uma thread de review do GitHub está resolvida só é possível pela API GraphQL (`PullRequestReviewThread.isResolved`) — a API REST não expõe esse campo em lugar nenhum. E o GraphQL do GitHub aceita apenas `POST`, mesmo quando a operação é uma consulta.

Essa chamada vive sozinha em `backend/src/integracao/github/ExecutarGraphQLStatusResolucao.ts`, isolada de propósito:

- é a **única** função de `POST` do projeto, e **não recebe texto de consulta como parâmetro** — a consulta é uma constante fixa dentro do próprio arquivo;
- monta a requisição com o `https` do Node por conta própria, sem passar pelo cliente HTTP compartilhado, para que ninguém a reaproveite sem querer para outra coisa;
- confere, antes de enviar, que o texto da consulta não contém `mutation`;
- uma segunda operação GraphQL exigiria escrever outra função inteira, e não acrescentar um parâmetro a essa.

No modo GitLab esse arquivo nunca chega a ser carregado.

Além disso:

- o backend escuta somente em `127.0.0.1` (não fica exposto na rede);
- o token nunca sai do backend — o frontend não o recebe em nenhuma resposta, só um `tokenConfigurado: true/false`;
- em um eventual redirecionamento para outro domínio, o cabeçalho do token (`PRIVATE-TOKEN` ou `Authorization`) é removido antes de repetir a chamada;
- nada é gravado em banco, nem no provedor. O único armazenamento é o `localStorage` do navegador, que lembra o último projeto e número digitados.

---

## Pré-requisitos

- **Node.js 16.14 ou superior.**
- Acesso a uma instância do GitLab (gitlab.com ou self-hosted) **ou** uma conta do GitHub (github.com ou GitHub Enterprise Server).

---

## 1. Gerar o token de acesso

Gere só o token do provedor que você vai usar.

### GitLab

1. No GitLab, acesse **User Settings → Access Tokens**.
2. Crie um token com:
   - **Scope:** apenas `read_api`;
   - **Expiration date:** o prazo que preferir.
3. Copie o token — ele só aparece uma vez.

> Não use os escopos `api`, `write_repository` ou qualquer outro de escrita. O dashboard só precisa ler.

### GitHub

1. No GitHub, acesse **Settings → Developer settings → Personal access tokens → Fine-grained tokens**.
2. Em **Repository access**, escolha os repositórios que você quer acompanhar.
3. Em **Repository permissions**, marque como **Read-only** apenas:
   - **Contents** — para buscar o trecho de código;
   - **Pull requests** — para ler os Pull Requests, os comentários de revisão e o status resolvido das threads;
   - **Metadata** — obrigatória, o próprio GitHub já marca.
4. Copie o token — ele só aparece uma vez.

> Um token clássico com escopo `repo` também funciona, mas dá acesso de escrita ao repositório inteiro. O fine-grained em read-only é a opção segura, e é a recomendada aqui.
>
> A escolha em **Repository access** define o que o dashboard enxerga: a lista de Pull Requests abertos só mostra os que estão em repositórios liberados no token.

### O que cada permissão libera

| Funcionalidade | GitLab | GitHub |
| --- | --- | --- |
| Lista de Merge/Pull Requests, comentários, pesquisa por título, ver alterações (diff), status resolvido | `read_api` | **Pull requests** + **Metadata** |
| Trecho de código dentro do comentário | `read_api` (mesmo escopo, sem diferença) | **Contents** — à parte das duas acima |
| Horas da semana | `read_api` | não existe no GitHub |

No GitLab um escopo só (`read_api`) cobre tudo — não existe "funcionalidade X exige algo a mais". No GitHub, um token com só **Pull requests** e **Metadata** já mostra a lista, os comentários, a pesquisa e o diff normalmente; só o trecho de código dentro de cada comentário depende também de **Contents**, porque essa parte usa uma API diferente por baixo.

Se um token estiver errado, expirado, ou faltando alguma dessas permissões, o dashboard mostra um aviso (toast) dizendo em qual funcionalidade e por quê — ao abrir o dashboard (a primeira consulta automática já testa o token) e de novo sempre que você tentar usar algo que precise de mais do que o token tem.

---

## 2. Instalar

```bash
cd mr-radar
npm run setup
```

O comando instala as dependências do `backend/` e do `frontend/`.

---

## 3. Configurar o `.env`

Copie o arquivo de exemplo e preencha:

```bash
copy backend\.env.example backend\.env
```

A primeira variável escolhe o provedor:

```env
PROVEDOR=gitlab
```

**No modo `gitlab`**, duas variáveis são obrigatórias:

```env
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=seu_token_aqui
```

- `GITLAB_URL` — endereço da instância, **sem** `/api/v4` e sem barra no final.
- `GITLAB_TOKEN` — o token do passo anterior.

**No modo `github`**, só o token é obrigatório:

```env
PROVEDOR=github
GITHUB_TOKEN=seu_token_aqui
```

- `GITHUB_TOKEN` — o token do passo anterior.
- `GITHUB_URL` — deixe de fora para usar o github.com. Só preencha em **GitHub Enterprise Server**, com o endereço da instância, sem `/api/v3` e sem barra no final; o sufixo é acrescentado sozinho.

Dá para deixar as credenciais dos dois preenchidas ao mesmo tempo e alternar só a linha do `PROVEDOR` — o backend lê apenas as do provedor ativo. O arquivo `.env` está no `.gitignore` e **não deve ser commitado**.

Existe ainda um terceiro valor, `PROVEDOR=demo`, que não exige nenhuma variável — é o adapter com dados fictícios usado só para gerar a demonstração pública (ver [Endpoints do backend](#endpoints-do-backend) e a pasta `backend/src/integracao/demo/`). Não há motivo para usá-lo no seu dia a dia.

Ajustes opcionais, todos com valor padrão e comentados em `backend/.env.example`: `PORT`, `HOST`, `CONTEXT_LINES`, `REQUEST_TIMEOUT_MS`, `MAX_PAGES`, `FILE_CACHE_TTL_MS`, `IGNORED_AUTHORS`.

`IGNORED_AUTHORS` recebe usernames separados por vírgula, para bots e integrações que comentam sem serem revisores — notificações de deploy, por exemplo. Vale nos dois provedores, e soma-se à detecção automática descrita em [Notas de bot e integrações](#notas-de-bot-e-integrações).

> `HOST` existe para casos específicos, mas o padrão `127.0.0.1` é o que mantém o backend fora da rede. Só mude sabendo o que está fazendo.

---

## 4. Rodar

```bash
npm run dev
```

Sobe os dois serviços juntos:

- backend em `http://127.0.0.1:3001`
- frontend em `http://127.0.0.1:5173` (ou `http://mr-radar.local:5173`, veja abaixo)

Abra `http://127.0.0.1:5173` no navegador. Para subir separadamente: `npm run dev:backend` e `npm run dev:frontend`.

Ao subir, o backend escreve no console qual provedor foi reconhecido e o endereço da API — é a forma mais rápida de conferir se o `.env` está sendo lido como você espera.

### Endereço com nome próprio (opcional)

Para abrir em `http://mr-radar.local:5173` em vez do IP, adicione uma entrada no arquivo `hosts` do Windows — é necessário abrir o PowerShell **como administrador** só nesse passo:

```powershell
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "127.0.0.1 mr-radar.local"
```

Depois disso, `http://mr-radar.local:5173` funciona normalmente junto com `http://127.0.0.1:5173` — os dois continuam válidos. Para desfazer, remova essa linha do arquivo `hosts` (`notepad $env:SystemRoot\System32\drivers\etc\hosts`, como administrador).

---

## Diferenças entre GitLab e GitHub

As telas são as mesmas, e o texto delas se adapta ao provedor ativo. O que realmente muda:

| | GitLab | GitHub |
| --- | --- | --- |
| Como o item se chama na tela | Merge Request, `!123` | Pull Request, `#123` |
| Campo de projeto | **Project ID ou caminho** (`123` ou `grupo/projeto`) | **Repositório** (`dono/repositorio`) |
| Campo de número | **IID do Merge Request** | **Number do Pull Request** |
| Página **Horas** | sim | não existe — o GitHub não tem time tracking, e a rota `/api/horas` nem é registrada |
| Etiqueta **Tem thread aberta** na lista | sim | não aparece — exigiria uma consulta GraphQL por Pull Request só para montar a lista |
| Resolvido / não resolvido | vem junto com os comentários, na API REST | vem de uma consulta GraphQL à parte (veja [Segurança](#a-única-exceção-o-post-do-graphql-do-github)) |
| Comentários gerais | notas do Merge Request, que o GitLab não deixa resolver | comentários da aba *Conversation*, que não pertencem a nenhuma thread de review |
| Bots reconhecidos sozinho | usernames no formato `project_<id>_bot_...` | contas marcadas pelo GitHub como do tipo `Bot` |
| Trecho de código | busca em duas etapas, por árvore + blob | Contents API, em uma chamada |
| Lista de abertos | endpoint de Merge Requests, com filtro nativo de autor/atribuído | Search API (`is:pr is:open author:@me`), depois o detalhe de cada Pull Request |

Colar a URL completa funciona nos dois: `.../-/merge_requests/123` no GitLab e `.../pull/123` no GitHub preenchem sozinhos o projeto e o número.

---

## Como usar

O cabeçalho fica no topo em todas as telas: título, as abas, o endereço da API e a etiqueta **Somente leitura**. No modo GitHub só existe uma aba, já que a de Horas não se aplica. A aba escolhida vai para o endereço (`#/merge-requests` ou `#/horas`), então o F5 e o botão de voltar do navegador continuam funcionando.

### Merge Requests

Ao abrir a tela, o painel **Meus Merge Requests abertos** (ou **Meus Pull Requests abertos**) já carrega sozinho a sua lista — não é preciso pesquisar nada antes. Cada item mostra o projeto, a referência (`!123` ou `#123`), as branches, quando foi atualizado, e — no GitLab — uma etiqueta **Tem thread aberta** nos que ainda têm discussão sem resolver.

1. Clique em um item da lista: os comentários dele são carregados na hora.
   - O seletor **Mostrar** alterna entre `Criados por mim` e `Atribuídos a mim`.
   - Se preferir, preencha os dois campos manualmente. Colar a URL completa no campo de projeto preenche os dois de uma vez.
2. Clique em **Buscar** se tiver informado os campos na mão.
3. Escolha o **Status**: `Abertos` (padrão), `Resolvidos` ou `Todos`. Ele é o escopo da consulta ao provedor; trocar o valor recarrega na hora o item que está na tela.
4. Marque **Atualizar automaticamente** para refazer a consulta a cada 15, 30 ou 60 segundos. O horário da última atualização fica no canto direito do filtro.

Sobre a atualização automática: ela nunca interrompe uma consulta que ainda está em andamento (em revisões grandes a consulta pode demorar mais que o intervalo), mantém o último resultado na tela se uma atualização falhar por problema passageiro, e se desliga sozinha quando o erro não vai se resolver sozinho — token inválido, sem acesso, item inexistente ou limite de requisições — para não ficar insistindo contra o provedor.

Cada cartão mostra o comentário, o local (`arquivo:linha`), o trecho de código com a linha comentada destacada, as respostas da thread e um link direto para a thread no provedor.

### Rótulos de revisão

Comentários que começam com um rótulo — `issue:`, `suggestion:`, `nit:`, `question:` ou `praise:` — ganham no cartão uma segunda etiqueta ao lado da situação, com uma cor para cada um: issue em vermelho, suggestion em laranja, nit em amarelo, question em azul e praise em verde.

O rótulo é reconhecido em maiúsculas ou minúsculas, entre marcações de markdown (`**issue:**`), depois de um marcador de lista ou de citação (`- nit:`, `> nit:`) e com o complemento entre parênteses do padrão de conventional comments (`suggestion (non-blocking):`). Comentários que não começam com um desses rótulos ficam apenas com a etiqueta de situação.

### Ordenar e filtrar a lista

- **Ordenar por** — `Mais recentes` (padrão) vai do comentário mais novo para o mais antigo, a mesma ordem usada no Git. `Rótulo: pior primeiro` vai de `issue` até `praise` e deixa os comentários sem rótulo no fim; dentro de cada rótulo continua valendo o mais novo primeiro.
- **Rótulo ou revisor** — um campo só, com os rótulos que aparecem nesta revisão e, em seguida, os revisores que comentaram. Escolher `Issue` deixa na tela só os comentários com esse rótulo; escolher um revisor deixa só os comentários dele.
- As etiquetas do resumo — **abertos**, **resolvidos**, **gerais** e **no total** — são clicáveis e filtram a lista pela situação correspondente, com a escolhida ficando preenchida. Quando a situação pedida está fora do escopo da busca atual (clicar em **resolvidos** com o Status em `Abertos`, por exemplo), o Status passa para `Todos` e a consulta é refeita.

### Copiar comentários

O botão **Copiar comentários**, acima da lista, copia os comentários que estão na tela — respeitando os filtros e a ordenação escolhidos — já formatados para colar em outro lugar. Ao lado dele fica o contador de quantos comentários estão sendo exibidos.

````text
Comentário: "texto do comentário"
Arquivo: "src/caminho/do/arquivo.cs:42"
Código:
```csharp
trecho de código, quando o comentário estiver marcado em uma linha
```
````

Comentários sem trecho de código (gerais, ou quando o arquivo não pôde ser encontrado) aparecem sem a seção "Código:".

### Notas de bot e integrações

Comentários postados por bots (Project/Group Access Token no GitLab, reconhecidos pelo formato do username; contas do tipo `Bot` no GitHub) ou por autores listados em `IGNORED_AUTHORS` são tratados como notas de sistema: não aparecem em lugar nenhum e não entram em nenhuma contagem — o mesmo tratamento que o provedor já dá para "adicionou 3 commits" ou "aprovou este merge request".

---

## Horas da semana

> Esta página só existe no modo GitLab.

A aba **Horas** responde duas perguntas de uma olhada: quantas horas ainda faltam na semana, e quais dias já fecharam a jornada.

O gráfico traz uma barra por dia útil, de segunda a sexta — sábado e domingo ficam de fora. A linha tracejada marca as 8h esperadas por dia: a barra fica **verde** quando o dia bateu as 8h, **laranja** quando ficou no meio do caminho, e vira um traço apagado quando não houve lançamento. O dia de hoje aparece destacado embaixo da barra. Acima do gráfico, três etiquetas mostram o total lançado, as 40h de referência e quanto falta — ou **semana fechada**, quando não falta nada.

Os botões **‹ Semana anterior** e **Próxima semana ›** andam no calendário; a próxima semana fica desabilitada quando você já está na semana atual. Abaixo do gráfico vem a lista dos seus chamados movimentados na semana, cada um com as horas que você lançou nele naquela semana e o total já gasto no chamado, com link direto para o GitLab.

Passar o mouse sobre uma barra mostra o detalhe daquele dia: o total e, em ordem do maior para o menor, cada chamado que contribuiu para ele — por exemplo "3h - Corrigir layout do formulário".

### Chamados elegíveis

Cada chamado na lista pode ganhar um pontinho discreto ao lado das horas da semana, indicando se as horas lançadas têm commit por trás:

- 🟢 **verde** — você commitou neste chamado **hoje**;
- 🟠 **laranja** — você commitou neste chamado **em algum dia desta semana**, mas não hoje;
- sem pontinho — nenhum commit seu encontrado nesta semana.

O vínculo passa pelo Merge Request: a API do GitLab não devolve commits a partir do chamado diretamente, só a lista de Merge Requests relacionados a ele (os que o mencionam, fecham, ou têm commit ligado). Para cada chamado, o backend busca esses Merge Requests e, em cada um, os commits mais recentes — parando de paginar assim que encontra um commit anterior à semana, para não ler o histórico inteiro de um Merge Request de vida longa. Só contam os commits cujo autor bate com o e-mail do dono do token.

Se o GitLab devolver erro ao buscar os Merge Requests relacionados de um chamado específico (acontece, e não tem relação com os dados enviados), esse chamado simplesmente fica sem o pontinho — a consulta de horas continua normalmente.

### De onde vêm as horas

O GitLab não expõe os lançamentos de tempo em nenhuma rota de leitura da API REST — `/timelogs` responde 404, e a consulta equivalente em GraphQL exigiria `POST`. As horas são então lidas das notas de sistema de cada chamado (`added 2h of time spent at ...`), que é a mesma informação que o GitLab usa para montar o total dele.

Consequências que valem conhecer:

- **Só entram as horas que você lançou.** Outras pessoas podem lançar tempo em um chamado seu; esse tempo aparece no total do chamado, mas não no seu gráfico.
- **`1d` vale 8h e `1w` vale 5 dias**, que é a conversão padrão do GitLab e a mesma referência do gráfico. Se a sua instância tiver sido configurada com outra jornada, a conversão muda junto e o número passa a divergir.
- **O lançamento entra no dia que estiver escrito na nota.** Quem usa `/spend 2h 2026-08-25` cai no dia 25, não no dia em que digitou.
- **Um lançamento apagado no GitLab sai da conta**, inclusive quando o comando zera todo o tempo do chamado.
- Horas lançadas no fim de semana não entram no total da semana, mas aparecem em uma etiqueta à parte para o número não parecer errado.

---

## Endpoints do backend

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/configuracao` | Provedor ativo, endereço da API, valores padrão da tela e problemas de configuração. Nunca devolve o token, só se ele está preenchido. |
| `GET` | `/api/merge-requests` | Merge Requests (ou Pull Requests) abertos do dono do token. Aceita `escopo=criados_por_mim` (padrão) ou `escopo=atribuidos_a_mim`. |
| `GET` | `/api/merge-request/:projectId/:mrIid/open-discussions` | Comentários da revisão, do mais novo para o mais antigo, já com o trecho de código e com o rótulo de revisão reconhecido. |
| `GET` | `/api/horas` | **Só no modo GitLab.** Horas lançadas pelo dono do token em cada dia útil de uma semana, com o total, a referência de 8h/dia, o detalhe por chamado de cada dia e a elegibilidade de cada chamado. Aceita `semana=AAAA-MM-DD` (qualquer data dentro da semana desejada; sem o parâmetro, a semana atual). No modo GitHub a rota não é registrada e responde 404. |

Em `:projectId` vai o Project ID do GitLab (número ou caminho) ou o `dono/repositorio` do GitHub; nos dois casos a barra precisa vir codificada (`%2F`).

Parâmetros aceitos na rota de comentários:

| Parâmetro | Valores | Padrão |
| --- | --- | --- |
| `status` | `abertos`, `resolvidos`, `todos` | `abertos` |
| `contexto` | `0` a `30` | `3` |

Comentários gerais (feitos direto na revisão, sem marcar uma linha de código) contam como abertos em `status=abertos`, já que não há como resolvê-los, e só ficam de fora em `status=resolvidos`. Na tela eles não aparecem junto com os demais: entram quando a etiqueta **"N gerais"** ou a **"N no total"** do resumo é clicada.

---

## Estrutura

```txt
mr-radar/
├─ backend/                       Node + Express + TypeScript
│  └─ src/
│     ├─ index.ts                 Lê o .env e sobe o servidor
│     ├─ Aplicacao.ts             Monta o Express (middlewares e rotas), sem ler .env nenhum
│     ├─ configuracao/            Leitura e validação do .env, por provedor
│     ├─ controllers/             Rotas (recebem, chamam a lógica, devolvem)
│     ├─ integracao/              Conversa com o provedor
│     │  ├─ ClienteRevisao.ts     A interface comum que a lógica enxerga
│     │  ├─ ClienteHoras.ts       A interface da página de Horas (GitLab e demo)
│     │  ├─ http/                 Cliente HTTP compartilhado, fixo em GET
│     │  ├─ gitlab/               Cliente e conversor da API v4 do GitLab
│     │  ├─ github/               Cliente e conversor da API REST do GitHub, mais o GraphQL isolado
│     │  └─ demo/                 Adapter da demonstração: dados fictícios, sem rede nenhuma
│     ├─ logica/                  Regras: listagem, normalização, filtros, trecho de código e horas
│     ├─ middlewares/             Bloqueio de escrita, CORS local e tratamento de erros
│     ├─ models/                  Tipos e enums do domínio, por assunto (Revisao, Horas)
│     ├─ scripts/                 Geração das fixtures estáticas da demonstração
│     └─ utilidades/              Funções genéricas reaproveitáveis (semana, tempo gasto, coleções)
├─ frontend/                      React + Vite + TypeScript + styled-components
│  └─ src/
│     ├─ api/                     Chamadas ao backend e tipos da resposta (Revisao, Horas)
│     ├─ components/
│     │  ├─ BasicComponents/      Botao, CampoTexto, CampoSelecao, Etiqueta
│     │  ├─ Layout/               CabecalhoApp: título, abas e estado da configuração
│     │  ├─ Revisao/              PainelRevisao, ListaMergeRequests, FiltroRevisao, CartaoComentario, ...
│     │  └─ Horas/                PainelHoras, GraficoHoras, ListaIssuesHoras
│     ├─ containers/App/          Tema, cabeçalho, configuração e a página aberta
│     ├─ services/                Cliente HTTP e erro de API
│     ├─ styles/                  Tema e estilo global
│     └─ utils/                   Formatação, filtro/ordenação, leitura de URL, vocabulário por provedor e notificação de token
├─ scripts/dev.mjs                Sobe backend e frontend juntos
├─ netlify.toml                   Build da demonstração estática
└─ README.md
```

Cada adapter em `integracao/` devolve os tipos de domínio de `models/`: a pasta `logica/` não conhece o formato bruto de nenhum provedor, e é por isso que a maior parte do código é a mesma nos dois.

No frontend, todo termo que muda entre provedores sai de `utils/Vocabulario.ts` — não há `if` de provedor espalhado pelos componentes. Cada componente segue o mesmo padrão de pasta: `index.tsx` (só JSX), `styles.ts` (styled components), `types.ts` (tipos, interfaces e valores fixos) e `use<Nome>.ts` (toda a lógica).

---

## Tratamento de erros

O backend traduz as falhas mais comuns em mensagens claras na tela:

| Situação | O que aparece |
| --- | --- |
| Token inválido ou expirado | Mensagem pedindo para gerar um novo token com escopo de leitura, **e uma notificação (toast)** dizendo em qual funcionalidade isso aconteceu. |
| Sem acesso ao projeto ou permissão faltando | Aviso de acesso negado, com a orientação de conferir o escopo e a permissão — também com notificação. Ver [O que cada permissão libera](#o-que-cada-permissão-libera) para saber qual permissão cada funcionalidade usa. |
| Projeto ou número errado | Aviso de recurso não encontrado (os dois provedores também respondem 404 quando falta acesso). |
| Limite de requisições | A chamada é repetida automaticamente respeitando o `Retry-After`; persistindo, aparece o aviso para aumentar o intervalo. |
| Comentário sem posição de código | O cartão aparece normalmente, marcado como *Comentário geral*. |
| Arquivo removido, renomeado ou commit indisponível | O cartão aparece com o motivo no lugar do trecho de código. O trecho só é buscado em commits do mesmo lado do diff, para nunca exibir outra versão do arquivo como se fosse o código comentado. |
| Arquivo binário ou grande demais | Mesmo comportamento acima, com o motivo correspondente. |
| Muitos comentários | A paginação é percorrida até `MAX_PAGES`; se o limite for atingido, a tela avisa. |

### Erro de certificado TLS

Se aparecer erro de certificado (proxy ou uma autoridade certificadora própria da sua rede), aponte o Node para o certificado correto em vez de desabilitar a validação:

```bash
set NODE_EXTRA_CA_CERTS=C:\caminho\para\ca-personalizada.pem
npm run dev
```

---

## Limitações conhecidas

- O corpo do comentário é exibido como texto puro, sem renderizar o Markdown (negrito, links, blocos de código). Isso evita uma dependência de Markdown e o risco de HTML injetado.
- O trecho de código não tem realce de sintaxe. A linguagem é identificada e exibida no cabeçalho do bloco, mas o texto é monoespaçado simples.
- Comentários em imagens ou anexos aparecem sem trecho de código, com o motivo explicado no cartão.
- Comentários que marcam um intervalo começando em uma linha removida e terminando em uma adicionada destacam apenas a linha âncora: as duas pontas estão em versões diferentes do arquivo e a numeração não é comparável.
- Os tipos do contrato entre backend e frontend estão declarados nos dois lados (`backend/src/models/Revisao/types.ts` e `frontend/src/api/Revisao/types.ts`), sem pacote compartilhado. Se um campo mudar, os dois arquivos precisam ser ajustados.
- Um Merge Request (ou Pull Request) por vez.
- Trocar de aba descarta o que estava carregado na outra: voltar para os Merge Requests pede uma nova busca.

### Só no modo GitHub

- A lista de Pull Requests abertos vem da Search API, então ela só enxerga repositórios liberados no token e obedece ao limite de resultados e à cota mais apertada dessa API.
- A etiqueta **Tem thread aberta** não aparece na lista: descobrir isso exigiria uma consulta GraphQL por Pull Request só para montar a tela.
- Em repositórios revisados por um bot de review automatizado, é comum que o comentário humano seja uma **resposta** ao comentário do bot. Como notas de bot são descartadas, cada resposta dessas passa a valer como uma thread própria — os comentários aparecem todos, mas o agrupamento fica mais fragmentado do que no GitHub.
- A página **Horas** não existe, porque o GitHub não tem time tracking.
- Na pesquisa por título, se o dono da organização tiver liberado o token só para parte dos repositórios, os repositórios negados aparecem misturados com os que só esgotaram o limite de resultados — a mensagem hoje é genérica ("a lista pode estar incompleta") em vez de dizer que foi permissão negada especificamente naquele repositório.

### Só no modo GitLab

- A aba **Horas** só enxerga os chamados que estão atribuídos a você **agora**: hora lançada em um chamado que foi repassado depois, ou em chamado de outra pessoa, não aparece. Não existe filtro na API REST para "chamados em que eu lancei hora".
- Cada atualização da aba **Horas** relê as notas dos chamados movimentados na semana, sem cache. Semanas antigas são mais lentas, porque o filtro de data traz tudo que foi mexido dali para cá.
- A elegibilidade soma outra rodada de chamadas (Merge Requests relacionados e commits de cada um), o que deixa a consulta de horas mais lenta ainda. Se o GitLab errar ao buscar os relacionados de um chamado específico, esse chamado fica sem o pontinho, mas a tela carrega normalmente.
- A elegibilidade só identifica o commit pelo e-mail do autor. Se você configurou um e-mail de commit diferente do cadastrado na sua conta do GitLab (e diferente do campo "Commit email" do seu perfil), o commit não é reconhecido como seu.

## Próximos passos possíveis

- Escopo "para minha revisão" na lista.
- Abrir vários Merge Requests ao mesmo tempo, em abas.
- Somar no gráfico de horas as issues em que você lançou tempo sem estar atribuído.
- Exportar os comentários abertos em Markdown.
- Realce de sintaxe no trecho de código.
