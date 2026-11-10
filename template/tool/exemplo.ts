/**
 * Stub de tool MCP. Copie para src/mcp/tools/<nome>.ts, ajuste os imports e
 * chame a função em registrarTudo (src/mcp/servidor.ts).
 *
 * Regras: inputSchema em Zod com .describe() em cada campo; descrição que
 * diga quando usar e o que devolve; `structuredContent` igual ao JSON do
 * texto; nunca ecoar segredos; marcar isError em falhas previstas.
 */
import { z } from "zod";
import type { Registrador } from "../../src/mcp/servidor.ts";

export function registrarToolsExemplo({ servidor, catalogo }: Registrador): void {
  catalogo.tools.push({ nome: "exemplo_consultar", descricao: "Consulta um alvo e devolve o resultado." });
  servidor.registerTool(
    "exemplo_consultar",
    {
      title: "Consultar exemplo",
      description: "Use quando o usuário pedir informações sobre um alvo. Devolve nome, estado e itens encontrados.",
      inputSchema: {
        alvo: z.string().min(1).describe("Identificador do alvo."),
        limite: z.number().int().positive().max(100).optional().describe("Máximo de itens. Padrão 10."),
      },
    },
    async ({ alvo, limite }) => {
      const itens = [alvo].slice(0, limite ?? 10);
      const d = { alvo, estado: "ok", itens };
      return { content: [{ type: "text", text: JSON.stringify(d, null, 2) }], structuredContent: d };
    },
  );
}
