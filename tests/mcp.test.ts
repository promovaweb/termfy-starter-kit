/** Conversa real com o servidor MCP via stdio usando o Client do SDK. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { VARIAVEL_HOME } from "../src/config/caminhos.ts";
import { manifesto } from "../src/app/manifesto.ts";

let pasta: string;
let cliente: Client;

beforeAll(async () => {
  pasta = mkdtempSync(join(tmpdir(), "termfy-mcp-"));
  cliente = new Client({ name: "teste", version: "0.0.0" });
  const transporte = new StdioClientTransport({
    command: "bun",
    args: ["run", "src/main.ts", "mcp"],
    cwd: join(import.meta.dir, ".."),
    env: { ...(process.env as Record<string, string>), [VARIAVEL_HOME]: pasta },
    stderr: "ignore",
  });
  await cliente.connect(transporte);
});

afterAll(async () => {
  await cliente.close();
  rmSync(pasta, { recursive: true, force: true });
});

describe("mcp stdio", () => {
  test("lista tools", async () => {
    const { tools } = await cliente.listTools();
    expect(tools.map((t) => t.name)).toEqual(expect.arrayContaining(["about", "skill", "credentials_status"]));
  });

  test("chama about", async () => {
    const r = await cliente.callTool({ name: "about", arguments: {} });
    const sc = r.structuredContent as { versao: string; bin: string };
    expect(sc.versao).toBe(manifesto.versao);
    expect(sc.bin).toBe(manifesto.bin);
  });

  test("skill por tópico", async () => {
    const r = await cliente.callTool({ name: "skill", arguments: { topico: "mcp" } });
    const texto = (r.content as Array<{ type: string; text: string }>)[0]?.text ?? "";
    expect(texto).toContain("# MCP");
  });

  test("lê resource de códigos de saída", async () => {
    const r = await cliente.readResource({ uri: `${manifesto.bin}://exit-codes` });
    const json = JSON.parse((r.contents[0] as { text: string }).text);
    expect(json.codigos[0].codigo).toBe(0);
  });

  test("credentials_status não expõe valores", async () => {
    const r = await cliente.callTool({ name: "credentials_status", arguments: {} });
    const sc = r.structuredContent as Record<string, unknown>;
    expect(Object.keys(sc)).not.toContain("valores");
    expect(sc.quantidade).toBe(0);
  });

  test("prompt operar", async () => {
    const r = await cliente.getPrompt({ name: "operar", arguments: { tarefa: "listar config" } });
    expect((r.messages[0]?.content as { text: string }).text).toContain("listar config");
  });
});
