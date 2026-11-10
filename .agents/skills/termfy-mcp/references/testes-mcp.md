# Testes do servidor MCP

## Automatizado

`tests/mcp.test.ts` sobe o binário como subprocesso e conversa por stdio com
o `Client` do SDK:

```ts
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const cliente = new Client({ name: "teste", version: "0.0.0" });
await cliente.connect(new StdioClientTransport({
  command: "bun",
  args: ["run", "src/main.ts", "mcp"],
  env: { ...process.env, TERMFY_HOME: pastaTemporaria },
  stderr: "ignore",
}));

const { tools } = await cliente.listTools();
const r = await cliente.callTool({ name: "about", arguments: {} });
const recurso = await cliente.readResource({ uri: "termfy://exit-codes" });
const prompt = await cliente.getPrompt({ name: "operar", arguments: { tarefa: "x" } });
await cliente.close();
```

Para cada tool nova: um teste de sucesso, um de entrada inválida (o SDK
devolve erro de validação) e um de falha prevista (`isError`).

## Manual

```bash
npx @modelcontextprotocol/inspector bun run src/main.ts mcp
```

O Inspector abre no navegador; use a aba Tools para chamar com argumentos e
ver a resposta, Resources para ler URIs e Prompts para gerar mensagens. A
documentação do modo linha de comando está em `mcp-spec/inspector-cli.md`.

## Em um cliente real

Claude Code:

```bash
claude mcp add termfy-dev -- bun run /caminho/para/src/main.ts mcp
```

Depois peça ao agente para chamar `skill` com `topico: "mcp"`.
