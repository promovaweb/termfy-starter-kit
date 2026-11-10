/**
 * Resources: leitura passiva da identidade, dos códigos de saída e da
 * documentação. URIs usam o esquema `<bin>://` para não colidir com outros
 * servidores no mesmo cliente.
 */
import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { manifesto } from "../../app/manifesto.ts";
import { descricoesSaida } from "../../app/saida.ts";
import { dadosAbout } from "../../cli/comandos/about.ts";
import { raiz } from "../../cli/comandos.ts";
import { TOPICOS_SKILL, textoDaSkill } from "../../skill/index.ts";
import type { Registrador } from "../servidor.ts";

export function registrarResources({ servidor, catalogo }: Registrador): void {
  const esquema = manifesto.bin;

  catalogo.resources.push({ uri: `${esquema}://about`, nome: "about", descricao: "Identidade e runtime do binário em JSON." });
  servidor.registerResource(
    "about",
    `${esquema}://about`,
    { title: "Sobre o binário", description: "Identidade e runtime em JSON.", mimeType: "application/json" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify(dadosAbout(), null, 2) }] }),
  );

  catalogo.resources.push({ uri: `${esquema}://exit-codes`, nome: "exit-codes", descricao: "Tabela de códigos de saída em JSON." });
  servidor.registerResource(
    "exit-codes",
    `${esquema}://exit-codes`,
    { title: "Códigos de saída", description: "Tabela de códigos de saída em JSON.", mimeType: "application/json" },
    async (uri) => ({
      contents: [{ uri: uri.href, mimeType: "application/json", text: JSON.stringify({ codigos: descricoesSaida }, null, 2) }],
    }),
  );

  catalogo.resources.push({ uri: `${esquema}://skill`, nome: "skill", descricao: "Documentação completa em Markdown." });
  servidor.registerResource(
    "skill",
    `${esquema}://skill`,
    { title: "Documentação completa", description: "Toda a documentação embutida em Markdown.", mimeType: "text/markdown" },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: "text/markdown", text: textoDaSkill(raiz) }] }),
  );

  catalogo.resources.push({
    uri: `${esquema}://skill/{topico}`,
    nome: "skill-topico",
    descricao: `Seção da documentação. Tópicos: ${TOPICOS_SKILL.join(", ")}.`,
  });
  servidor.registerResource(
    "skill-topico",
    new ResourceTemplate(`${esquema}://skill/{topico}`, {
      list: async () => ({
        resources: TOPICOS_SKILL.map((t) => ({
          uri: `${esquema}://skill/${t}`,
          name: `skill-${t}`,
          title: `Documentação: ${t}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    { title: "Seção da documentação", description: "Uma seção da documentação embutida.", mimeType: "text/markdown" },
    async (uri, { topico }) => ({
      contents: [{ uri: uri.href, mimeType: "text/markdown", text: textoDaSkill(raiz, String(topico)) }],
    }),
  );
}
