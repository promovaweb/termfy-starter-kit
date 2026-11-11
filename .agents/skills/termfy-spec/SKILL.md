---
name: termfy-spec
description: Entrevista a pessoa e escreve uma spec de evolução em specs/NNNN-slug.md (changes da superfície, Behavior de como o binário vai funcionar, Design de como o código deve ser feito, Tasks e Tests), conferida por `<bin> spec check`, para que as skills de implementação trabalhem com o pedido claro.
---

# Escrever uma spec de evolução

Use esta skill antes de implementar qualquer command, screen, tool,
setting, credencial ou tabela em um projeto derivado do starter kit,
sempre que nenhuma spec aberta cobrir o pedido. Cada evolução do binário
tem a sua spec em `specs/NNNN-slug.md`; o `CLISPEC.md`, mantido pela
`termfy-clispec`, segue único e guarda a visão macro.

Uma spec define duas coisas: como o binário vai funcionar depois da
mudança (`changes` no front matter e a seção `## Behavior`) e como o código
deve ser feito (`## Design`). `## Tasks` e `## Tests` transformam isso em
entregas verificáveis. As skills `termfy-cli`, `termfy-tui`, `termfy-mcp`,
`termfy-config`, `termfy-api` e `termfy-database` leem a spec antes de
tocar no código e marcam os itens conforme avançam.

## Leia antes

- `AGENTS.md` do repositório.
- `CLISPEC.md` (`bun run dev -- spec show --json`) e as specs existentes
  (`bun run dev -- spec list`), para saber o que já foi entregue e o que
  está aberto.
- `docs/spec.md` do starter kit (resumo em `references/spec-contract.md`):
  front matter, `changes`, seções, checklists e regras de `spec check` e
  `spec close`.
- `references/interview.md`: os blocos da entrevista e o que cada resposta
  preenche.
- `references/behavior-design.md`: como escrever Behavior e Design com
  detalhe suficiente para outra skill implementar sem perguntar de novo.
- `docs/architecture.md`, `docs/cli.md`, `docs/tui.md`, `docs/mcp.md` e
  `docs/configuration.md` do starter kit, para saber o que o esqueleto já
  oferece e quais padrões o Design deve seguir.

## Regras

1. Entreviste antes de escrever. Uma spec registra o que a pessoa pediu,
   não o que o agente imagina. Dúvida sem resposta vai para `## Notes`,
   datada, e a spec fica em `draft` até ser respondida.
2. Blocos curtos: poucas perguntas por vez, confirmação em uma frase, até
   três caminhos por escolha aberta, com o recomendado primeiro, e espaço
   para resposta livre. Pule a pergunta que a pessoa já respondeu.
3. Uma spec por evolução entregável. Se o pedido mistura capacidades
   independentes, proponha dividir em specs separadas.
4. `changes` descreve a superfície com os nomes do código, em inglês:
   `add` para o que é novo, `update` com a entrada completa para o que
   muda, `remove` com as chaves do que sai. Cada command entra com `path`,
   `description`, `arguments`, `options`, `data`, `exitCodes`,
   `credentials` e `example`; cada tool com `effect` (`read`, `write` ou
   `network`); cada credencial com `name` em `service.purpose` e `usedBy`.
5. `## Behavior` diz como o binário funciona para quem usa: fluxo, saída em
   texto e em `--json`, mensagens de erro, exit codes, teclas da TUI,
   entrada e saída das tools. `## Design` diz como o código deve ser
   feito: arquivos novos e alterados, funções compartilhadas entre CLI,
   MCP e TUI, dependências, tratamento de erro e o padrão do starter kit
   que se aplica. As duas seções são obrigatórias para `spec close`.
6. Use os exit codes de `src/app/exit-codes.ts`. Família nova entra como
   tarefa da spec, implementada antes do command que a usa.
