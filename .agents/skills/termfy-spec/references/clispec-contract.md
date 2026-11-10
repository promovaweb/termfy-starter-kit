# Contrato do CLISPEC.md

Resumo conferido com `src/spec/schema.ts`, `src/spec/parse.ts` e
`src/spec/check.ts` do starter kit 0.5.0.

`CLISPEC.md`, na raiz do projeto, descreve o que o binário faz. Ele é
editável por uma pessoa no editor e, ao mesmo tempo, lido de forma
confiável por `<bin> spec show`, `<bin> spec check` e pela tool MCP
`spec`. A skill `termfy-spec` escreve o arquivo em entrevista com a pessoa;
as skills `termfy-cli`, `termfy-tui`, `termfy-mcp` e `termfy-config` o leem
antes de implementar e marcam a checklist conforme avançam.

O arquivo entra no binário em tempo de build, como `docs/`. Assim um agente
que recebe só o executável lê a spec por `<bin> spec show --json` ou pela
tool MCP `spec`.

## Estrutura

`CLISPEC.md` abre com front matter YAML delimitado por `---` e segue com
cinco seções fixas, nesta ordem: `## Purpose`, `## Audiences`,
`## Out of scope`, `## Checklist` e `## Notes`. Os títulos são exatos; texto
fora das seções fixas permanece no arquivo, mas não entra em `sections`. A prosa pode estar em
qualquer idioma; os nomes (commands, options, keys, tools, screens) são os
nomes do código, em inglês.

## Front matter

O schema fechado fica em `src/spec/schema.ts` (Zod). Campo desconhecido,
enum inválido ou tipo errado recusam a leitura.

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `schemaVersion` | `"1.0.0"` | sim | versão do contrato |
| `bin` | string | sim | igual a `termfy.bin` do `package.json` |
| `title` | string | sim | título legível |
| `description` | string | sim | uma frase em inglês, igual a `description` do `package.json` |
| `status` | enum | sim | `draft`, `in_progress`, `blocked`, `done`, `archived` |
| `createdAt` | date-time | sim | criação, não editada depois |
| `updatedAt` | date-time | sim | atualizada a cada edição |
| `blockedReason` | string | só com `status: blocked` | motivo |
| `archivedReason` | string | só com `status: archived` | motivo |
| `commands` | array de Command | sim | pode ser vazio |
| `screens` | array de Screen | sim | pode ser vazio |
| `mcp` | objeto `{ tools, resources, prompts }` | sim | arrays, podem ser vazios |
| `settings` | array de Setting | sim | pode ser vazio |
| `credentials` | array de Credential | sim | pode ser vazio |

### Command

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `path` | string | sim | caminho completo, por exemplo `orders list` |
| `description` | string | sim | uma frase |
| `arguments` | array de `{ name, required?, variadic?, values? }` | não | posicionais |
| `options` | array de `{ name, argument?, values?, default?, description? }` | não | `name` com `--` |
| `data` | string | não | forma do `data` no `--json`, por exemplo `{ count, orders[] }` |
| `exitCodes` | array de inteiros | não | além de 0, 1 e 2 |
| `credentials` | array de string | não | nomes do cofre que o command lê |
| `interactive` | boolean | não | exige TTY |
| `example` | string | não | linha de uso |

### Screen

`{ id, title, description?, keys?: [{ key, action }] }`.

### MCP

- `tools`: `{ name, description?, input?, output?, effect }`, com `effect` em
  `read`, `write` ou `network`.
- `resources`: `{ uri, description? }`.
- `prompts`: `{ name, args?: string[] }`.

### Setting

`{ key, type, default, values?, description? }`, com `type` em `string`,
`number`, `boolean` ou `enum`.

### Credential

`{ name, usedBy: string[], howToObtain? }`. `name` segue
`[a-z0-9][a-z0-9_.-]{0,63}`; `usedBy` lista paths de commands ou nomes de
tools.

## Corpo

### `## Purpose`

Prosa: o problema, quem sofre com ele e o que muda com o binário.

### `## Audiences`

Tabela ou lista: público, modo (TUI, CLI texto, CLI `--json`, MCP) e o que
precisa fazer.

### `## Out of scope`

Lista do que fica para depois.

### `## Checklist`

Itens GFM, um por linha, com `{#id}` obrigatório de quatro caracteres
`[a-z0-9]`, fixo depois de criado, e uma tag opcional de skill:

