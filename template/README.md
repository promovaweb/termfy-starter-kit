# Stubs

Modelos para estender o binário. Cada arquivo compila dentro do repositório
(os imports apontam para `src/`), então eles servem de teste de contrato:
quando a API interna muda, o `bun run typecheck` denuncia o stub quebrado.

| Stub | Copiar para | Registrar em |
| --- | --- | --- |
| `command/example.ts` | `src/cli/commands/<name>.ts` | `src/cli/commands.ts` |
| `screen/example.ts` | `src/tui/screens/<id>.ts` | `src/tui/screens/index.ts` |
| `tool/example.ts` | `src/mcp/tools/<name>.ts` | `registerAll` em `src/mcp/server.ts` |

Depois de copiar, troque os imports `../../src/` por caminhos relativos ao
novo local (`../../app/`, `../components.ts`, `../server.ts`).
