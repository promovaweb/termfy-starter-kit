---
schemaVersion: 2.0.0
id: "0004"
title: Ferramentas de spec, storage e aba Specs
status: done
createdAt: "2026-11-11T01:53:16.512Z"
updatedAt: "2026-11-11T01:57:50.480Z"
changes:
  add:
    commands:
      - path: spec start
        description: Move a draft or blocked spec to in_progress.
        arguments:
          - name: id
            required: true
        options:
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, from, to }"
        exitCodes:
          - 3
          - 7
        example: termfy spec start 0002
      - path: spec block
        description: Mark an open spec as blocked, with a reason.
        arguments:
          - name: id
            required: true
        options:
          - name: "--reason"
            argument: text
            description: Why the spec is blocked; stored as blockedReason.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, from, to }"
        exitCodes:
          - 3
          - 7
        example: termfy spec block 0002 --reason "Waiting for the API key"
      - path: spec archive
        description: Archive an open spec without applying its changes, with a reason.
        arguments:
          - name: id
            required: true
        options:
          - name: "--reason"
            argument: text
            description: Why the spec is archived; stored as archivedReason.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, from, to }"
        exitCodes:
          - 3
          - 7
        example: termfy spec archive 0002 --reason "Waiting for the API key"
      - path: spec task
        description: Manage the tasks of a spec.
        data: "{ help } com --help"
        exitCodes:
          - 3
          - 7
      - path: spec task add
        description: Append a task to a spec with a generated {#id}.
        arguments:
          - name: id
            required: true
          - name: text
            required: true
            variadic: true
        options:
          - name: "--tag"
            argument: skill
            description: "Skill tag of the task: the skill responsible, such as termfy-cli."
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, item, section }"
        exitCodes:
          - 3
          - 7
        example: termfy spec task add 0002 Implement orders export --tag termfy-cli
      - path: spec test
        description: Manage the acceptance tests of a spec.
        data: "{ help } com --help"
        exitCodes:
          - 3
          - 7
      - path: spec test add
        description: Append a test to a spec with a generated {#id}.
        arguments:
          - name: id
            required: true
          - name: text
            required: true
            variadic: true
        options:
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, item, section }"
        exitCodes:
          - 3
          - 7
        example: termfy spec test add 0002 "orders export --json returns { file, count }"
      - path: spec done
        description: Mark a task or test of a spec as done by its {#id}.
        arguments:
          - name: id
            required: true
          - name: item
            required: true
        options:
          - name: "--undo"
            description: Unmark the item instead.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, item, done }"
        exitCodes:
          - 3
          - 7
        example: termfy spec done 0002 a1b2
    screens:
      - id: specs
        title: Specs
        description: Specs that evolve the binary, with status and progress
        keys:
          - key: up/down
            action: select spec
  update:
    commands:
      - path: tui
        description: Open the terminal interface (Overview and About). Requires a TTY.
        options:
          - name: "--tab"
            argument: tab
            values:
              - overview
              - specs
              - about
            description: Initial tab. Overrides tui.initialTab from settings.json.
        data: "{ closed }"
        exitCodes:
          - 8
        interactive: true
        example: termfy
      - path: spec
        description: Read and evolve the CLISPEC.md contract and its specs.
        data: "{ help } com --help"
        exitCodes:
          - 3
          - 7
      - path: spec close
        description: Apply a finished spec to CLISPEC.md and mark it done.
        arguments:
          - name: id
            required: true
        options:
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, file, check }"
        exitCodes:
          - 3
          - 7
        example: termfy spec close 0002
      - path: spec sync
        description: List code entries missing from CLISPEC.md and, with --write, append them as a draft.
        options:
          - name: "--write"
            description: Write the missing entries (to CLISPEC.md, or to the spec given by --spec).
          - name: "--spec"
            argument: id
            description: Open spec that receives the entries in changes.add instead of CLISPEC.md.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ file, written, commands[], screens[], tools[], resources[], prompts[], settings[], total }"
        exitCodes:
          - 3
          - 7
        example: termfy spec sync
    settings:
      - key: tui.initialTab
        type: enum
        default: overview
        values:
          - overview
          - specs
          - about
        description: Define a aba aberta ao iniciar a TUI.
