# Estágios do ciclo

| Estágio | Skill | Entra | Sai | Checkpoint |
| --- | --- | --- | --- | --- |
| 0. Diagnóstico | `termfy` | repositório | estágio atual | não |
| 1. Identidade | `termfy-init`, `termfy-brand` | nome, título, descrição, autor, links, cores | `package.json`, manifest, tema | não (a identidade foi confirmada antes) |
| 2. Visão macro | `termfy-clispec` | frase da pessoa, respostas | `CLISPEC.md` com Purpose, Audiences, Out of scope e as specs iniciais criadas por `spec new` | não (segue direto para a primeira spec) |
| 3. Spec | `termfy-spec` ou `termfy-api-import` | spec da lista, respostas | `specs/NNNN-slug.md` com `changes`, Behavior, Design, Tasks e Tests | **sim**, na primeira spec: aprovar visão macro, lista de specs, commands, screens, tools |
| 4. Dados | `termfy-config` | keys e credenciais da spec | `SETTINGS_SCHEMA`, nomes de credenciais | não |
| 5. Serviço externo | `termfy-api` | base URL, auth, endpoints | client da API em `src/` | não |
| 6. Armazenamento | `termfy-database` | tabelas do Design, só quando a spec pede | migrations e repositórios em `src/` | não |
| 7. Commands | `termfy-cli` ou `termfy-command-set` | entradas de `changes` | commands, testes, OpenCLI | não |
| 8. MCP | `termfy-mcp` | commands prontos | tools, resources, prompts | não |
| 9. TUI | `termfy-tui` | dados dos commands | screens | não |
| 10. Testes | `termfy-test` | tudo acima | itens de Tests marcados | não |
| 11. Revisão | `termfy-review` | spec inteira | lista de correções | não |
| 12. Docs | `termfy-docs` | código final | `docs/` e `opencli.json` | não |
| 13. Fechamento | `spec close <id>` | spec com todos os itens `[x]` | `changes` incorporado ao `CLISPEC.md`, spec `done` | não |
| 14. Release | `termfy-release` | specs fechadas, versão e changelog | tag e GitHub Release | **sim**, antes: aprovar `--help`, TUI, `mcp --list` |
| 15. Agentes | `termfy-mcp-client` | binário publicado | configuração nos clientes | não |

Os estágios 3 a 13 se repetem a cada spec da lista.

## Como decidir o estágio no diagnóstico

- `spec show` falha ou o `CLISPEC.md` descreve o esqueleto: estágio 1 ou 2.
- `CLISPEC.md` em 1.0.0: a `termfy-clispec` migra com `spec migrate` antes
  de seguir.
- `spec list` mostra uma spec `draft` com Behavior ou Design vazios:
  estágio 3.
- Spec aberta com Tasks toda `[ ]`: estágio 4.
- Spec aberta com itens parciais: continue pela primeira tarefa `[ ]`, na
  ordem config → api → database → cli → mcp → tui
  (`bun run dev -- spec progress <id>`).
- Spec aberta com todos os itens `[x]`: estágio 11 em diante, até
  `spec close`.
- Todas as specs `done`: estágio 14, ou estágio 3 para uma evolução nova.

## O que relatar em cada marco

Três linhas: o que ficou pronto (com o `{#id}` marcado na spec), o que vem
a seguir, e um comando para a pessoa experimentar agora
(`bun run dev -- <command>`).

## Quando parar e perguntar

- Dois erros seguidos no mesmo passo.
- A spec pede algo fora do que o starter kit oferece e nenhuma skill cobre.
- Uma credencial é necessária e ainda não foi gravada.
- A pessoa pede algo que contradiz a spec aprovada: volte à `termfy-spec`
  para revisar a spec aberta, ou abra uma spec nova, sem improvisar.
- A pessoa muda o propósito, os públicos ou os limites: volte à
  `termfy-clispec`.
