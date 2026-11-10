# Testes do servidor MCP

## Automatizado

`tests/mcp.test.ts` sobe o binário como subprocesso e conversa por stdio com
o `Client` do SDK:

```ts
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const temporaryDir = mkdtempSync(join(tmpdir(), "termfy-mcp-"));
const client = new Client({ name: "test", version: "0.0.0" });
await client.connect(new StdioClientTransport({
  command: "bun",
  args: ["run", "src/main.ts", "mcp"],
  env: { ...process.env, TERMFY_HOME: temporaryDir },
  stderr: "ignore",
}));

const { tools } = await client.listTools();
const r = await client.callTool({ name: "about", arguments: {} });
const resource = await client.readResource({ uri: "termfy://exit-codes" });
const prompt = await client.getPrompt({ name: "operate", arguments: { task: "x" } });
await client.close();
rmSync(temporaryDir, { recursive: true, force: true });
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

Depois peça ao agente para chamar `skill` com `topic: "mcp"`.
