# Contrato do CLISPEC.md e das specs

O contrato tem dois documentos:

- **`CLISPEC.md`**, um por binário, na raiz: a visão macro. Guarda
  identidade, propósito, públicos, o que fica fora, a superfície entregue
  (commands, flags, parâmetros, screens, tools, resources, prompts,
  settings e credenciais) e o índice das specs.
- **`specs/NNNN-slug.md`**, um por evolução: o que muda no binário, como ele
  vai funcionar depois da mudança, como o código deve ser feito, as tarefas
  e os testes de aceite.

A skill `termfy-clispec` entrevista a pessoa para entender o que o binário
precisa fazer e mantém o `CLISPEC.md`. A skill `termfy-spec` entrevista a
pessoa a cada evolução e escreve a spec. As skills `termfy-cli`,
`termfy-tui`, `termfy-mcp` e `termfy-config` implementam a partir da spec
aberta e marcam tarefas e testes conforme avançam. `{{bin}} spec close`
incorpora a spec concluída ao `CLISPEC.md`.

O `CLISPEC.md` entra no binário em tempo de build, como `docs/`. Um agente
que recebe só o executável lê a visão macro por `{{bin}} spec show --json`
ou pela tool MCP `spec`, e o índice das specs por `{{bin}} spec list`. Os
arquivos de `specs/` são registros de desenvolvimento: o binário os lê do
disco quando roda na pasta do projeto, ou seja, quando o `CLISPEC.md` da
pasta tem o mesmo `bin`.

## Ciclo

1. `termfy-clispec` descreve o binário no `CLISPEC.md` (uma vez, e de novo
   quando o propósito ou os públicos mudarem).
2. `{{bin}} spec new <slug>` cria a spec como `draft`; `termfy-spec`
   preenche Goal, Behavior, Design, `changes`, Tasks e Tests em entrevista.
3. A spec passa a `in_progress`; as skills de implementação marcam os itens.
4. `{{bin}} spec close <id>` aplica `changes` ao `CLISPEC.md` e marca a spec
   como `done`.

Enquanto a spec está aberta, o código pode estar à frente do `CLISPEC.md`.
`spec check` reconhece esse caso e relata a entrada como `pending`.

## CLISPEC.md

Front matter YAML delimitado por `---` e quatro seções fixas, nesta ordem:
`## Purpose`, `## Audiences`, `## Out of scope` e `## Notes`. Os títulos são
exatos; texto fora deles permanece no arquivo, mas não entra em `sections`.
Uma seção `## Checklist` ou `## Tasks` recusa a leitura: trabalho pendente
fica nas specs. A prosa pode estar em qualquer idioma; os nomes (commands,
options, keys, tools, screens) são os nomes do código, em inglês.

### Front matter

O schema fechado fica em `src/spec/schema.ts` (Zod). Campo desconhecido,
enum inválido ou tipo errado recusam a leitura, também nos objetos
internos. Identificadores, títulos e descrições obrigatórias não podem ser
vazios ou conter apenas espaços. Datas usam ISO 8601 com horário e fuso
(`Z` ou offset).

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `schemaVersion` | `"2.0.0"` | sim | versão do contrato |
| `bin` | string | sim | igual a `termfy.bin` do `package.json` |
| `title` | string | sim | título legível |
| `description` | string | sim | uma frase em inglês, igual a `description` do `package.json` |
| `createdAt` | date-time | sim | criação, não editada depois |
| `updatedAt` | date-time | sim | atualizada a cada edição |
| `commands` | array de Command | não | superfície entregue |
| `screens` | array de Screen | não | superfície entregue |
| `mcp` | objeto `{ tools, resources, prompts }` | não | superfície entregue |
| `settings` | array de Setting | não | superfície entregue |
| `credentials` | array de Credential | não | superfície entregue |
| `storage` | objeto `{ tables }` | não | tabelas do banco SQLite, só quando o binário tem um |
| `specs` | array de `{ id, title, status }` | não | índice das specs, igual aos arquivos |

Listas ausentes valem como vazias.

#### Command

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `path` | string | sim | caminho completo, por exemplo `orders list` |
| `description` | string | sim | uma frase |
| `arguments` | array de `{ name, required?, variadic?, values? }` | não | posicionais |
| `options` | array de `{ name, argument?, values?, default?, description? }` | não | `name` com `--` |
| `data` | string | não | forma do `data` no `--json`, por exemplo `{ count, orders[] }` |
| `exitCodes` | array de inteiros | não | além de 0, 1 e 2 |
| `credentials` | array de string | não | nomes do cofre que o command lê |
| `interactive` | boolean | não | exige TTY |
| `example` | string | não | linha de uso |

