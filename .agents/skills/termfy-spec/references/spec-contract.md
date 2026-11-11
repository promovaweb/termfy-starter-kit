# Resumo do contrato 2.0.0

Fonte completa: `docs/spec.md` do starter kit. Schema: `src/spec/schema.ts`.

## Dois documentos

| Documento | Quantos | Conteúdo | Quem escreve |
| --- | --- | --- | --- |
| `CLISPEC.md` | um, na raiz | identidade, superfície entregue, índice `specs`, seções Purpose, Audiences, Out of scope e Notes | `termfy-clispec`; superfície e índice mudam por `spec close`, `spec new` e `spec sync` |
| `specs/NNNN-slug.md` | um por evolução | `changes`, seções Goal, Behavior, Design, Tasks, Tests e Notes | `termfy-spec` |

## Front matter da spec

```yaml
schemaVersion: "2.0.0"
id: "0002"              # igual ao prefixo do arquivo
title: Export orders    # igual ao índice do CLISPEC.md
status: draft           # draft, in_progress, blocked, done, archived
createdAt: "2026-11-12T09:00:00.000Z"
updatedAt: "2026-11-12T09:00:00.000Z"
# closedAt só com done (gravado por spec close)
# blockedReason só com blocked; archivedReason só com archived
changes:
  add:       # entradas completas, mesma forma do CLISPEC.md
    commands: []
    screens: []
    mcp: { tools: [], resources: [], prompts: [] }
    settings: []
    credentials: []
    storage:
      tables: []     # só com banco: { name, columns: [{ name, type, primaryKey?, notNull? }] }
  update:    # entrada completa que substitui a de mesma chave
    commands: []
  remove:    # só as chaves
    commands: []      # paths
    screens: []       # ids
    tools: []
    resources: []     # URIs
    prompts: []
    settings: []      # keys
    credentials: []   # nomes
    tables: []        # nomes
```

Chaves: command `path`, screen `id`, tool `name`, resource `uri`, prompt
`name`, setting `key`, credencial `name`, tabela `name`. Omita os blocos vazios.

## Corpo da spec

Seções fixas, nesta ordem: `## Goal`, `## Behavior`, `## Design`,
`## Tasks`, `## Tests`, `## Notes`.

Itens de Tasks e Tests:

```markdown
- [ ] Implement `orders export` `#termfy-cli` {#a1b2}
- [ ] `orders export --json` returns `{ file, count }` {#c3d4}
```

Marcador `-`, `[ ]` ou `[x]`, texto, tag opcional de skill e `{#id}` de
quatro caracteres `[a-z0-9]` no fim, único na spec. Exemplos em blocos
cercados não contam. O progresso soma tarefas e testes.

## Commands

| Command | Uso nesta skill |
| --- | --- |
| `spec new <slug> [--title <text>]` | cria a spec como `draft` e a coloca no índice |
| `spec show <id> [--json]` | confere o que foi gravado |
| `spec list` | specs com status, progresso e mudanças |
| `spec check [--json]` | valida schema, seções, índice e se `changes` se aplica ao `CLISPEC.md` |
| `spec start <id>` | marca o começo da implementação |
| `spec block <id> --reason <texto>` e `spec archive <id> --reason <texto>` | param ou encerram sem aplicar |
| `spec task add <id> <texto> --tag <skill>` | acrescenta tarefa com `{#id}` gerado |
| `spec test add <id> <texto>` | acrescenta teste com `{#id}` gerado |
| `spec done <id> <item> [--undo]` | marca ou desmarca um item |
| `spec sync --write [--spec <id>]` | atualiza o índice; com `--spec`, adota código existente no `changes.add` |
| `spec close <id>` | ao fim da implementação, incorpora `changes` ao `CLISPEC.md` |

## O que `spec check` aponta

- Erro: schema, seção ou `{#id}` inválidos; spec fora do índice ou com
  status e título diferentes; `add` de chave que o `CLISPEC.md` já tem;
  `update` ou `remove` de chave que ele não tem; credencial ou consumidor
  sem declaração.
- Erro de banco: tabela de `storage.tables` que as migrations não criam, ou
  coluna com tipo, `primaryKey` ou `notNull` diferentes.
- Aviso: tarefa sem tag de skill; spec `in_progress` sem Behavior ou
  Design; entrada de `changes` que nenhuma tarefa ou teste cita; tabela ou
  coluna das migrations fora de `storage.tables`; duas specs abertas
  mudando a mesma chave.
- `pending`: código à frente do `CLISPEC.md` por causa de uma spec aberta.
  Não é erro nem aviso.

## O que `spec close` exige

Status `draft` ou `in_progress`; Goal, Behavior e Design com texto; ao
menos uma tarefa; todos os itens marcados; `changes` aplicável; e o
`CLISPEC.md` resultante passando em `spec check` contra o código e as
migrations. Se algo falhar, nada é gravado. Ao fechar, a data entra em
`## Notes` do `CLISPEC.md`.
