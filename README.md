# MR Radar

Dashboard local que lista, em uma tela só, todos os comentários de revisão de um Merge Request do GitLab — com o texto do comentário, o arquivo, a linha e o trecho de código marcado — para não precisar abrir thread por thread.

Ao abrir, já mostra os seus Merge Requests abertos, antes de qualquer pesquisa.

Roda inteiramente na sua máquina, usando o seu Personal Access Token, e **é somente leitura**.

---

## Segurança

Não existe versão hospedada nem configuração compartilhada, de propósito: para usar, você clona o repositório e coloca as suas credenciais no `backend/.env`, que fica apenas na sua máquina e está no `.gitignore`. Assim o seu token e os dados da sua conta do GitLab nunca passam por terceiros nem vão para o repositório.

O projeto também não faz nenhuma alteração no GitLab. Isso não é só uma convenção — está garantido em três camadas:

| Camada | Garantia |
| --- | --- |
| Cliente HTTP | `ExecutarGet` fixa `method: "GET"` e não tem como enviar corpo. Não existe nenhuma chamada `POST`, `PUT`, `PATCH` ou `DELETE` no código. |
| Backend | O middleware `SomenteLeitura` responde `405` para qualquer método que não seja `GET`, `HEAD` ou `OPTIONS`. |
| Token | O escopo recomendado é apenas `read_api`, que o próprio GitLab impede de escrever. |

Além disso:

- o backend escuta somente em `127.0.0.1` (não fica exposto na rede);
- o token nunca sai do backend — o frontend não o recebe em nenhuma resposta;
- em um eventual redirecionamento para outro domínio, o cabeçalho do token é removido antes de repetir a chamada;
- nada é gravado em banco, nem no GitLab. O único armazenamento é o `localStorage` do navegador, que lembra o último Project ID e IID digitados.

---

## Pré-requisitos

- **Node.js 16.14 ou superior.**
- Acesso a uma instância do GitLab (gitlab.com ou self-hosted).

---

## 1. Gerar o Personal Access Token

1. No GitLab, acesse **User Settings → Access Tokens**.
2. Crie um token com:
   - **Scope:** apenas `read_api`;
   - **Expiration date:** o prazo que preferir.
3. Copie o token — ele só aparece uma vez.

> Não use os escopos `api`, `write_repository` ou qualquer outro de escrita. O dashboard só precisa ler.

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

```env
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=seu_token_aqui
```

- `GITLAB_URL` — endereço da instância, **sem** `/api/v4` e sem barra no final.
- `GITLAB_TOKEN` — o token do passo anterior.

São as duas únicas variáveis obrigatórias. O arquivo `.env` está no `.gitignore` e **não deve ser commitado**.

Ajustes opcionais, todos com valor padrão e comentados em `backend/.env.example`: `PORT`, `REQUEST_TIMEOUT_MS`, `MAX_PAGES`, `FILE_CACHE_TTL_MS`, `IGNORED_AUTHORS`.

`IGNORED_AUTHORS` recebe usernames do GitLab separados por vírgula, para bots e integrações da sua instância que comentam no MR sem serem revisores — notificações de deploy, por exemplo. Bots de Project/Group Access Token do próprio GitLab, cujo username segue o formato `project_123_bot_...`, já são ignorados automaticamente.

---

## 4. Rodar

```bash
npm run dev
```

Sobe os dois serviços juntos:

- backend em `http://127.0.0.1:3001`
- frontend em `http://127.0.0.1:5173` (ou `http://mr-radar.local:5173`, veja abaixo)

Abra `http://127.0.0.1:5173` no navegador. Para subir separadamente: `npm run dev:backend` e `npm run dev:frontend`.

### Endereço com nome próprio (opcional)

Para abrir em `http://mr-radar.local:5173` em vez do IP, adicione uma entrada no arquivo `hosts` do Windows — é necessário abrir o PowerShell **como administrador** só nesse passo:

```powershell
Add-Content -Path "$env:SystemRoot\System32\drivers\etc\hosts" -Value "127.0.0.1 mr-radar.local"
```

Depois disso, `http://mr-radar.local:5173` funciona normalmente junto com `http://127.0.0.1:5173` — os dois continuam válidos. Para desfazer, remova essa linha do arquivo `hosts` (`notepad $env:SystemRoot\System32\drivers\etc\hosts`, como administrador).

---

## Como usar

Ao abrir a tela, o painel **Meus Merge Requests abertos** já carrega sozinho a sua lista — não é preciso pesquisar nada antes. Cada item mostra o projeto, o `!IID`, as branches, quando foi atualizado, e uma etiqueta **Tem thread aberta** nos que ainda têm discussão sem resolver.

1. Clique em um Merge Request da lista: os comentários dele são carregados na hora.
   - O seletor **Mostrar** alterna entre `Criados por mim` e `Atribuídos a mim`.
   - Se preferir, informe o **Project ID** (o número, ou o caminho `grupo/subgrupo/projeto`) e o **IID** manualmente. Colar a URL completa do MR no campo de projeto preenche os dois.
2. Clique em **Buscar** se tiver informado os campos na mão.
3. Escolha o **Status**: `Abertos` (padrão), `Resolvidos` ou `Todos`.
4. Marque **Atualizar automaticamente** para refazer a consulta a cada 15, 30 ou 60 segundos. O horário da última atualização fica no canto direito do filtro.

Sobre a atualização automática: ela nunca interrompe uma consulta que ainda está em andamento (em Merge Requests grandes a consulta pode demorar mais que o intervalo), mantém o último resultado na tela se uma atualização falhar por problema passageiro, e se desliga sozinha quando o erro não vai se resolver sozinho — token inválido, sem acesso, MR inexistente ou limite de requisições — para não ficar insistindo contra o GitLab.