`argument` de uma option é o nome textual do valor; `values` é um array de
strings. `default` aceita string, number ou boolean. Os campos `data`,
`input` e `output` descrevem formatos como strings, sem conter os dados reais.

#### Screen

`{ id, title, description?, keys?: [{ key, action }] }`.

#### MCP

- `tools`: `{ name, description?, input?, output?, effect }`, com `effect` em
  `read`, `write` ou `network`.
- `resources`: `{ uri, description? }`.
- `prompts`: `{ name, args?: string[] }`.

#### Setting

`{ key, type, default, values?, description? }`, com `type` em `string`,
`number`, `boolean` ou `enum`.

`default` aceita string, number ou boolean; `values`, quando presente, é
um array de strings. O cruzamento confere a existência da key e seu `type`,
sem comparar defaults, descrições ou listas de valores com o código.

#### Credential

`{ name, usedBy: string[], howToObtain? }`. `name` segue
`[a-z0-9][a-z0-9_.-]{0,63}`; `usedBy` lista paths de commands ou nomes de
tools.

#### Storage

`storage.tables` lista as tabelas de `~/.<bin>/data.db`, presente só quando
a pessoa pediu armazenamento (veja `template/db/`). Cada tabela é
`{ name, description?, columns }` e cada coluna
`{ name, type, primaryKey?, notNull?, description? }`, com `type` em
`INTEGER`, `REAL`, `TEXT`, `BLOB` ou `ANY`.

```yaml
storage:
  tables:
    - name: notes
      columns:
        - { name: id, type: INTEGER, primaryKey: true }
        - { name: title, type: TEXT, notNull: true }
        - { name: created_at, type: TEXT, notNull: true }
```

Quando o projeto tem `src/db/migrations/index.ts`, `spec check` aplica as
migrations num banco em memória e compara as tabelas e colunas que elas
criam com `storage.tables`: tipo, `primaryKey` e `notNull` (este, fora das
chaves primárias). O binário compilado não tem o código-fonte das
migrations e pula essa parte; `bun run spec:check` e
`bun run dev -- spec check` a executam.

### Corpo

- `## Purpose`: o problema, quem sofre com ele e o que muda com o binário.
- `## Audiences`: público, modo (TUI, CLI texto, CLI `--json`, MCP) e o que
  precisa fazer.
- `## Out of scope`: o que o binário não faz.
- `## Notes`: registro cronológico, uma linha datada por escolha relevante
  ou dúvida aberta. A seção existe mesmo vazia.

## Specs

Cada spec fica em `specs/NNNN-slug.md`: ID de quatro dígitos, sequencial,
e slug em kebab-case. O `id` do front matter é igual ao prefixo do nome.
`specs/README.md` é ignorado; outro `.md` fora do padrão recusa a leitura.

### Front matter

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `schemaVersion` | `"2.0.0"` | sim | versão do contrato |
| `id` | string de quatro dígitos | sim | igual ao prefixo do arquivo |
| `title` | string | sim | igual ao título no índice |
| `status` | enum | sim | `draft`, `in_progress`, `blocked`, `done`, `archived` |
| `createdAt` | date-time | sim | criação |
| `updatedAt` | date-time | sim | atualizada a cada edição |
| `closedAt` | date-time | só com `done` | gravado por `spec close` |
| `blockedReason` | string | só com `blocked` | motivo |
| `archivedReason` | string | só com `archived` | motivo |
| `changes` | objeto `{ add?, update?, remove? }` | não | mudanças na superfície |

`add` e `update` têm a forma da superfície do `CLISPEC.md` (`commands`,
`screens`, `mcp.tools`, `mcp.resources`, `mcp.prompts`, `settings`,
`credentials`, `storage.tables`), com entradas completas. `update` substitui
a entrada inteira de mesma chave. `remove` lista só as chaves, em listas
planas: `commands` (paths), `screens` (ids), `tools`, `resources` (URIs),
`prompts`, `settings` (keys), `credentials` (nomes) e `tables` (nomes).

```yaml
changes:
  add:
    commands:
      - path: orders export
        description: Export orders to CSV.
        options:
          - name: --since
            argument: date
        data: "{ file, count }"
        exitCodes: [4, 5]
        credentials: [shop.token]
  update:
    mcp:
      tools:
        - name: orders_list
          effect: network
          input: "{ status?, limit?, since? }"
  remove:
    settings: [shop.legacyMode]
```

