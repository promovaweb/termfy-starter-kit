---
name: termfy-clispec
description: Entrevista a pessoa para entender o que o binário precisa fazer e escreve ou revisa o CLISPEC.md, a visão macro única do binário (identidade, propósito, públicos, modos, fora de escopo, superfície entregue e índice das specs), conferida por `<bin> spec check`.
---

# Descrever o binário no CLISPEC.md

Use esta skill quando o projeto ainda não tem `CLISPEC.md` próprio (só o
do esqueleto), quando o propósito, os públicos ou os limites do binário
mudarem, ou quando a pessoa pedir uma visão geral do que o binário é. O
resultado é um único arquivo na raiz, `CLISPEC.md`, no contrato 2.0.0 de
`docs/spec.md` do starter kit.

O `CLISPEC.md` descreve o binário como um todo. Ele não planeja trabalho:
cada evolução fica em uma spec de `specs/`, escrita pela `termfy-spec`. A
superfície do front matter (commands, screens, tools, settings,
credenciais) registra o que já foi entregue e cresce quando uma spec é
fechada por `<bin> spec close`.

## Leia antes

- `AGENTS.md` do repositório.
- `CLISPEC.md` atual, a saída de `bun run dev -- spec show --json` e a de
  `bun run dev -- spec list`.
- `docs/spec.md` do starter kit: os dois documentos, o front matter, as
  seções e o ciclo das specs.
- `references/interview.md`: os blocos da entrevista e o que cada resposta
  preenche.
- `references/macro-view.md`: como escrever Purpose, Audiences e Out of
  scope, e como transformar a entrevista na lista de specs iniciais.

## Regras

1. Entreviste antes de escrever. O objetivo é entender o que a pessoa
   precisa fazer com o binário, quem vai usá-lo e por qual modo. Não
   preencha uma seção com suposição: pergunte, ou registre a dúvida em
   `## Notes` com data.
2. Blocos curtos: poucas perguntas por vez, confirmação em uma frase, até
   três caminhos por escolha aberta, com o recomendado primeiro, e espaço
   para resposta livre. Quando a frase da pessoa já responde um bloco, pule
   a pergunta e confirme o que entendeu.
3. O `CLISPEC.md` tem quatro seções fixas: `## Purpose`, `## Audiences`,
   `## Out of scope` e `## Notes`. Não crie checklist nele; tarefas e
   testes ficam nas specs, e `spec check` recusa `## Checklist` ou
   `## Tasks` no `CLISPEC.md`.
4. Não edite à mão a superfície entregue (`commands`, `screens`, `mcp`,
   `settings`, `credentials`, `storage`) nem o índice `specs`. A superfície
   muda por `spec close`; o índice muda pelos commands de spec. Para adotar
   código que já existe sem spec, crie uma spec de adoção com `spec new` e
   rode `spec sync --write --spec <id>`; o `spec close` dela traz as
   entradas para o `CLISPEC.md` e deixa a adoção no histórico.
5. `bin` e `description` vêm do `package.json`; quando a pessoa quiser
   mudar a identidade, encaminhe para `termfy-brand`.
6. Armazenamento local não é padrão. Só registre que o binário guarda
   dados quando a pessoa disser que precisa; nesse caso, anote em
   `## Purpose` o que é guardado e indique `termfy-database` na spec que
   criar as tabelas. As tabelas chegam a `storage.tables` pelo `spec close`
   dessa spec.
7. Prosa em português (ou no idioma da pessoa); nomes de commands, keys,
   tools e screens em inglês, como no código.
8. Projeto com `CLISPEC.md` 1.0.0: rode `bun run dev -- spec migrate`,
   mostre o plano e, com a concordância da pessoa, `--write`. A checklist
   antiga vira `specs/0001-baseline.md`.

## Passos

1. Rode `git status --short`, `bun run dev -- spec show --json`,
   `bun run dev -- spec list` e `bun run dev -- spec check --json` para ver
   o estado de partida.
2. Se o `CLISPEC.md` está em 1.0.0, migre (regra 8) antes de seguir.
3. Conduza a entrevista de `references/interview.md` na ordem: problema,
   públicos e modos, capacidades, dados e integrações, limites.
4. A cada bloco respondido, escreva a seção correspondente do
   `CLISPEC.md` e mostre o trecho à pessoa.
5. Avance `updatedAt`; em um `CLISPEC.md` novo, preencha também
   `createdAt`.
6. Monte com a pessoa a lista de specs iniciais (`references/macro-view.md`):
   uma por capacidade entregável, na ordem de entrega. Para cada
   uma aprovada, rode `bun run dev -- spec new <slug> --title "<título>"`.
7. Rode `bun run dev -- spec check --json`. Corrija erros de schema, seções
   e índice.
8. Indique a próxima skill: `termfy-spec` para detalhar a primeira spec da
   lista.

## Marcos

Problema e públicos confirmados; modos decididos; capacidades listadas;
dados e integrações nomeados; limites registrados; specs iniciais criadas;
`spec check` sem erros.

## Saída

Relate o caminho do `CLISPEC.md`, os públicos e modos registrados, as specs
criadas (ID e título), as dúvidas abertas em `## Notes`, o resultado de
`spec check` e a spec sugerida para a `termfy-spec`.

## Compatibilidade

Starter kit 0.8.x. Caminhos citados: `CLISPEC.md`, `specs/`, `docs/spec.md`,
`src/spec/schema.ts` e `src/cli/commands/spec.ts`. Confira o contrato com
`bun run spec:check`.
