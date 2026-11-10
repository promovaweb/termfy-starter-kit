/**
 * Raiz do registro de comandos.
 *
 * Importa cada comando de `comandos/` e monta a árvore. Para incluir um novo
 * comando, importe-o e adicione à lista `subcomandos`. A ordem define a
 * ordem de exibição no `--help` e na descrição OpenCLI.
 */
import { manifesto } from "../app/manifesto.ts";
import { comandoAbout } from "./comandos/about.ts";
import { comandoConfig } from "./comandos/config.ts";
import { comandoCredentials } from "./comandos/credentials.ts";
import { comandoMcp } from "./comandos/mcp.ts";
import { criarComandoSkill } from "./comandos/skill.ts";
import { comandoTui } from "./comandos/tui.ts";
import type { Comando } from "./registro.ts";

export const raiz: Comando = {
  nome: manifesto.bin,
  descricao: manifesto.descricao,
  subcomandos: [comandoTui, comandoAbout, comandoConfig, comandoCredentials, comandoMcp, criarComandoSkill(() => raiz)],
  exemplos: [
    `${manifesto.bin}`,
    `${manifesto.bin} about --json`,
    `${manifesto.bin} config set saida.formato json`,
    `${manifesto.bin} credentials set openai.api_key`,
    `${manifesto.bin} mcp`,
    `${manifesto.bin} --skill`,
  ],
};