### Corpo

Seis seções fixas, nesta ordem:

| Seção | Conteúdo |
| --- | --- |
| `## Goal` | a mudança, quem precisa dela e o que fica fora desta spec |
| `## Behavior` | como o binário funciona depois da mudança: fluxos, arguments e flags, saída em texto e em `--json`, erros e exit codes, teclas da TUI, entrada e saída das tools |
| `## Design` | como o código deve ser feito: arquivos e camadas, funções compartilhadas entre CLI, MCP e TUI, dependências, tratamento de erro e padrões do starter kit |
| `## Tasks` | checklist de entregas, cada uma com a tag da skill responsável |
| `## Tests` | checklist de testes de aceite |
| `## Notes` | registro datado |

Uma `draft` pode ter Behavior e Design vazias. `spec close` exige Goal,
Behavior e Design com texto, além de pelo menos uma tarefa; comentários
HTML (`<!-- -->`), usados como orientação no arquivo criado por
`spec new`, contam como vazio. `spec check` avisa spec `in_progress` sem
Behavior ou Design.

### Checklists

Tasks e Tests usam itens GFM, um por linha, com `{#id}` obrigatório de
quatro caracteres `[a-z0-9]`, fixo depois de criado e único na spec, e tag
opcional de skill:

```markdown
- [ ] Implement `orders export` `#termfy-cli` {#a1b2}
- [x] `orders export --json` returns `{ file, count }` {#c3d4}
```

Use o marcador `-`, seguido de `[ ]`, `[x]` ou `[X]`, texto não vazio, tag
opcional e ID no fim da linha. O texto não pode conter outro `{#...}`.
Outros marcadores de lista com checkbox ou estados diferentes recusam a
leitura, para que uma pendência não seja ignorada. Exemplos dentro de
blocos cercados por crases ou tils não entram na contagem. Tarefa sem tag
de skill gera aviso.

O progresso soma tarefas e testes: `{ done, total, percent }`, com
`percent` igual a `done / total * 100`, ou zero quando não há itens.

### Ciclo de `status`

| Estado | Significado |
| --- | --- |
| `draft` | spec registrada; seções podem estar vazias |
| `in_progress` | implementação começou |
| `blocked` | parada por dependência externa; exige `blockedReason`; `spec close` recusa |
| `done` | todos os itens `[x]`; `changes` já incorporado ao `CLISPEC.md`; exige `closedAt` |
| `archived` | encerrada sem conclusão; exige `archivedReason`; `changes` descartado |

`draft`, `in_progress` e `blocked` são estados abertos: seu `changes` ainda
não está no `CLISPEC.md`.

## Commands do binário

| Command | Função |
| --- | --- |
| `{{bin}} spec show [id]` | sem ID, `{ frontmatter, sections }` do `CLISPEC.md`; com ID, `{ file, slug, frontmatter, sections, tasks, tests, progress }` da spec |
| `{{bin}} spec list` | `{ source, specs[] }`: dos arquivos (`files`), com progresso e contagem de mudanças, ou do índice embutido (`index`) |
| `{{bin}} spec progress [id]` | uma spec, ou a soma das specs abertas |
| `{{bin}} spec check [--strict]` | valida o contrato e cruza com o código; `{ ok, errors, warnings, pending }` |
| `{{bin}} spec new <slug> [--title <text>] [--file <path>]` | cria a spec como `draft` e a registra no índice |
| `{{bin}} spec start <id>` | `draft` ou `blocked` para `in_progress` |
| `{{bin}} spec block <id> --reason <text>` | spec aberta para `blocked`, com `blockedReason` |
| `{{bin}} spec archive <id> --reason <text>` | spec aberta para `archived`, com `archivedReason`; `changes` descartado |
| `{{bin}} spec task add <id> <text> [--tag <skill>]` | acrescenta uma tarefa com `{#id}` gerado |
| `{{bin}} spec test add <id> <text>` | acrescenta um teste de aceite com `{#id}` gerado |
| `{{bin}} spec done <id> <item> [--undo]` | marca ou desmarca um item pelo `{#id}` |
| `{{bin}} spec close <id> [--file <path>]` | aplica `changes` ao `CLISPEC.md`, marca `done`, atualiza o índice e registra a data em `## Notes` |
| `{{bin}} spec sync [--write] [--spec <id>] [--file <path>]` | lista o que o código tem e o `CLISPEC.md` não; com `--write`, acrescenta ao `CLISPEC.md` ou, com `--spec`, ao `changes.add` de uma spec aberta |
| `{{bin}} spec migrate [--write] [--file <path>]` | converte um `CLISPEC.md` 1.0.0 |

Em texto, `spec show` apresenta identidade, contagens de superfície e de
specs e trechos de Purpose e Out of scope, limitados a 320 caracteres por
seção. Com ID, apresenta status, mudanças no formato `+add ~update -remove`,
Goal, Behavior, Design e itens pendentes.

O ID aceita a forma curta: `2`, `02` e `0002` indicam a mesma spec.

### Editar specs pelo binário

Os commands de edição evitam YAML e Markdown escritos à mão. Cada um
relê a spec antes de gravar, recusa um resultado inválido sem alterar o
arquivo, avança `updatedAt` e mantém o índice do `CLISPEC.md` igual à spec.

- `start`, `block` e `archive` mudam `status`. `done` só vem de
  `spec close`. `block` e `archive` exigem `--reason`.
- `task add` e `test add` geram um `{#id}` livre e acrescentam o item ao
  fim da seção. Specs `done` ou `archived` não recebem itens.
- `done` marca o item; `--undo` desmarca.

### `spec check`

Falha (exit code 3) quando:

- o front matter do `CLISPEC.md` ou de uma spec não passa no schema, um
  `{#id}` falta ou se repete, ou uma seção fixa falta, se repete ou está
  fora da ordem;
- `bin` ou `description` divergem do `package.json`;
- um command do `CLISPEC.md` não existe no registry, ou cita option,
  argument ou exit code que o registry não tem;
- uma screen, tool, resource, prompt ou setting do `CLISPEC.md` não existe no
  código, ou uma setting tem `type` diferente;
- `usedBy` de uma credencial cita command ou tool inexistente, ou um
  command cita credencial não declarada;
- uma spec está fora do índice, o índice cita spec sem arquivo, ou status e
  título divergem;
- uma spec aberta não se aplica ao `CLISPEC.md`: `add` de chave existente,
  `update` ou `remove` de chave ausente, ou a mesma chave duas vezes;
- uma credencial ou command de uma spec aberta cita consumidor ou
  credencial que nem o `CLISPEC.md` nem a spec declaram;
- uma tabela de `storage.tables` não é criada pelas migrations, ou uma
  coluna difere em tipo, `primaryKey` ou `notNull`.

Avisos (não falham, salvo `--strict`): command, screen, tool ou setting do
código ausente do `CLISPEC.md`; tarefa sem tag de skill; spec `in_progress`
sem Behavior ou Design; entrada de `changes` de uma spec `in_progress` ou
`blocked` que nenhuma tarefa ou teste cita pelo nome; duas specs abertas
mudando a mesma chave; tabela ou coluna das migrations ausente de
`storage.tables`; `CLISPEC.md` ainda em 1.0.0.

`pending` lista as divergências explicadas por uma spec aberta, no formato
`kind key (spec NNNN)`: uma entrada do código que a spec adiciona, ou uma
entrada do `CLISPEC.md` que a spec atualiza ou remove e que o código já
mudou. Elas não viram aviso nem erro.

Paths de commands usam os nomes principais do registry, incluindo os
agrupadores, como `config`, e os subcommands, como `config get`. Options
globais e options recursivas dos pais também são aceitas. Os exit codes
0, 1 e 2 são implícitos; os demais precisam existir na tabela central e no
command. Resources e prompts ausentes do `CLISPEC.md` não geram avisos.

Em `spec check --json`, um cruzamento concluído usa o envelope normal do
CLI e coloca o resultado em `data`; consulte `data.ok` e o exit code. Uma
falha de leitura usa o envelope de erro com `error.code: 3`.

`bun run spec:check` roda o mesmo cruzamento a partir do código-fonte, com
as specs do repositório, e confere que todo `getCredential("<name>")` em
`src/` aparece em `credentials` do `CLISPEC.md` ou de uma spec aberta. Ele
entra em `bun run validate`, sai com 1 quando há erro e com 0 quando passa.

### `spec close`

Aplica `changes`, marca a spec como `done` com `closedAt`, atualiza o
índice e acrescenta ao `## Notes` do `CLISPEC.md` a linha
`- AAAA-MM-DD: spec NNNN (título) closed.`

Recusa, sem gravar nada, quando a spec está `done`, `archived` ou
`blocked`; quando Goal, Behavior ou Design estão vazias; quando não há
tarefas; quando há item pendente; quando `changes` não se aplica; ou quando
o `CLISPEC.md` resultante falha em `spec check` contra o código e, com
banco, contra as migrations. Por isso,
rode `spec close` depois de implementar, com `bun run dev -- spec close <id>`
para usar os registries atuais.

### `spec sync`

Compara o código (registry, screens, catalog MCP, `SETTINGS_SCHEMA`) com o
`CLISPEC.md` e lista o que falta: commands com arguments, options, exit
codes e exemplo; screens; tools (com `effect: read`), resources e prompts;
settings. Entradas que uma spec aberta adiciona ficam de fora. Com
`--write`, acrescenta essas entradas ao front matter, atualiza o índice a
partir de `specs/`, preserva o corpo e avança `updatedAt`. O resultado é um
rascunho: ajuste `effect`, `data` e `credentials`.

Com `--spec <id>`, as entradas vão para o `changes.add` dessa spec aberta,
não para o `CLISPEC.md`. Use para adotar código que já existe sem spec:
quem fecha a spec com `spec close` traz as entradas para o `CLISPEC.md`, e a
adoção fica registrada no histórico.

O emissor YAML grava em estilo de blocos e omite arrays vazios, objetos
vazios e `interactive: false`.

### `spec migrate`

Converte um `CLISPEC.md` 1.0.0: remove `status` e a seção `## Checklist` e,
se a checklist tinha itens, cria `specs/NNNN-baseline.md` com os itens, o
status antigo e `changes` vazio. Sem `--write`, só mostra o plano. Texto
fora das seções fixas não é preservado. O binário lê um 1.0.0 em memória,
com aviso em `spec check`, até a migração.

## Tools MCP

- `spec`: `{ frontmatter, sections }` do `CLISPEC.md` embutido.
- `specs`: sem `id`, a mesma saída de `spec list --json`; com `id`, a mesma
  de `spec show <id> --json`.

As duas são de leitura. Uma falha devolve `isError: true` com a mensagem de
CONFIG.

## Exemplo

`CLISPEC.md`:

```markdown
---
schemaVersion: "2.0.0"
bin: mycli
title: My CLI
description: Query and update shop orders.
createdAt: "2026-11-10T12:00:00.000Z"
updatedAt: "2026-11-12T09:00:00.000Z"
commands:
  - path: orders list
    description: List shop orders.
    options:
      - name: --status
        argument: status
        values: [open, closed]
    data: "{ count, orders[] }"
    exitCodes: [4, 5]
    credentials: [shop.token]
credentials:
  - name: shop.token
    usedBy: [orders list]
    howToObtain: Shop dashboard, API section.
specs:
  - id: "0001"
    title: List orders
    status: done
  - id: "0002"
    title: Export orders
    status: in_progress
---

## Purpose

Quem opera a loja precisa consultar pedidos sem abrir o painel web.

## Audiences

| Público | Modo | Necessidade |
| --- | --- | --- |
| operador | TUI e CLI texto | ver pedidos abertos |
| CI | CLI `--json` | exportar pedidos do dia |

## Out of scope

- Criar ou cancelar pedidos.

## Notes

- 2026-11-10: visão macro registrada em entrevista.
```

`specs/0002-orders-export.md`:

```markdown
---
schemaVersion: "2.0.0"
id: "0002"
title: Export orders
status: in_progress
createdAt: "2026-11-12T09:00:00.000Z"
updatedAt: "2026-11-12T10:00:00.000Z"
changes:
  add:
    commands:
      - path: orders export
        description: Export orders to CSV.
        options:
          - name: --since
            argument: date
        data: "{ file, count }"
        exitCodes: [4, 5]
        credentials: [shop.token]
  update:
    credentials:
      - name: shop.token
        usedBy: [orders list, orders export]
---

## Goal

O CI precisa de um CSV diário dos pedidos. Importar CSV fica fora.

## Behavior

`orders export --since 2026-11-01` grava `orders-<data>.csv` na pasta atual
e imprime o caminho; `--json` devolve `{ file, count }`. Sem token, sai com 4.

## Design

`src/shop/orders.ts` ganha `exportOrders(since)`, usada pelo command. O
client HTTP de `src/shop/client.ts` pagina a listagem; o CSV é montado sem
dependência nova.

## Tasks

- [x] `exportOrders` com paginação `#termfy-api` {#e1a1}
- [ ] Command `orders export` `#termfy-cli` {#e1a2}

## Tests

- [ ] `orders export --json` devolve `{ file, count }` {#e1t1}
- [ ] Sem token, sai com exit code 4 {#e1t2}

## Notes

- 2026-11-12: formato de data do `--since` fica em ISO 8601.
```
