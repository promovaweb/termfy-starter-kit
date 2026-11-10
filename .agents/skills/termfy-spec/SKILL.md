---
name: termfy-spec
description: Entrevista a pessoa e escreve ou revisa o CLISPEC.md do binário no contrato do starter kit (front matter validado, seções fixas e checklist com {#id}), conferido por `<bin> spec check`, para que as demais skills implementem com o pedido claro.
---

# Montar o CLISPEC.md

Use esta skill antes de implementar qualquer command, screen ou tool em um
projeto derivado do starter kit, quando `CLISPEC.md` não existir, descrever
só o esqueleto de exemplo ou não cobrir o pedido atual. O resultado é um
único arquivo na raiz, `CLISPEC.md`, que `<bin> spec check` valida e que as
skills `termfy-cli`, `termfy-tui`, `termfy-mcp` e `termfy-config` leem antes
de tocar no código, marcando a checklist conforme avançam.

## Leia antes

- `AGENTS.md` do repositório.
- `CLISPEC.md` atual e a saída de `bun run dev -- spec show --json`.
- `docs/spec.md` do starter kit (cópia em `references/clispec-contract.md`):
  front matter, seções, checklist e regras de `spec check`.
- `references/interview.md`: as perguntas, em ordem, e o que cada resposta
  preenche.
- `docs/cli.md`, `docs/tui.md`, `docs/mcp.md` e `docs/configuration.md` do
  starter kit, para conhecer o que o esqueleto já oferece.

## Regras

1. A spec descreve o que o binário faz, não como o código é organizado.
2. O front matter guarda a parte estruturada (commands, screens, mcp,
   settings, credentials) com os nomes que vão para o código, em inglês. A
   prosa das seções fica em português.
3. Cada command entra com `path`, `description`, `arguments`, `options`,
   `data`, `exitCodes`, `credentials` e `example`. Cada tool com `effect`
   (`read`, `write` ou `network`). Cada credencial com `name` no formato
   `service.purpose` e `usedBy`.
4. Exit codes citados existem em `src/app/exit-codes.ts`. Uma família nova
   entra na spec e, na implementação, no código.
5. A checklist tem um item por entrega, com `{#id}` de quatro caracteres
   gerado uma vez e a tag da skill responsável (`#termfy-cli`, `#termfy-tui`,
   `#termfy-mcp`, `#termfy-config`).
6. Não invente requisitos. Dúvida sem resposta vai para `## Notes` como
   pergunta aberta, datada.
7. Entrevista em blocos curtos: poucas perguntas por vez, confirmação em uma
   frase, até três caminhos por escolha aberta com o recomendado primeiro.
   Quando o pedido já responde o bloco, pule a pergunta.

## Passos

1. Rode `git status --short`, leia o `CLISPEC.md` atual e rode
   `bun run dev -- spec check --json` para ver o estado de partida.
2. Conduza a entrevista de `references/interview.md` na ordem: identidade,
   propósito e públicos, modos, commands, TUI, MCP, configuração e
   credenciais, fora de escopo, checagens de aceite.
3. A cada bloco respondido, escreva a parte correspondente do `CLISPEC.md`
   (front matter ou seção) e mostre o trecho à pessoa.
4. Preencha `status: draft`, `createdAt` e `updatedAt` com o momento atual
   em uma spec nova; em revisão, preserve `createdAt` e avance `updatedAt`.
5. Rode `bun run dev -- spec check --json`. Erros de schema, `{#id}` ou de
   nomes que já existem no código precisam ser corrigidos agora. Avisos de
   command ou screen que ainda não existem no código são esperados: eles
   são o trabalho a fazer.
6. Releia o arquivo inteiro: nomes em inglês, options sem colisão com as
   globais (`--help`, `--version`, `--json`, `--skill`, `--opencli`,
   `--no-color`), credenciais nomeadas, checklist cobrindo cada command,
   screen, tool e setting da spec.
7. Liste as pendências de `## Notes` e pergunte se a pessoa quer resolvê-las
   agora ou seguir para a implementação.
8. Indique a próxima skill: `termfy-cli` para commands, `termfy-tui` para
   screens, `termfy-mcp` para tools, `termfy-config` para settings e
   credenciais.

## Marcos

Identidade e propósito confirmados; commands fechados; TUI e MCP decididos;
settings e credenciais nomeadas; `spec check` sem erros; checklist gravada.

## Saída

Relate o caminho do `CLISPEC.md`, o número de commands, screens, tools,
settings e credenciais especificados, o resultado de `spec check`, as
pendências abertas e a skill sugerida para o próximo passo.

## Compatibilidade

Starter kit 0.5.x. Caminhos citados: `CLISPEC.md`, `docs/spec.md`,
`src/spec/schema.ts`, `src/cli/commands/spec.ts` e `tests/spec.test.ts`.
Confira o contrato com `bun run spec:check`.
