/**
 * Servidor MCP embutido.
 *
 * Monta um `McpServer` com as tools, resources e prompts de `tools/` e
 * `resources/`, e o conecta ao transporte stdio. A mesma função de montagem
 * alimenta `mcp --list`, que descreve o que está registrado sem abrir o
 * transporte. Para adicionar uma tool, crie `tools/<nome>.ts` seguindo o
 * stub em `template/tool/` e registre em `registrarTudo`.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { manifesto } from "../app/manifesto.ts";
import { erro } from "../app/erros.ts";
import { registrarToolsBase } from "./tools/base.ts";
import { registrarToolsConfig } from "./tools/config.ts";
import { registrarResources } from "./resources/base.ts";
import { registrarPrompts } from "./prompts.ts";

/** Metadados coletados durante o registro, para `mcp --list`. */
export interface Catalogo {
  nome: string;
  versao: string;
  tools: Array<{ nome: string; descricao: string }>;
  resources: Array<{ uri: string; nome: string; descricao: string }>;
  prompts: Array<{ nome: string; descricao: string }>;
}

/** Registrador que acumula metadados enquanto registra no servidor. */
export interface Registrador {
  servidor: McpServer;
  catalogo: Catalogo;
}

function criarServidor(): Registrador {
  const servidor = new McpServer(
    { name: manifesto.bin, version: manifesto.versao },
    {
      instructions:
        `${manifesto.titulo}: ${manifesto.descricao} ` +
        `Use a tool "skill" ou a resource ${manifesto.bin}://skill/cli para ler a documentação completa antes de chamar outras tools. ` +
        `Nenhuma tool devolve valores de credenciais.`,
    },
  );
  const catalogo: Catalogo = { nome: manifesto.bin, versao: manifesto.versao, tools: [], resources: [], prompts: [] };
  const registrador: Registrador = { servidor, catalogo };
  registrarTudo(registrador);
  return registrador;
}

function registrarTudo(r: Registrador): void {
  registrarToolsBase(r);
  registrarToolsConfig(r);
  registrarResources(r);
  registrarPrompts(r);
}

/** Descreve o servidor sem abrir transporte. */
export function descreverServidor(): Catalogo {
  return criarServidor().catalogo;
}

/** Inicia o servidor em stdio e aguarda o fechamento do transporte. */
export async function iniciarServidorStdio(): Promise<void> {
  const { servidor } = criarServidor();
  const transporte = new StdioServerTransport();
  try {
    await servidor.connect(transporte);
  } catch (e) {
    throw erro.mcp(`Falha ao iniciar o servidor MCP: ${e instanceof Error ? e.message : String(e)}`);
  }
  process.stderr.write(`${manifesto.bin} mcp: servidor stdio ativo (pid ${process.pid})\n`);
  await new Promise<void>((resolver) => {
    transporte.onclose = () => resolver();
    process.stdin.on("end", () => resolver());
  });
}
