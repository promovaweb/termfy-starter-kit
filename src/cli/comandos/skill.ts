/**
 * Comando `skill`: forma explícita do `--skill`.
 * Existe para que `<bin> skill mcp` e `<bin> --skill mcp` sejam equivalentes
 * e para que a documentação apareça na árvore OpenCLI como comando.
 */
import { manifesto } from "../../app/manifesto.ts";
import { TOPICOS_SKILL, textoDaSkill } from "../../skill/index.ts";
import type { Comando } from "../registro.ts";

/** Fábrica: recebe a raiz para gerar a referência de comandos. */
export function criarComandoSkill(obterRaiz: () => Comando): Comando {
  return {
    nome: "skill",
    descricao: "Imprime a documentação embutida, inteira ou por tópico. Mesmo efeito de --skill.",
    argumentos: [
      {
        nome: "topico",
        descricao: "Seção desejada. Sem argumento, imprime tudo.",
        valores: TOPICOS_SKILL,
      },
    ],
    exemplos: [`${manifesto.bin} skill`, `${manifesto.bin} skill mcp`, `${manifesto.bin} --skill cli`],
    executar: (ctx) => {
      const topico = ctx.args[0];
      const texto = textoDaSkill(obterRaiz(), topico);
      return { dados: { topico: topico ?? "todos", markdown: texto }, texto };
    },
  };
}
