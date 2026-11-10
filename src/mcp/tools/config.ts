/**
 * Tools de configuração: leitura de settings.json e estado do cofre.
 * Nenhuma delas grava nem revela segredos. Escrita de configuração continua
 * passando pelo CLI, onde há confirmação humana.
 */
import { z } from "zod";
import { statusCofre } from "../../config/credenciais.ts";
import { ESQUEMA_SETTINGS, achatar, lerSettings, obterCaminho } from "../../config/settings.ts";
import { caminhos } from "../../config/caminhos.ts";
import type { Registrador } from "../servidor.ts";

export function registrarToolsConfig({ servidor, catalogo }: Registrador): void {
  catalogo.tools.push({ nome: "config_list", descricao: "Todas as chaves de settings.json com valores em vigor." });
  servidor.registerTool(
    "config_list",
    {
      title: "Listar configuração",
      description: "Lista as chaves de settings.json (mescladas com os padrões) e o esquema conhecido.",
      inputSchema: {},
    },
    async () => {
      const d = {
        arquivo: caminhos.settings(),
        valores: Object.fromEntries(achatar(lerSettings())),
        esquema: ESQUEMA_SETTINGS.map((x) => ({ ...x })),
      };
      return { content: [{ type: "text", text: JSON.stringify(d, null, 2) }], structuredContent: d };
    },
  );

  catalogo.tools.push({ nome: "config_get", descricao: "Valor de uma chave de settings.json." });
  servidor.registerTool(
    "config_get",
    {
      title: "Ler chave de configuração",
      description: "Devolve o valor de uma chave em notação de ponto, por exemplo saida.formato.",
      inputSchema: { chave: z.string().min(1).describe("Chave em notação de ponto.") },
    },
    async ({ chave }) => {
      const valor = obterCaminho(lerSettings(), chave);
      const d = { chave, valor: valor ?? null, existe: valor !== undefined };
      return {
        content: [{ type: "text", text: JSON.stringify(d, null, 2) }],
        structuredContent: d,
        isError: valor === undefined,
      };
    },
  );

  catalogo.tools.push({ nome: "credentials_status", descricao: "Nomes gravados e origem da chave mestra, sem valores." });
  servidor.registerTool(
    "credentials_status",
    {
      title: "Estado do cofre de credenciais",
      description: "Informa arquivo, origem da chave mestra, quantidade e nomes das credenciais. Nunca devolve valores.",
      inputSchema: {},
    },
    async () => {
      const d = statusCofre();
      return { content: [{ type: "text", text: JSON.stringify(d, null, 2) }], structuredContent: d };
    },
  );
}
