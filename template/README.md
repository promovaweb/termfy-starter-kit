# Stubs

Modelos para estender o binário. Cada arquivo compila dentro do repositório
(os imports apontam para `src/`), então eles servem de teste de contrato:
quando a API interna muda, o `bun run typecheck` denuncia o stub quebrado.

| Stub | Copiar para | Registrar em |
| --- | --- | --- |
| `comando/exemplo.ts` | `src/cli/comandos/<nome>.ts` | `src/cli/comandos.ts` |
| `tela/exemplo.ts` | `src/tui/telas/<id>.ts` | `src/tui/telas/index.ts` |
| `tool/exemplo.ts` | `src/mcp/tools/<nome>.ts` | `registrarTudo` em `src/mcp/servidor.ts` |

Depois de copiar, troque os imports `../../src/` por caminhos relativos ao
novo local (`../../app/`, `../componentes.ts`, `../servidor.ts`).
