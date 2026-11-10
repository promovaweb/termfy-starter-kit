---
name: termfy-cli
description: Cria e altera comandos do CLI Termfy com opções documentadas, saída em texto e JSON, códigos de saída fixos, documentação embutida (--skill) e descrição OpenCLI.
---

# Construir e evoluir o CLI

Use esta skill para adicionar, alterar ou remover comandos, subcomandos,
argumentos e opções, ou para mudar o formato de saída e os códigos de saída.

## Leia antes

- `docs/cli.md` e `docs/codigos-de-saida.md`.
- `src/cli/registro.ts` (tipos) e `src/cli/comandos/config.ts` (exemplo
  completo com subcomandos).
- `references/contrato-de-comando.md`: regras que todo comando cumpre.
- `references/saida-texto-json.md`: envelope JSON, stdout e stderr.
- `references/opencli.md` e `references/opencli/schema-draft.json` quando a
  mudança tocar a árvore pública de comandos.

## Regras que não mudam

1. Toda opção e todo argumento têm `descricao`. A descrição diz o efeito,
   os valores aceitos e o padrão. Ela alimenta `--help`, `--skill` e
   `--opencli` ao mesmo tempo.
2. `executar` devolve `{ dados, texto }`. `dados` é serializável e estável;
   `texto` é para pessoas. Nunca monte JSON à mão no `texto`.
3. Falhas previstas lançam `ErroApp` com o código da família certa, via
   `erro.uso`, `erro.configuracao`, `erro.credenciais`, `erro.rede`,
   `erro.naoEncontrado`, `erro.permissao`. Nunca `process.exit` dentro de um
   comando.
4. Segredos nunca entram por argumento. Use `lerSegredo()` ou `--stdin` e
   grave com `definirCredencial()`. Para consumir uma API, chame
   `obterCredencial(nome)`.
5. Comandos que exigem terminal recebem `interativo: true` e oferecem uma
   saída não interativa (`--stdin`, `--yes`).
6. Stdout só recebe dados. Progresso e avisos vão para `ctx.stderr`.
7. O parâmetro `--skill` continua imprimindo toda a documentação embutida.
   Se o comando novo merecer explicação além da referência gerada, escreva
   em `docs/cli.md`; o texto entra no binário no próximo build.

## Passos

1. Rode `git status --short`.
2. Copie `template/comando/exemplo.ts` para `src/cli/comandos/<nome>.ts` e
   ajuste os imports para caminhos relativos ao novo local.
3. Preencha a definição e implemente `executar`.
4. Registre em `src/cli/comandos.ts`.
5. Escreva ou ajuste testes em `tests/cli.test.ts` (subprocesso real) e, para
   lógica pura, em um arquivo próprio.
6. Rode `bun run opencli` e revise o diff de `docs/opencli.json`.
7. Rode `bun run validar`.
8. Atualize `docs/cli.md` quando o comando trouxer conceito novo. Toda mudança
   em `docs/` avança `ebook/VERSION` e pede `bun run ebook`, porque a mesma
   pasta vira o guia do usuário em PDF e EPUB.

## Marcos

Comando registrado e `--help` exibindo-o; testes verdes; `opencli.json`
regenerado; documentação ajustada.

## Saída

Liste arquivos criados ou alterados, comandos de validação executados com o
resultado e exemplos de uso do comando novo em texto e `--json`.

## Compatibilidade

Starter kit 0.2.x. Caminhos citados: `src/cli/registro.ts`,
`src/cli/comandos.ts`, `src/cli/comandos/*.ts`, `template/comando/exemplo.ts`,
`tests/cli.test.ts`, `docs/cli.md` e `docs/opencli.json`.
