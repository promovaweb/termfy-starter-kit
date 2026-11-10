# Estágios do ciclo

| Estágio | Skill | Entra | Sai | Checkpoint |
| --- | --- | --- | --- | --- |
| 0. Diagnóstico | `termfy-build` | repositório | estágio atual | não |
| 1. Identidade | `termfy-init`, `termfy-brand` | nome, título, descrição, autor, links, cores | `package.json`, manifest, tema | não (a identidade foi confirmada antes) |
| 2. Spec | `termfy-spec` | frase da pessoa, respostas | `CLISPEC.md` com checklist | **sim**: aprovar commands, screens, tools |
| 3. Dados | `termfy-config` | keys e credenciais da spec | `SETTINGS_SCHEMA`, nomes de credenciais | não |
| 4. Serviço externo | `termfy-api` | base URL, auth, endpoints | client da API em `src/` | não |
| 5. Commands | `termfy-cli` ou `termfy-command-set` | entradas da spec | commands, testes, OpenCLI | não |
| 6. MCP | `termfy-mcp` | commands prontos | tools, resources, prompts | não |
| 7. TUI | `termfy-tui` | dados dos commands | screens | não |
| 8. Testes | `termfy-test` | tudo acima | cobertura dos três modos | não |
| 9. Revisão | `termfy-review` | rodada inteira | lista de correções | não |
| 10. Docs | `termfy-docs` | código final | `docs/` e `opencli.json` | **sim**: aprovar `--help`, TUI, `mcp --list` |
| 11. Release | `termfy-release` | versão e changelog | tag e GitHub Release | não |
| 12. Agentes | `termfy-mcp-client` | binário publicado | configuração nos clientes | não |

## Como decidir o estágio no diagnóstico

- `spec show` falha ou a spec descreve o esqueleto: estágio 1 ou 2.
- Spec do produto com checklist toda `[ ]`: estágio 3.
- Checklist parcial: continue pelo primeiro item `[ ]`, na ordem
  config → cli → mcp → tui.
- Checklist toda `[x]` e `status: done`: estágio 9 em diante.

## O que relatar em cada marco

Três linhas: o que ficou pronto (com o `{#id}` marcado), o que vem a seguir,
e um comando para a pessoa experimentar agora (`bun run dev -- <command>`).

## Quando parar e perguntar

- Dois erros seguidos no mesmo passo.
- A spec pede algo fora do que o starter kit oferece e nenhuma skill cobre.
- Uma credencial é necessária e ainda não foi gravada.
- A pessoa pede algo que contradiz a spec aprovada: volte à `termfy-spec`
  para revisar a entrada, não improvise.
