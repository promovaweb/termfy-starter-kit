/**
 * Comando `mcp`: inicia o servidor Model Context Protocol via stdio.
 *
 * O processo passa a falar JSON-RPC pelo stdin/stdout, então nada mais pode
 * ser escrito em stdout. Mensagens de diagnóstico vão para stderr. O comando
 * só termina quando o cliente fecha o transporte.
 */
import { manifesto } from "../../app/manifesto.ts";
import { CodigoSaida } from "../../app/saida.ts";
import type { Comando } from "../registro.ts";

export const comandoMcp: Comando = {
  nome: "mcp",
  descricao: "Inicia o servidor MCP (stdio) com tools, resources e prompts para agentes.",
  descricaoLonga:
    `Configure no cliente MCP: { "command": "${manifesto.bin}", "args": ["mcp"] }.\n` +
    `Tools: about, exit_codes, skill, config_list, config_get, credentials_status.\n` +
    `Resources: ${manifesto.bin}://about, ${manifesto.bin}://exit-codes, ${manifesto.bin}://skill/{topico}.\n` +
    `Nenhuma tool devolve o valor de uma credencial.`,
  opcoes: [
    {
      nome: "--list",
      descricao: "Em vez de iniciar o servidor, lista tools, resources e prompts registrados e encerra.",
    },
  ],
  codigosSaida: [CodigoSaida.MCP],
  exemplos: [`${manifesto.bin} mcp`, `${manifesto.bin} mcp --list --json`],
  executar: async (ctx) => {
    const { descreverServidor, iniciarServidorStdio } = await import("../../mcp/servidor.ts");
    if (ctx.opcoes.list === true) {
      const d = descreverServidor();
      return {
        dados: d,
        texto: () =>
          [
            `Servidor MCP ${d.nome} v${d.versao}`,
            "",
            "Tools:",
            ...d.tools.map((t) => `  ${t.nome}  ${t.descricao}`),
            "",
            "Resources:",
            ...d.resources.map((r) => `  ${r.uri}  ${r.descricao}`),
            "",
            "Prompts:",
            ...d.prompts.map((p) => `  ${p.nome}  ${p.descricao}`),
          ].join("\n"),
      };
    }
    await iniciarServidorStdio();
    return { dados: { encerrado: true }, texto: "" };
  },
};
