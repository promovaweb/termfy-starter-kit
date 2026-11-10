/**
 * Stub de comando. Copie para src/cli/comandos/<nome>.ts, ajuste os imports
 * (eles apontam para src/ a partir de template/) e registre em
 * src/cli/comandos.ts.
 *
 * Checklist:
 * - toda opção e argumento com `descricao`;
 * - `exemplos` começando pelo nome do binário;
 * - `codigosSaida` com as famílias que o comando pode devolver;
 * - `dados` serializável e `texto` legível;
 * - segredos lidos com obterCredencial(), nunca por argumento.
 */
import { manifesto } from "../../src/app/manifesto.ts";
import { CodigoSaida } from "../../src/app/saida.ts";
import { erro } from "../../src/app/erros.ts";
import { cor, tabela } from "../../src/cli/formato.ts";
import type { Comando } from "../../src/cli/registro.ts";

export const comandoExemplo: Comando = {
  nome: "exemplo",
  descricao: "Descreva em uma linha o que o comando faz.",
  descricaoLonga: "Parágrafo opcional com detalhes, pré-requisitos e efeitos colaterais.",
  argumentos: [{ nome: "alvo", descricao: "O que o comando processa.", obrigatorio: true }],
  opcoes: [
    { nome: "--forcar", aliases: ["-f"], descricao: "Executa sem confirmação." },
    { nome: "--limite", argumento: { nome: "n" }, descricao: "Quantidade máxima de itens.", padrao: "10" },
  ],
  codigosSaida: [CodigoSaida.NAO_ENCONTRADO, CodigoSaida.REDE_OU_API],
  exemplos: [`${manifesto.bin} exemplo arquivo.txt`, `${manifesto.bin} exemplo arquivo.txt --limite 5 --json`],
  executar: async (ctx) => {
    const alvo = ctx.args[0] as string;
    const limite = Number(ctx.opcoes.limite ?? 10);
    if (!Number.isFinite(limite) || limite <= 0) throw erro.uso("--limite precisa ser um número maior que zero.");

    // Trabalho real aqui. Use ctx.stderr para progresso em modo texto.
    const itens = [alvo].slice(0, limite);

    return {
      dados: { alvo, limite, itens },
      texto: () => tabela(itens.map((i, n) => [`${cor.sutil(String(n + 1))}`, i])),
    };
  },
};