7. Banco de dados não é padrão. Só proponha SQLite quando a pessoa disser
   que precisa guardar dados entre execuções. Nesse caso, as tabelas entram
   em `changes.add.storage.tables` (ou `update`, `remove.tables`) com nome,
   colunas, tipo, `primaryKey` e `notNull`; o Design descreve o arquivo
   `~/.<bin>/data.db`, a migration nova e as funções de repositório; a
   tarefa leva a tag `#termfy-database`. `spec check` confere as tabelas
   contra as migrations.
8. `## Tasks` tem um item por entrega, criado com
   `bun run dev -- spec task add <id> "<texto>" --tag <skill>`, que gera o
   `{#id}`. A tag é a skill responsável (`#termfy-cli`,
   `#termfy-tui`, `#termfy-mcp`, `#termfy-config`, `#termfy-api`,
   `#termfy-database`, `#termfy-docs`). `## Tests` tem um item por teste de
   aceite, criado com `spec test add <id> "<texto>"` e escrito como comando
   e resultado esperado. Cada entrada de `changes` (command, screen, tool,
   setting, credencial, tabela) aparece pelo nome no texto de ao menos uma
   tarefa ou teste; `spec check` avisa a que ficar sem.
9. A entrevista cria itens pendentes. Quem implementa e testa marca o item.
   Não marque uma entrega como concluída só por descrevê-la.
10. Crie o arquivo com `bun run dev -- spec new <slug>`; não invente o ID.
    Ao começar a implementação, rode `bun run dev -- spec start <id>`. Use
    `spec block <id> --reason` e `spec archive <id> --reason` em vez de
    editar o status à mão.
11. Código que já existe sem spec entra por uma spec de adoção:
    `bun run dev -- spec sync --write --spec <id>` grava as entradas que
    faltam no `changes.add` dela.

## Passos

1. Rode `git status --short`, `bun run dev -- spec list` e
   `bun run dev -- spec check --json`. Se o `CLISPEC.md` não descreve o
   binário (só o esqueleto) ou está em 1.0.0, passe antes pela
   `termfy-clispec`.
2. Se a `termfy-clispec` já criou a spec, abra-a; senão, rode
   `bun run dev -- spec new <slug> --title "<título>"`.
3. Conduza a entrevista de `references/interview.md` na ordem: objetivo,
   comportamento, superfície, dados e integrações, desenho do código,
   aceite.
4. A cada bloco respondido, escreva a parte correspondente da spec (front
   matter ou seção) e mostre o trecho à pessoa.
5. Avance `updatedAt` a cada edição.
6. Rode `bun run dev -- spec check --json`. Corrija erros de schema, de
   seções, de `{#id}`, de índice e de `changes` que não se aplicam ao
   `CLISPEC.md`. Entradas que a spec planeja e o código ainda não tem não
   são erro; o código à frente do `CLISPEC.md` aparece em `pending`.
7. Releia a spec inteira com a pessoa: Behavior responde como usar, Design
   responde onde e como implementar, cada entrada de `changes` tem tarefa e
   teste.
8. Liste as dúvidas de `## Notes` e pergunte se a pessoa quer resolvê-las
   agora ou seguir para a implementação.
9. Indique a próxima skill pela primeira tarefa pendente. Ao final da
   implementação, com todos os itens marcados, `bun run dev -- spec close
   <id>` incorpora a spec ao `CLISPEC.md`.

## Marcos

Objetivo confirmado; comportamento descrito; superfície em `changes`;
dados e integrações nomeados; Design aprovado; tarefas e testes gravados;
`spec check` sem erros.

## Saída

Relate o caminho da spec, o status, a contagem de `changes`
(`+add ~update -remove`), o número de tarefas e testes, o resultado de
`spec check`, as dúvidas abertas e a skill sugerida para a primeira tarefa.

## Compatibilidade

Starter kit 0.8.x. Caminhos citados: `CLISPEC.md`, `specs/`, `docs/spec.md`,
`src/spec/schema.ts`, `src/spec/files.ts`, `src/cli/commands/spec.ts` e
`tests/spec-files.test.ts`. Confira o contrato com `bun run spec:check`.
