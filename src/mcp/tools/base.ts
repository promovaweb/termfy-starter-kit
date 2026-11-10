/**
 * Tools básicas: identidade do binário, códigos de saída e documentação.
 * São as tools que todo projeto derivado mantém, porque permitem a um agente
 * descobrir o que o binário faz sem sair do protocolo.
 */
import { z } from "zod";
import { dadosAbout } from "../../cli/comandos/about.ts";
import { raiz } from "../../cli/comandos.ts";
import { descricoesSaida } from "../../app/saida.ts";
import { TOPICOS_SKILL, textoDaSkill } from "../../skill/index.ts";
import type { Registrador } from "../servidor.ts";

export function registrarToolsBase({ servidor, catalogo }: Registrador): void {
  catalogo.tools.push({ nome: "about", descricao: "Versão, executável, runtime, plataforma e créditos do binário." });
  servidor.registerTool(
    "about",
    {
      title: "Sobre o binário",
      description: "Devolve versão, caminho do executável, runtime, plataforma, pasta de dados e créditos.",
      inputSchema: {},
    },
    async () => {
      const d = dadosAbout();
      return { content: [{ type: "text", text: JSON.stringify(d, null, 2) }], structuredContent: d };
    },
  );

  catalogo.tools.push({ nome: "exit_codes", descricao: "Tabela de códigos de saída do processo." });
  servidor.registerTool(
    "exit_codes",
    {
      title: "Códigos de saída",
      description: "Lista os códigos de saída do CLI com nome simbólico e descrição. 0 é sucesso.",
      inputSchema: {},
    },
    async () => {
      const d = { codigos: descricoesSaida.map((x) => ({ ...x })) };
      return { content: [{ type: "text", text: JSON.stringify(d, null, 2) }], structuredContent: d };
    },
  );

  catalogo.tools.push({ nome: "skill", descricao: "Documentação embutida, inteira ou por tópico." });
  servidor.registerTool(
    "skill",
    {
      title: "Documentação embutida",
      description:
        "Devolve a documentação do binário em Markdown. Sem tópico, devolve tudo. " +
        `Tópicos: ${TOPICOS_SKILL.join(", ")}. Leia "cli" antes de sugerir comandos ao usuário.`,
      inputSchema: { topico: z.enum(TOPICOS_SKILL).optional().describe("Seção desejada. Omita para tudo.") },
    },
    async ({ topico }) => ({ content: [{ type: "text", text: textoDaSkill(raiz, topico) }] }),
  );
}
