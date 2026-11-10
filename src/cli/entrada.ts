/**
 * Leitura de segredos e confirmações no terminal.
 *
 * `lerSegredo` lê um valor sem ecoar na tela quando stdin é TTY e lê a
 * primeira linha do stdin quando não é (pipes e scripts). `confirmar` faz
 * uma pergunta sim/não. Nenhuma função registra o valor lido.
 */
import { erro } from "../app/erros.ts";

/** Lê stdin inteiro como texto, para o modo não interativo. */
export async function lerStdin(): Promise<string> {
  const pedacos: Uint8Array[] = [];
  for await (const pedaco of Bun.stdin.stream()) pedacos.push(pedaco as Uint8Array);
  return Buffer.concat(pedacos).toString("utf8");
}

/**
 * Lê um segredo. Em TTY, mostra o rótulo e oculta a digitação. Fora de TTY,
 * usa a primeira linha de stdin e lança USO_INVALIDO quando estiver vazia.
 */
export async function lerSegredo(rotulo: string): Promise<string> {
  if (!process.stdin.isTTY) {
    const texto = (await lerStdin()).split(/\r?\n/)[0] ?? "";
    if (texto.length === 0) throw erro.uso("Nenhum valor recebido pelo stdin. Envie o segredo em uma linha.");
    return texto;
  }

  process.stderr.write(`${rotulo}: `);
  return await new Promise<string>((resolver, rejeitar) => {
    const stdin = process.stdin;
    let valor = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    const encerrar = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", aoReceber);
      process.stderr.write("\n");
    };

    const aoReceber = (tecla: string) => {
      for (const ch of tecla) {
        if (ch === "\u0003") {
          encerrar();
          rejeitar(erro.interrompido("Leitura cancelada."));
          return;
        }
        if (ch === "\r" || ch === "\n") {
          encerrar();
          resolver(valor);
          return;
        }
        if (ch === "\u007f" || ch === "\b") {
          valor = valor.slice(0, -1);
          continue;
        }
        if (ch >= " ") valor += ch;
      }
    };

    stdin.on("data", aoReceber);
  });
}

/** Pergunta sim/não. Fora de TTY devolve `padrao`. */
export async function confirmar(pergunta: string, padrao = false): Promise<boolean> {
  if (!process.stdin.isTTY) return padrao;
  const resposta = prompt(`${pergunta} ${padrao ? "[S/n]" : "[s/N]"}`);
  if (resposta === null || resposta.trim() === "") return padrao;
  return /^s|^y/i.test(resposta.trim());
}