closedAt: "2026-11-11T01:57:50.480Z"
---
## Goal

O contrato ganha controle do banco, edição de specs pelo binário e
rastreabilidade. As tabelas passam a fazer parte da superfície e são
conferidas contra as migrations. Agentes deixam de editar YAML e Markdown
das specs à mão. Fica de fora uma tela de edição de specs na TUI: a aba
Specs só lê.

## Behavior

- `spec start|block|archive <id>` mudam o status; `block` e `archive`
  exigem `--reason`. Transição inválida sai com 3; falta de motivo, com 2.
- `spec task add <id> <texto> [--tag <skill>]` e `spec test add <id> <texto>`
  geram o `{#id}` e respondem `{ id, item, section }`.
- `spec done <id> <item> [--undo]` marca ou desmarca e responde
  `{ id, item, done }`. Spec `done` ou `archived` recusa com 3.
- `spec close` registra `- AAAA-MM-DD: spec NNNN (título) closed.` no
  `## Notes` do `CLISPEC.md`.
- `spec sync --write --spec <id>` grava as entradas no `changes.add` da spec.
- `spec check` compara `storage.tables` com as migrations quando
  `src/db/migrations/index.ts` existe e avisa entrada de `changes` sem
  tarefa ou teste que a cite.
- A TUI ganha a aba Specs (tecla 2), com lista, detalhe da spec selecionada
  e resumo do `CLISPEC.md`; `tui --tab specs` e `tui.initialTab: specs`
  abrem nela.
- Os stubs de banco copiam `data.db` para `data.db.v<versão>.bak` antes de
  migrar um banco que já tem schema.

## Design

- `src/spec/schema.ts` e `src/spec/delta.ts`: `storage.tables` como oitava
  família de entrada, chave `name`.
- `src/spec/storage.ts`: carrega as migrations por caminho em tempo de
  execução (sem import literal, para o esqueleto compilar sem banco) e lê o
  schema com `PRAGMA table_xinfo` num banco em memória.
- `src/spec/markdown.ts`: faixas de seção que ignoram blocos cercados.
- `src/spec/edit.ts`: status, itens e marcação; relê antes de gravar e
  mantém o índice.
- `src/spec/files.ts` e `src/spec/sync.ts`: nota no fechamento e
  `addToSpec`.
- `src/tui/screens/specs.ts`: usa `listSpecs` e `describeSpec` do command.
- `template/db/database.ts`: `backupDatabase` com `VACUUM INTO`.

## Tasks

- [x] Campo storage.tables no CLISPEC e tabelas em changes `#termfy-cli` {#5art}
- [x] spec start, spec block e spec archive mudam o status `#termfy-cli` {#rtdp}
- [x] spec task, spec task add, spec test e spec test add geram itens `#termfy-cli` {#t26p}
- [x] spec done marca e desmarca itens `#termfy-cli` {#2fsa}
- [x] spec close registra a data no Notes do CLISPEC.md `#termfy-cli` {#hgi2}
- [x] spec sync --spec grava no changes.add da spec `#termfy-cli` {#1k5h}
- [x] Rastreabilidade de changes no spec check `#termfy-cli` {#dles}
- [x] Aba specs na TUI, tui --tab specs e tui.initialTab `#termfy-tui` {#7lpf}
- [x] Backup antes de migrar nos stubs de banco `#termfy-database` {#hg7r}
- [x] docs/spec.md, docs/cli.md, docs/tui.md e docs/configuration.md `#termfy-docs` {#gxru}

## Tests

- [x] spec check compara storage.tables com as migrations {#ao3t}
- [x] tests/spec-edit.test.ts cobre start, block, archive, task add, test add e done {#usxy}
- [x] Nota de fechamento e sync --spec cobertos em tests/spec-edit.test.ts {#rcyd}
- [x] Tabela declarada e coluna divergente detectadas contra migrations {#jf9r}
- [x] tests/tui.test.ts abre a aba specs e troca a spec com a seta {#h32z}
- [x] Stub de teste confere o backup antes da migration {#4whl}

## Notes
