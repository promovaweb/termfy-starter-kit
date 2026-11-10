/**
 * Documentação embutida no binário (`--skill`).
 *
 * Os arquivos de `docs/` entram no executável como texto em tempo de build.
 * Isso permite que um agente de IA rode `<bin> --skill` e receba toda a
 * documentação sem acesso ao repositório: visão geral, CLI, TUI, MCP,
 * configuração e códigos de saída. A seção da CLI ganha, ao final, a
 * referência gerada a partir do registro de comandos, para nunca divergir
 * do que o parser aceita.
 */
import visaoGeral from "../../docs/README.md" with { type: "text" };
import docCli from "../../docs/cli.md" with { type: "text" };
import docTui from "../../docs/tui.md" with { type: "text" };
import docMcp from "../../docs/mcp.md" with { type: "text" };
import docConfig from "../../docs/configuracao.md" with { type: "text" };
import docCodigos from "../../docs/codigos-de-saida.md" with { type: "text" };
import { manifesto } from "../app/manifesto.ts";
import { descricoesSaida } from "../app/saida.ts";
import { OPCOES_GLOBAIS, type Comando, type DefinicaoOpcao } from "../cli/registro.ts";

/** Tópicos aceitos por `--skill <topico>` e pela tool/resource MCP `skill`. */
export const TOPICOS_SKILL = ["cli", "tui", "mcp", "config", "codigos"] as const;
export type TopicoSkill = (typeof TOPICOS_SKILL)[number];

function substituir(texto: string): string {
  return texto.replaceAll("{{bin}}", manifesto.bin).replaceAll("{{titulo}}", manifesto.titulo).replaceAll("{{versao}}", manifesto.versao);
}

function opcaoEmMarkdown(o: DefinicaoOpcao): string {
  const nomes = [...(o.aliases ?? []), o.nome].map((n) => `\`${n}\``).join(", ");
  const arg = o.argumento ? ` \`${o.argumento.opcional ? `[${o.argumento.nome}]` : `<${o.argumento.nome}>`}\`` : "";
  const valores = o.argumento?.valores ? ` Valores: ${o.argumento.valores.join(", ")}.` : "";
  return `- ${nomes}${arg}: ${o.descricao}${valores}`;
}

/** Referência de comandos em Markdown, gerada do registro. */
export function referenciaDeComandos(raiz: Comando): string {
  const linhas: string[] = ["## Referência gerada do registro de comandos", ""];
  linhas.push("### Opções globais", "");
  for (const o of OPCOES_GLOBAIS.filter((x) => !x.oculta)) linhas.push(opcaoEmMarkdown(o));
  linhas.push("");

  const visitar = (c: Comando, caminho: string[]) => {
    if (c.oculto) return;
    const nome = [manifesto.bin, ...caminho].join(" ");
    linhas.push(`### \`${nome}\``, "", c.descricao, "");
    if (c.descricaoLonga) linhas.push(c.descricaoLonga.replace(/\n/g, " "), "");
    if (c.argumentos?.length) {
      linhas.push("Argumentos:", "");
      for (const a of c.argumentos) {
        const marca = a.obrigatorio ? `<${a.nome}>` : `[${a.nome}]`;
        linhas.push(`- \`${marca}\`: ${a.descricao}${a.valores ? ` Valores: ${a.valores.join(", ")}.` : ""}`);
      }
      linhas.push("");
    }
    if (c.opcoes?.filter((o) => !o.oculta).length) {
      linhas.push("Opções:", "");
      for (const o of c.opcoes.filter((x) => !x.oculta)) linhas.push(opcaoEmMarkdown(o));
      linhas.push("");
    }
    if (c.codigosSaida?.length) {
      const nomes = descricoesSaida.filter((d) => c.codigosSaida?.includes(d.codigo)).map((d) => `${d.codigo} (${d.nome})`);
      linhas.push(`Códigos de saída além de 0, 1 e 2: ${nomes.join(", ")}.`, "");
    }
    if (c.interativo) linhas.push("Exige terminal interativo ou `--stdin`/`--yes` conforme o caso.", "");
    if (c.exemplos?.length) {
      linhas.push("Exemplos:", "", "```bash");
      for (const e of c.exemplos) linhas.push(e);
      linhas.push("```", "");
    }
    for (const s of c.subcomandos ?? []) visitar(s, [...caminho, s.nome]);
  };
  for (const s of raiz.subcomandos ?? []) visitar(s, [s.nome]);
  return linhas.join("\n");
}

/** Devolve a seção pedida ou a documentação inteira. */
export function textoDaSkill(raiz: Comando, topico?: string): string {
  const secoes: Record<TopicoSkill, () => string> = {
    cli: () => `${substituir(docCli)}\n\n${referenciaDeComandos(raiz)}`,
    tui: () => substituir(docTui),
    mcp: () => substituir(docMcp),
    config: () => substituir(docConfig),
    codigos: () => substituir(docCodigos),
  };
  if (topico) {
    const fn = secoes[topico as TopicoSkill];
    if (!fn) throw new Error(`Tópico desconhecido: ${topico}. Aceitos: ${TOPICOS_SKILL.join(", ")}.`);
    return fn().trimEnd();
  }
  const cabecalho =
    `<!-- Documentação embutida de ${manifesto.bin} v${manifesto.versao}. Gerada por "${manifesto.bin} --skill". -->\n\n` +
    substituir(visaoGeral);
  return [cabecalho, ...TOPICOS_SKILL.map((t) => secoes[t]())].join("\n\n---\n\n").trimEnd();
}
