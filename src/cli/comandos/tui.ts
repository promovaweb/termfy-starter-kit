/**
 * Comando `tui`: abre a interface de terminal de forma explícita.
 * Sem argumentos o binário já abre a TUI; este comando existe para scripts
 * e para permitir `--aba` sem depender da configuração.
 */
import { manifesto } from "../../app/manifesto.ts";
import { CodigoSaida } from "../../app/saida.ts";
import { erro } from "../../app/erros.ts";
import type { Comando } from "../registro.ts";

export const comandoTui: Comando = {
  nome: "tui",
  descricao: "Abre a interface de terminal (Overview e About). Exige TTY.",
  opcoes: [
    {
      nome: "--aba",
      argumento: { nome: "aba", valores: ["overview", "about"] },
      descricao: "Aba inicial. Sobrepõe tui.abaInicial de settings.json.",
    },
  ],
  codigosSaida: [CodigoSaida.TERMINAL_INDISPONIVEL],
  interativo: true,
  exemplos: [`${manifesto.bin}`, `${manifesto.bin} tui --aba about`],
  executar: async (ctx) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) {
      throw erro.terminal(`A TUI precisa de um terminal interativo. Use "${manifesto.bin} --help" para os comandos.`);
    }
    const { iniciarTui } = await import("../../tui/index.ts");
    const aba = typeof ctx.opcoes.aba === "string" ? ctx.opcoes.aba : undefined;
    await iniciarTui({ abaInicial: aba });
    return { dados: { encerrada: true }, texto: "" };
  },
};