```markdown
- [ ] Implement `orders list` `#termfy-cli` {#a1b2}
- [x] Add the `orders` screen `#termfy-tui` {#c3d4}
```

Item sem `{#id}` ou com `{#id}` repetido recusa a leitura. Progresso é
`progress: { done, total, percent }`; `percent` vale 0 quando não há itens.

### `## Notes`

Registro cronológico, uma linha datada por escolha relevante, dúvida aberta
ou desvio do combinado. A seção existe mesmo vazia.

## Ciclo de `status`

| Estado | Significado |
| --- | --- |
| `draft` | spec registrada; checklist pode estar vazia |
| `in_progress` | implementação começou |
| `blocked` | parada por dependência externa; exige `blockedReason` |
| `done` | checklist inteira `[x]` |
| `archived` | encerrada sem conclusão; exige `archivedReason` |

A leitura relata o estado declarado; não o infere.

## Commands do binário

| Command | Função |
| --- | --- |
| `<bin> spec show [--json]` | front matter, seções e progresso |
| `<bin> spec check [--json] [--strict]` | valida o contrato e cruza com o código |
| `<bin> spec progress [--json]` | só a contagem da checklist |

`spec check` falha (exit code 3) quando:

- o front matter não passa no schema ou a checklist tem `{#id}` ausente ou
  repetido;
- `bin` ou `description` divergem do `package.json`;
- um command da spec não existe no registry, ou cita option, argument ou
  exit code que o registry não tem;
- uma screen da spec não existe em `src/tui/screens/index.ts`;
- uma tool, resource ou prompt da spec não existe no catalog MCP;
- uma setting da spec não existe em `SETTINGS_SCHEMA` ou tem `type` diferente;
- `usedBy` de uma credencial cita command ou tool inexistente;
- `status: done` com item pendente.

Avisos (não falham, salvo `--strict`): command, screen, tool ou setting do
código ausente da spec. Resources e prompts omitidos não geram avisos.
O cruzamento confere nomes, arguments das options, exit codes e tipos das
settings; não compara toda descrição, forma de `data`, defaults ou listas
de valores. Confira esses contratos também nos testes.

`bun run spec:check` roda o mesmo cruzamento a partir do código-fonte e, além
disso, confere que todo `getCredential("<name>")` em `src/` aparece em
`credentials` da spec. Ele entra em `bun run validate`.

## Tool MCP

`spec` devolve `{ frontmatter, sections, progress }`. A tool não expõe
a lista parseada `checklist` como campo separado e não executa o
cruzamento de `spec check`. Um agente
lê a spec antes de operar o binário ou de propor mudanças.

## Exemplo de planejamento

O exemplo abaixo passa pela estrutura do contrato, mas só passa em
`spec check` depois que a identidade coincidir com `package.json` e os
commands, screens, tools e settings declarados forem implementados.
Referências futuras geram erros, inclusive com `status: draft`.

```markdown
---
schemaVersion: "1.0.0"
bin: mycli
title: My CLI
description: Query and update shop orders.
status: in_progress
createdAt: "2026-11-10T12:00:00.000Z"
updatedAt: "2026-11-10T15:00:00.000Z"
commands:
  - path: orders list
    description: List shop orders.
    options:
      - name: --status
        argument: status
        values: [open, closed]
      - name: --limit
        argument: n
        default: "10"
    data: "{ count, orders[] }"
    exitCodes: [4, 5]
    credentials: [shop.token]
    example: mycli orders list --status open --json
screens:
  - id: orders
    title: Orders
    keys:
      - key: r
        action: reload
mcp:
  tools:
    - name: orders_list
      effect: network
      input: "{ status?, limit? }"
      output: "{ count, orders[] }"
  resources: []
  prompts: []
settings:
  - key: shop.baseUrl
    type: string
    default: https://api.example.com
credentials:
  - name: shop.token
    usedBy: [orders list, orders_list]
    howToObtain: Shop dashboard, API section.
---

## Purpose

Quem opera a loja precisa consultar pedidos sem abrir o painel web.

## Audiences

| Audience | Mode | Needs |
| --- | --- | --- |
| operador | TUI e CLI texto | ver pedidos abertos |
| CI | CLI `--json` | exportar pedidos do dia |
| agente | MCP | responder perguntas sobre pedidos |

## Out of scope

- Criar ou cancelar pedidos.

## Checklist

- [ ] Implement `orders list` `#termfy-cli` {#a1b2}
- [ ] Add the `orders` screen `#termfy-tui` {#c3d4}
- [ ] Expose `orders_list` `#termfy-mcp` {#e5f6}

## Notes

- 2026-11-10: spec criada em entrevista; `--limit` máximo fica para depois.
```
