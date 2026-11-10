---
name: termfy-cli
description: Cria e altera comandos do CLI Termfy com opções documentadas, saída em texto e JSON, códigos de saída fixos, documentação embutida (--skill) e descrição OpenCLI.
---

# Construir e evoluir o CLI

Use esta skill para adicionar, alterar ou remover comandos, subcomandos,
argumentos e opções, ou para mudar o formato de saída e os códigos de saída.

## Leia antes

- `CLISPEC.md` na raiz do projeto: a seção que descreve o que será
  implementado. Se o arquivo não existir ou não cobrir o pedido, rode a
  skill `termfy-spec` antes de continuar.
- `docs/cli.md` e `docs/exit-codes.md`.
- `src/cli/registry.ts` (tipos) e `src/cli/commands/config.ts` (exemplo
  completo com subcomandos).
- `references/command-contract.md`: regras que todo comando cumpre.
- `references/text-json-output.md`: envelope JSON, stdout e stderr.
- `references/opencli.md` e `references/opencli/schema-draft.json` quando a
  mudança tocar a árvore pública de comandos.

## Regras que não mudam

1. Toda opção e todo argumento têm `description`. A descrição diz o efeito,
   os valores aceitos e o padrão. Ela alimenta `--help`, `--skill` e
   `--opencli` ao mesmo tempo.
2. `run` devolve `{ data, text }`. `data` é serializável e estável;
   `text` é para pessoas. Nunca monte JSON à mão no `text`.
3. Falhas previstas lançam `AppError` com o código da família certa, via
   `error.usage`, `error.config`, `error.credentials`, `error.network`,
   `error.notFound`, `error.permission`. Nunca `process.exit` dentro de um
   comando.
4. Segredos nunca entram por argumento. Use `readSecret()` ou `--stdin` e
   grave com `setCredential()`. Para consumir uma API, chame
   `getCredential(name)`.
5. Comandos que exigem terminal recebem `interactive: true` e oferecem uma
   saída não interativa (`--stdin`, `--yes`).
6. Stdout só recebe dados. Progresso e avisos vão para `ctx.stderr`.
7. O parâmetro `--skill` continua imprimindo toda a documentação embutida.
   Se o comando novo merecer explicação além da referência gerada, escreva
   em `docs/cli.md`; o texto entra no binário no próximo build.

## Passos

1. Rode `git status --short`.
2. Copie `template/command/example.ts` para `src/cli/commands/<nome>.ts` e
   ajuste os imports para caminhos relativos ao novo local.
3. Preencha a definição e implemente `run`.
4. Registre em `src/cli/commands.ts`.
5. Escreva ou ajuste testes em `tests/cli.test.ts` (subprocesso real) e, para
   lógica pura, em um arquivo próprio.
6. Rode `bun run opencli` e revise o diff de `docs/opencli.json`.
7. Rode `bun run validate`.
8. Atualize `docs/cli.md` quando o comando trouxer conceito novo. A pasta `docs/`
   é a documentação do próprio projeto e entra no binário pelo `--skill`.

## Marcos

Comando registrado e `--help` exibindo-o; testes verdes; `opencli.json`
regenerado; documentação ajustada.

## Saída

Liste arquivos criados ou alterados, comandos de validação executados com o
resultado e exemplos de uso do comando novo em texto e `--json`.

## Compatibilidade

Starter kit 0.4.x. Caminhos citados: `src/cli/registry.ts`,
`src/cli/commands.ts`, `src/cli/commands/*.ts`, `template/command/example.ts`,
`tests/cli.test.ts`, `docs/cli.md` e `docs/opencli.json`.
