---
name: termfy-mcp
description: Cria e altera tools, resources e prompts do servidor MCP stdio embutido no Termfy, com schemas Zod descritos, catálogo para mcp --list e testes com o Client do SDK e o Inspector.
---

# Construir e evoluir o servidor MCP

Use esta skill para expor funcionalidades do binário a agentes de IA pelo
Model Context Protocol, ou para revisar o que já está exposto.

## Leia antes

- `CLISPEC.md` na raiz do projeto e `bun run dev -- spec show --json`: a
  entrada do front matter e o item da checklist que descrevem o que será
  implementado. Se o arquivo não cobrir o pedido, rode a skill `termfy-spec`
  antes de continuar.
- `docs/mcp.md`.
- `src/mcp/server.ts`, `src/mcp/tools/base.ts`, `src/mcp/resources/base.ts`
  e `src/mcp/prompts.ts`.
- `references/tool-contract.md`: regras de nome, schema, descrição e
  resposta.
- `references/mcp-sdk/server.md`: API do `McpServer` (v1.x do SDK).
- `references/mcp-spec/server-concepts.md` e `references/mcp-spec/transports.md`
  para o modelo de tools, resources, prompts e stdio.
- `references/mcp-spec/local-server-security.md` antes de expor qualquer
  tool que grave, chame rede ou leia segredos.
- `references/openmcp.md` para o princípio de economia de tokens.

## Regras

1. Stdout pertence ao JSON-RPC enquanto `mcp` roda. Qualquer log vai para
   stderr. Nunca use `console.log` em código alcançado pelo servidor.
2. Toda tool tem `title`, `description` que diz quando usar e o que devolve,
   `inputSchema` em Zod com `.describe()` em cada campo e nome em
   `snake_case`.
3. Resposta traz `content` em texto e, quando a saída for estruturada,
   `structuredContent` com o mesmo objeto. Falha prevista devolve
   `isError: true` com mensagem clara, sem lançar exceção.
4. Nenhuma tool devolve o valor de uma credencial. `credentials_status`
   mostra `file`, `exists`, `masterKeySource`, `count` e `names`, sem
   valores. Tools que consomem APIs leem o valor com
   `getCredential(name)` internamente e devolvem o resultado da chamada.
5. Tools que gravam ou têm efeito externo dizem isso na descrição e, quando
   couber, aceitam `dryRun`.
6. Toda tool entra em `catalog.tools` para que `mcp --list` a enxergue.
7. Resources usam o esquema `<bin>://`. Templates declaram `list` para que
   clientes descubram os valores possíveis.
8. Respostas curtas: devolva o que o agente precisa, não o dump completo.
   Paginação por `limit` e `cursor` quando a lista puder crescer.

## Passos

1. Rode `git status --short`.
2. Copie `template/tool/example.ts` para `src/mcp/tools/<grupo>.ts` e ajuste
   os imports.
3. Implemente a tool reutilizando funções de `src/config/` e coletores do
   CLI. Não duplique lógica de comando dentro da tool.
4. Registre a função em `registerAll` (`src/mcp/server.ts`).
5. Teste com o `Client` do SDK em `tests/mcp.test.ts` (ver
   `references/mcp-tests.md`) e, manualmente, com
   `npx @modelcontextprotocol/inspector bun run src/main.ts mcp`.
6. Rode `bun run validate`.
7. Atualize a tabela de tools em `docs/mcp.md` e a `longDescription` do
   comando `mcp` em `src/cli/commands/mcp.ts`.


## Checklist da spec

Ao concluir e testar cada entrega, a skill de implementação marca o item
correspondente em `## Checklist` do `CLISPEC.md` de `- [ ]` para `- [x]`
pelo `{#id}`, preservando o id. Avance `updatedAt` e use `in_progress`
enquanto houver trabalho. Só use `done` após concluir todos os itens.
Se o escopo mudar, revise a entrada da spec e o texto do item com
`termfy-spec`; registre a alteração em `## Notes`.
Rode `bun run dev -- spec check --json`: referências declaradas ainda não
implementadas são erros, mesmo em `draft`. Relate separadamente as
pendências de outras entregas. Ao concluir o escopo inteiro, rode
`bun run validate` e exija saída 0.

## Marcos

Tool listada em `mcp --list`; chamada bem-sucedida pelo Client de teste;
documentação atualizada.

## Saída

Liste tools, resources e prompts adicionados ou alterados, com entrada e
saída, e informe os testes executados.

## Compatibilidade

Starter kit 0.5.x. Caminhos citados: `src/mcp/server.ts`, `src/mcp/tools/`,
`src/mcp/resources/`, `src/mcp/prompts.ts`, `template/tool/example.ts`,
`tests/mcp.test.ts`, `docs/mcp.md` e `src/cli/commands/mcp.ts`.