Cada cartão mostra o comentário, o local (`arquivo:linha`), o trecho de código com a linha comentada destacada, as respostas da thread e um link direto para a thread no GitLab.

### Copiar comentários

O botão **Copiar comentários**, acima da lista, copia todos os comentários do Merge Request (inclusive os gerais, mesmo que estejam escondidos) já formatados para colar em outro lugar:

```text
Comentário: "texto do comentário"
Arquivo: "src/caminho/do/arquivo.cs:42"
Código:
```csharp
trecho de código, quando o comentário estiver marcado em uma linha
```
```

Comentários sem trecho de código (gerais, ou quando o arquivo não pôde ser encontrado) aparecem sem a seção "Código:".

### Notas de bot e integrações

Notas postadas por bots (Project/Group Access Token do GitLab, reconhecidos automaticamente pelo formato do username) ou por autores listados em `IGNORED_AUTHORS` são tratadas como notas de sistema: não aparecem em lugar nenhum e não entram em nenhuma contagem — o mesmo tratamento que o GitLab já dá para "adicionou 3 commits" ou "aprovou este merge request".

---

## Endpoints do backend

| Método | Rota | Descrição |
| --- | --- | --- |
| `GET` | `/api/configuracao` | URL do GitLab, valores padrão da tela e problemas de configuração. Nunca devolve o token. |
| `GET` | `/api/merge-requests` | Merge Requests abertos do dono do token, em todos os projetos que ele enxerga. Aceita `escopo=criados_por_mim` (padrão) ou `escopo=atribuidos_a_mim`. |
| `GET` | `/api/merge-request/:projectId/:mrIid/open-discussions` | Comentários do Merge Request já com o trecho de código. |

Parâmetros aceitos na rota de comentários:

| Parâmetro | Valores | Padrão |
| --- | --- | --- |
| `status` | `abertos`, `resolvidos`, `todos` | `abertos` |
| `contexto` | `0` a `30` | `3` |

Comentários gerais (feitos direto no MR, sem marcar uma linha de código) contam como abertos em `status=abertos`, já que o GitLab não permite resolvê-los, e só ficam de fora em `status=resolvidos`. Na tela eles não aparecem junto com os demais: ficam atrás da etiqueta **"N gerais"** no resumo do MR, que os revela ao ser clicada.

---

## Estrutura

```txt
mr-radar/
├─ backend/                       Node + Express + TypeScript
│  └─ src/
│     ├─ configuracao/            Leitura e validação do .env
│     ├─ controllers/             Rotas (recebem, chamam a lógica, devolvem)
│     ├─ integracao/gitlab/       Cliente somente leitura da API v4
│     ├─ logica/                  Regras: listagem de MRs, normalização, filtros e trecho de código
│     ├─ middlewares/             Bloqueio de escrita, CORS local e tratamento de erros
│     ├─ models/Revisao/          Tipos e enums do domínio
│     └─ utilidades/              Funções genéricas reaproveitáveis
├─ frontend/                      React + Vite + TypeScript + styled-components
│  └─ src/
│     ├─ api/Revisao/             Chamadas ao backend e tipos da resposta
│     ├─ components/
│     │  ├─ BasicComponents/      Botao, CampoTexto, Etiqueta
│     │  └─ Revisao/              PainelRevisao, ListaMergeRequests, FiltroRevisao, CartaoComentario, ...
│     ├─ containers/App/          Tema e montagem da aplicação
│     ├─ services/                Cliente HTTP e erro de API
│     ├─ styles/                  Tema e estilo global
│     └─ utils/                   Formatação e leitura de URL de MR
├─ scripts/dev.mjs                Sobe backend e frontend juntos
└─ README.md
```

Cada componente do frontend segue o mesmo padrão de pasta: `index.tsx` (só JSX), `styles.ts` (styled components), `types.ts` (tipos, interfaces e valores fixos) e `use<Nome>.ts` (toda a lógica).

---

## Tratamento de erros

O backend traduz as falhas mais comuns em mensagens claras na tela:

| Situação | O que aparece |
| --- | --- |
| Token inválido ou expirado | Mensagem pedindo para gerar um novo token com escopo `read_api`. |
| Sem acesso ao projeto | Aviso de acesso negado, com a orientação de conferir o escopo e a permissão. |
| Project ID ou IID errado | Aviso de recurso não encontrado (o GitLab também responde 404 quando falta acesso). |
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

- O corpo do comentário é exibido como texto puro, sem renderizar o Markdown do GitLab (negrito, links, blocos de código). Isso evita uma dependência de Markdown e o risco de HTML injetado.
- O trecho de código não tem realce de sintaxe. A linguagem é identificada e exibida no cabeçalho do bloco, mas o texto é monoespaçado simples.
- Comentários em imagens ou anexos aparecem sem trecho de código, com o motivo explicado no cartão.
- Comentários que marcam um intervalo começando em uma linha removida e terminando em uma adicionada destacam apenas a linha âncora: as duas pontas estão em versões diferentes do arquivo e a numeração não é comparável.
- Os tipos do contrato entre backend e frontend estão declarados nos dois lados (`backend/src/models/Revisao/types.ts` e `frontend/src/api/Revisao/types.ts`), sem pacote compartilhado. Se um campo mudar, os dois arquivos precisam ser ajustados.
- Um Merge Request por vez.

## Próximos passos possíveis

- Escopo "para minha revisão" na lista (exige uma chamada extra a `/user` para descobrir o seu username).
- Abrir vários Merge Requests ao mesmo tempo, em abas.
- Filtrar por autor do comentário.
- Exportar os comentários abertos em Markdown.
- Realce de sintaxe no trecho de código.
