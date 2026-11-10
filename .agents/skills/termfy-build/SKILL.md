---
name: termfy-build
description: Porta de entrada do vibecoding no Termfy. A pessoa descreve a ferramenta em linguagem natural e esta skill conduz o ciclo inteiro (init, brand, spec, implementação, docs e release) chamando as outras skills na ordem certa, com poucos checkpoints.
---

# Construir um binário a partir de uma descrição

Use esta skill quando a pessoa disser o que quer em linguagem natural
("quero um CLI que liste meus pedidos da loja e avise no terminal") e não
nomear uma skill específica. Ela não implementa nada por conta própria:
decide a ordem, chama as skills certas, mantém o `CLISPEC.md` como fonte do
trabalho e para em poucos pontos para a pessoa confirmar.

## Leia antes

- `AGENTS.md` do repositório.
- `CLISPEC.md` e `bun run dev -- spec show --json`, para saber se o projeto
  está no esqueleto, com spec ou em andamento.
- `references/flow.md`: os estágios, o que entra e o que sai de cada um, e
  os checkpoints.
- `references/first-prompt.md`: como transformar a frase da pessoa em
  respostas para a entrevista da `termfy-spec`.

## Regras

1. Poucas perguntas, cedo. Antes de qualquer skill, confirme em uma única
   mensagem: nome do executável, uma frase de propósito e os públicos (quem
   digita, quem roda por script, qual agente). O resto vem da entrevista da
   `termfy-spec`, e só o que a frase da pessoa não respondeu.
2. Checkpoints fixos: depois da spec (a pessoa aprova commands e telas) e
   antes da release (a pessoa aprova o `--help`, a TUI e o `mcp --list`). O
   resto corre sem parar, relatando marcos.
3. Uma entrega por vez, na ordem de `references/flow.md`. Cada entrega
   termina com teste verde e item da checklist marcado; só então a próxima.
4. Reutilize as skills; não reescreva o que elas fazem. `termfy-build`
   lê a saída de cada uma e decide o próximo passo.
5. Quando algo falhar duas vezes seguidas (teste, `spec check`, build),
   pare, mostre o erro e pergunte. Não insista em loop.
6. Nunca peça segredo no chat. Quando um command precisar de credencial,
   oriente `<bin> credentials set <name>` no terminal da pessoa e siga com
   o restante.
7. Relate em cada marco: o que ficou pronto, o que vem a seguir, como a
   pessoa testa agora (um comando).

## Passos

1. Diagnóstico: `git status --short`, `bun run dev -- --version`,
   `bun run dev -- spec show --json`, `bun run skills:check`. Decida o
   estágio: esqueleto, spec sem código, código em andamento ou pronto.
2. Se o projeto está no esqueleto: `termfy-init` (com a identidade
   confirmada) e `termfy-brand` se houver cor, créditos ou links a ajustar.
3. `termfy-spec`, alimentando a entrevista com `references/first-prompt.md`.
   Checkpoint 1: mostre a tabela de commands, screens e tools da spec e
   peça aprovação.
4. Para cada item da checklist, na ordem config → cli → mcp → tui:
   `termfy-config`, `termfy-cli` (ou `termfy-command-set` para uma família
   `recurso verbo`), `termfy-api` quando houver serviço externo,
   `termfy-mcp`, `termfy-tui`. Depois de cada item: `termfy-test` para a
   cobertura dos três modos.
5. `termfy-review` sobre a rodada; corrija o que ela apontar.
6. `termfy-docs`. Checkpoint 2: mostre `--help`, o frame da TUI de teste e
   `mcp --list`, e peça aprovação para a release.
7. `termfy-release`. Se a pessoa for usar com um agente, `termfy-mcp-client`.
8. Feche com o resumo: como instalar, como rodar os três modos, onde está a
   spec e o que ficou em `## Notes`.

## Marcos

Identidade confirmada; spec aprovada; cada item da checklist com teste
verde; review limpa; docs conferidas; release publicada.

## Saída

Relate o estágio alcançado, os commands, screens e tools entregues, os
testes executados, as pendências de `## Notes` e os comandos para a pessoa
experimentar.

## Compatibilidade

Starter kit 0.7.x. Caminhos citados: `CLISPEC.md`, `AGENTS.md` e os scripts
`dev`, `skills:check`, `validate`.
