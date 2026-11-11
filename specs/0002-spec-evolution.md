---
schemaVersion: 2.0.0
id: "0002"
title: Specs de evolução do binário
status: done
createdAt: "2026-11-11T01:26:06.672Z"
updatedAt: "2026-11-11T01:32:15.139Z"
changes:
  add:
    commands:
      - path: spec list
        description: List the specs with status, progress and change counts.
        data: "{ source, specs[] }"
        exitCodes:
          - 3
        example: termfy spec list
      - path: spec new
        description: Create specs/NNNN-<slug>.md as a draft and add it to the CLISPEC.md index.
        arguments:
          - name: slug
            required: true
        options:
          - name: "--title"
            argument: text
            description: Spec title. Defaults to the slug in words.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ id, file, title }"
        exitCodes:
          - 3
          - 7
        example: termfy spec new orders-export --title "Export orders to CSV"
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
      - path: spec migrate
        description: Convert a schemaVersion 1.0.0 CLISPEC.md to 2.0.0, moving its checklist into specs/.
        options:
          - name: "--write"
            description: Write the converted files. Without it, only reports the plan.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ needed, migrated, file, spec? }"
        exitCodes:
          - 3
          - 7
        example: termfy spec migrate
    mcp:
      tools:
        - name: specs
          description: List the specs that evolve the binary, or read one by id with its changes, tasks, tests and progress. Read only.
          input: "{ id? }"
          output: "{ source, specs[] } ou { file, slug, frontmatter, sections, tasks, tests, progress }"
          effect: read
  update:
    commands:
      - path: spec
        description: Read and evolve the CLISPEC.md contract and its specs.
        data: "{ help } com --help"
        exitCodes:
          - 3
          - 7
      - path: spec show
        description: Show CLISPEC.md, or one spec of specs/ when an ID is given.
        arguments:
          - name: id
        data: "{ frontmatter, sections } sem id; { file, slug, frontmatter, sections, tasks, tests, progress } com id"
        exitCodes:
          - 3
        example: termfy spec show
      - path: spec progress
        description: Show completed tasks and tests of one spec, or of every open spec.
        arguments:
          - name: id
        data: "{ open, done, total, percent, specs[] } sem id; { id, status, done, total, percent } com id"
        exitCodes:
          - 3
        example: termfy spec progress
      - path: spec check
        description: Validate CLISPEC.md against the executable registries and the specs against CLISPEC.md.
        options:
          - name: "--strict"
            description: Fail on warnings as well as errors. Disabled by default.
        data: "{ ok, errors[], warnings[], pending[] }"
        exitCodes:
          - 3
        example: termfy spec check
      - path: spec sync
        description: List code entries missing from CLISPEC.md and, with --write, append them as a draft.
        options:
          - name: "--write"
            description: Rewrite the front matter of the file with the missing entries appended.
          - name: "--file"
            argument: path
            default: CLISPEC.md
            description: CLISPEC.md to read and write; specs/ sits next to it.
        data: "{ file, written, commands[], screens[], tools[], resources[], prompts[], settings[], total }"
        exitCodes:
          - 3
          - 7
        example: termfy spec sync
    mcp:
      tools:
        - name: spec
          description: Read the binary contract (CLISPEC.md) before operating it or proposing changes. Returns identity, delivered surface, spec index and sections without writing.
          input: "{}"
          output: "{ frontmatter, sections }"
          effect: read
closedAt: "2026-11-11T01:32:15.139Z"
---
## Goal

O `CLISPEC.md` deixa de misturar a fotografia do binário com o plano de
trabalho. Ele passa a guardar só a visão macro (identidade, superfície
entregue e índice de specs), e cada evolução ganha um arquivo em `specs/`
com as mudanças de superfície, as tarefas e os testes de aceite. Fica de
fora uma screen de specs na TUI.

## Behavior

- `spec show` sem ID resume o `CLISPEC.md` com contagens de superfície e de
  specs; com ID, mostra status, mudanças (`+add ~update -remove`), Goal,
  Behavior, Design e itens pendentes. `--json` devolve o documento inteiro.
- `spec list` lê `specs/` quando roda na pasta do projeto e, fora dela, o
  índice embutido no `CLISPEC.md` (`source: files` ou `index`).
- `spec new <slug>` grava `specs/NNNN-<slug>.md` com o próximo ID, status
  `draft` e comentários de orientação, e acrescenta a entrada ao índice.
- `spec close <id>` exige Goal, Behavior e Design preenchidos, ao menos uma
  tarefa e todos os itens marcados; aplica `changes` à superfície, marca
  `done` com `closedAt` e atualiza o índice. Conflito ou divergência com o
  código recusa sem gravar, com exit code 3.
- `spec check` trata como `pending` o que uma spec aberta planeja e avisa
  spec `in_progress` sem Behavior ou Design.
- `spec migrate` mostra o plano e, com `--write`, converte o 1.0.0.

## Design

- `src/spec/schema.ts`: schemas Zod do CLISPEC 2.0.0, da spec e do 1.0.0.
- `src/spec/parse.ts`: um leitor de documento para os dois formatos, com
  seções fixas e checklists; o 1.0.0 vira 2.0.0 em memória com a checklist
  guardada em `legacy`.
- `src/spec/delta.ts`: tabela das sete famílias de entrada e
  `applyChanges`, que não altera a entrada e relata todos os conflitos.
- `src/spec/index.ts`: `CLISPEC.md` embutido no build; `specs/` lido do
  disco só quando o `CLISPEC.md` da pasta pertence ao binário.
- `src/spec/files.ts`: operações de escrita que calculam tudo antes de
  gravar.
- `src/cli/commands/spec.ts` e `src/mcp/tools/spec.ts` compartilham
  `listSpecs` e `describeSpec`.

## Tasks

- [x] Schema 2.0.0 do CLISPEC e das specs, com leitura do 1.0.0 `#termfy-cli` {#s201}
- [x] Aplicação de `changes` (add, update, remove) à superfície `#termfy-cli` {#s202}
- [x] `spec check` cruza specs abertas com o CLISPEC e relata pendências `#termfy-cli` {#s203}
- [x] Commands `spec list`, `spec new`, `spec close` e `spec migrate` `#termfy-cli` {#s204}
- [x] `spec show` e `spec progress` aceitam o ID de uma spec `#termfy-cli` {#s205}
- [x] Tool MCP `specs` e tool `spec` sem checklist `#termfy-mcp` {#s206}
- [x] `docs/spec.md`, `docs/cli.md` e `docs/mcp.md` no contrato novo `#termfy-docs` {#s207}

## Tests

- [x] Parser recusa checklist no CLISPEC 2.0.0 e item sem ID nas specs {#t201}
- [x] `spec close` recusa item pendente e conflito de `changes` sem gravar {#t202}
- [x] `spec migrate --write` move a checklist do 1.0.0 para `specs/0001-baseline.md` {#t203}
- [x] Entrada de spec aberta aparece em `pending`, não em `warnings` {#t204}
- [x] Tool MCP `specs` lista e lê uma spec pelo `id` {#t205}

## Notes

- 2026-11-10: spec criada para registrar a própria mudança de contrato.
