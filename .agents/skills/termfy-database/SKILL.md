---
name: termfy-database
description: Adiciona armazenamento SQLite a um binário Termfy somente quando a pessoa pede, com o banco em ~/.<bin>/data.db, schema gerido por migrations embutidas no binário, repositórios compartilhados por CLI, MCP e TUI e testes com banco em memória.
---

# Guardar dados em SQLite

Use esta skill quando uma spec aberta pedir que o binário guarde dados
entre execuções: histórico, cache, fila, registros próprios. O esqueleto do
starter kit não tem banco, e um binário só ganha um quando a pessoa disser
que precisa. Settings continuam em `settings.json` e segredos no cofre; o
banco guarda os dados do domínio.

O starter kit traz os stubs em `template/db/`: abertura do banco, registro
de migrations, uma migration de exemplo, um repositório, o command `db` e
um teste. Esta skill copia o que a spec pede, cria as tabelas por
migration e liga os repositórios aos commands, tools e screens.

## Leia antes

- `AGENTS.md` do repositório.
- A spec aberta (`bun run dev -- spec show <id> --json`), em especial o
  Design: tabelas, colunas, consultas e a migration nova.
- `template/README.md` e os stubs `template/db/database.ts`,
  `template/db/migrations/index.ts`,
  `template/db/migrations/0001-create-notes.ts`,
  `template/db/repository.ts`, `template/db/command.ts` e
  `template/db/example-test.ts`.
- `references/migrations.md`: regras de criação e evolução do schema.
- `references/repositories.md`: SQL, tipos, erros e uso nos três modos.
- `src/config/paths.ts`, para a pasta de dados do app.

## Regras

1. Sem pedido, sem banco. Se a spec não fala em guardar dados, não crie a
   pasta `db` em `src/`. Se a necessidade aparecer no meio do trabalho, volte à
   `termfy-spec` para registrar a mudança antes de implementar.
2. Um arquivo por binário: `~/.<bin>/data.db`, na pasta de dados do app,
   obtido por `databasePath()`. `<BIN>_HOME` redireciona a pasta em testes
   e CI. Não aceite outro caminho por flag ou setting sem a spec pedir.
3. O schema muda só por migration. Uma migration por arquivo em
   `db/migrations/NNNN-<name>.ts`, dentro de `src/`, versões a partir de 1,
   em sequência, registradas em `db/migrations/index.ts`. Migration
   publicada em release nunca é editada; mudança de tabela é migration
   nova.
4. As migrations ficam embutidas no binário: cada arquivo é importado
   estaticamente pelo registro. Não leia SQL do disco nem monte a lista com
   import dinâmico; o binário compilado roda onde o repositório não existe.
5. `openDatabase()` aplica as migrations pendentes ao abrir, liga foreign
   keys e usa WAL. Um banco mais novo que o binário é recusado com exit
   code 3.
6. Use `bun:sqlite`; não acrescente driver ou ORM ao `package.json`.
7. SQL só nos repositórios (`db/<resource>.ts` dentro de `src/`), com statements
   preparados e parâmetros nomeados. Commands, tools e screens chamam as
   funções do repositório; nenhum deles monta SQL.
8. Segredos nunca vão para o banco; ficam no cofre (`getCredential()`).
9. Erros do SQLite viram `AppError`: CONFIG (3) para banco ilegível ou
   schema incompatível, PERMISSION (7) para pasta sem acesso, NOT_FOUND (6)
   para linha ausente. Nenhum stack trace do driver chega à pessoa.
10. Testes usam `openDatabase(":memory:")`, um banco por teste, sem tocar
    em `~/.<bin>/`.
11. As tabelas fazem parte da superfície. A spec as declara em
    `changes.add.storage.tables` (ou `update`, `remove.tables`) com as
    colunas, o tipo (`INTEGER`, `REAL`, `TEXT`, `BLOB`, `ANY`),
    `primaryKey` e `notNull`. `bun run spec:check` aplica as migrations num
    banco em memória e compara; divergência é erro.
12. Não há rollback. Antes de migrar um banco que já tem schema,
    `migrate()` copia o arquivo para `data.db.v<versão>.bak`; preserve esse
    comportamento ao copiar o stub.

## Passos

1. Rode `git status --short` e `bun run dev -- spec show <id> --json`.
   Confirme que a spec pede armazenamento, que `changes` declara as tabelas
   em `storage.tables` e que o Design descreve a migration. Se faltar,
   volte à `termfy-spec`.
2. Na primeira vez no projeto: copie `template/db/database.ts` para
   `db/database.ts` e `template/db/migrations/index.ts` para
   `db/migrations/index.ts`, ambos dentro de `src/`, ajustando os imports (`../../src/` vira
   `../`). Não copie a migration de exemplo de notes se a spec não pedir
   essa tabela; comece a lista com a primeira migration da spec.
3. O `index.ts` copiado importa a migration de exemplo de notes. Troque esse
   import e a lista pela primeira migration da spec.
4. Crie a migration da spec em `db/migrations/NNNN-<name>.ts`, sob `src/`, com a
   próxima versão, e registre-a no `index.ts`.
5. Crie o repositório de cada tabela em `db/<resource>.ts`, sob `src/`, a partir de
   `template/db/repository.ts`.
6. Quando a spec pedir `db status` e `db migrate`, copie
   `template/db/command.ts` para `db.ts` em `src/cli/commands/` e registre em
   `src/cli/commands.ts`. Os commands entram em `changes` da spec e em
   `docs/cli.md`.
7. Ligue os repositórios aos commands, tools e screens da spec. Abra o
   banco no `run` e feche em `finally`.
8. Escreva os testes a partir de `template/db/example-test.ts` em
   `tests/<resource>.test.ts`: migrations do zero, operações do
   repositório, linha ausente e banco mais novo que o binário.
9. Documente o banco em `docs/configuration.md` (arquivo, quando é criado,
   como apagar) e os commands novos em `docs/cli.md`.
10. Rode `bun run build` e o binário de `dist/` numa pasta vazia com
   `<BIN>_HOME` temporário, para comprovar que as migrations estão
   embutidas.
11. Rode `bun run spec:check`: as tabelas da spec aberta aparecem em
    `pending` até o `spec close`, e qualquer divergência de coluna é erro.
12. Rode `bun run validate` e marque os itens `#termfy-database` com
    `bun run dev -- spec done <id> <item>`.

## Marcos

Necessidade e tabelas confirmadas na spec; pasta `db` criada em `src/`; migration registrada;
repositórios ligados aos três modos; testes em memória verdes; binário
compilado aplica as migrations fora do repositório; `validate` verde.

## Saída

Relate as tabelas criadas, a versão do schema, os arquivos novos, os
commands, tools e screens que usam o banco, o resultado dos testes e do
binário compilado e os itens marcados na spec.

## Compatibilidade

Starter kit 0.8.x. Caminhos citados: `template/db/`, `template/README.md`,
`src/config/paths.ts`, `src/cli/commands.ts`, `docs/configuration.md` e
`docs/cli.md`. Confira com `bun run validate`.
