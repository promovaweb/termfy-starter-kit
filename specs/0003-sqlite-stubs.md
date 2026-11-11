---
schemaVersion: 2.0.0
id: "0003"
title: Stubs de banco SQLite opcional
status: done
createdAt: "2026-11-11T01:32:25.615Z"
updatedAt: "2026-11-11T01:32:26.242Z"
closedAt: "2026-11-11T01:32:26.242Z"
---
## Goal

Projetos derivados que precisam guardar dados ganham um caminho único para
SQLite. O esqueleto continua sem banco: os stubs ficam em `template/db/` e
só entram em `src/` quando a pessoa pede armazenamento.

## Behavior

Nenhuma mudança no binário do esqueleto. Um projeto que copia os stubs
grava em `~/.<bin>/data.db` com as migrations embutidas no executável (redirecionado por `<BIN>_HOME`), aplica as
migrations pendentes ao abrir e recusa, com exit code 3, um banco cujo
schema é mais novo que o binário. Linha ausente sai com exit code 6.

## Design

- `template/db/database.ts`: `openDatabase()` com `bun:sqlite`, foreign keys,
  WAL e `migrate()` por `PRAGMA user_version`, uma transação por migration.
- `template/db/migrations/`: um arquivo por migration e `index.ts` com o
  registro, que recusa versão fora de sequência.
- `template/db/command.ts`: `db status` e `db migrate`.
- `template/db/repository.ts`: SQL de uma tabela com statements preparados e
  parâmetros nomeados, compartilhado por CLI, MCP e TUI.
- `template/db/example-test.ts`: testes com `:memory:`; o nome não termina
  em `.test.ts` para o `bun test` não rodar o stub.

## Tasks

- [x] Stubs de abertura, migrations (um arquivo cada), repositório e command `db` em `template/db/` `#termfy-database` {#d301}
- [x] Stub de teste com banco em memória `#termfy-test` {#d302}
- [x] `template/README.md` e `docs/architecture.md` citam os stubs `#termfy-docs` {#d303}

## Tests

- [x] Stubs compilam no `typecheck` {#d3t1}
- [x] Stub de teste passa quando copiado para um `.test.ts` {#d3t2}
- [x] Binário compilado com os stubs aplica a migration numa pasta vazia, sem o repositório {#d3t3}

## Notes

- 2026-11-10: banco só por pedido da pessoa; o esqueleto não abre `data.db`.
