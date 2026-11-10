/**
 * Parser de argv.
 *
 * Caminha pela árvore de comandos consumindo subcomandos, depois separa
 * opções e argumentos posicionais. Aceita `--chave valor`, `--chave=valor`,
 * aliases curtos e `--` para encerrar a leitura de opções. Opções
 * desconhecidas, valores fora da lista e argumentos obrigatórios ausentes
 * geram `ErroApp` com USO_INVALIDO, para que o processo saia com código 2.
 */
import { erro } from "../app/erros.ts";
import {
  OPCOES_GLOBAIS,
  chaveDaOpcao,
  encontrarSubcomando,
  type Comando,
  type DefinicaoOpcao,
  type Opcoes,
} from "./registro.ts";

/** Resultado do parse: comando alvo, caminho, argumentos e opções. */
export interface Analise {
  comando: Comando;
  caminho: string[];
  args: string[];
  opcoes: Opcoes;
}

function opcoesVisiveis(cadeia: Comando[]): DefinicaoOpcao[] {
  const lista: DefinicaoOpcao[] = [...OPCOES_GLOBAIS];
  cadeia.forEach((cmd, indice) => {
    for (const op of cmd.opcoes ?? []) {
      const ehUltimo = indice === cadeia.length - 1;
      if (ehUltimo || op.recursiva) lista.push(op);
    }
  });
  return lista;
}

function localizarOpcao(lista: DefinicaoOpcao[], token: string): DefinicaoOpcao | undefined {
  return lista.find((op) => op.nome === token || op.aliases?.includes(token));
}

/** Analisa `argv` (sem o executável) contra a raiz do registro. */
export function analisar(raiz: Comando, argv: readonly string[]): Analise {
  const cadeia: Comando[] = [raiz];
  const caminho: string[] = [];
  const args: string[] = [];
  const opcoes: Opcoes = {};
  let lendoOpcoes = true;
  let i = 0;

  while (i < argv.length) {
    const token = argv[i] as string;

    if (lendoOpcoes && token === "--") {
      lendoOpcoes = false;
      i += 1;
      continue;
    }

    if (lendoOpcoes && token.startsWith("-") && token !== "-") {
      const [nomeBruto, valorInline] = separarInline(token);
      const def = localizarOpcao(opcoesVisiveis(cadeia), nomeBruto);
      if (!def) {
        throw erro.uso(`Opção desconhecida: ${nomeBruto}. Use --help para ver as opções.`, {
          opcao: nomeBruto,
          comando: caminho.join(" ") || raiz.nome,
        });
      }
      const chave = chaveDaOpcao(def.nome);
      if (def.argumento) {
        let valor = valorInline;
        if (valor === undefined) {
          const proximo = argv[i + 1];
          const proximoEhValor = proximo !== undefined && !proximo.startsWith("-");
          if (proximoEhValor) {
            valor = proximo;
            i += 1;
          } else if (!def.argumento.opcional) {
            throw erro.uso(`A opção ${def.nome} exige um valor <${def.argumento.nome}>.`, { opcao: def.nome });
          }
        }
        if (valor !== undefined && def.argumento.valores && !def.argumento.valores.includes(valor)) {
          throw erro.uso(
            `Valor inválido para ${def.nome}: "${valor}". Aceitos: ${def.argumento.valores.join(", ")}.`,
            { opcao: def.nome, valor, aceitos: def.argumento.valores },
          );
        }
        opcoes[chave] = valor === undefined ? true : valor;
      } else {
        if (valorInline !== undefined) {
          throw erro.uso(`A opção ${def.nome} não aceita valor.`, { opcao: def.nome });
        }
        opcoes[chave] = true;
      }
      i += 1;
      continue;
    }

    const atual = cadeia[cadeia.length - 1] as Comando;
    const sub = args.length === 0 ? encontrarSubcomando(atual, token) : undefined;
    if (sub) {
      cadeia.push(sub);
      caminho.push(sub.nome);
      i += 1;
      continue;
    }

    args.push(token);
    i += 1;
  }

  const comando = cadeia[cadeia.length - 1] as Comando;
  const pedeAjuda = opcoes.help === true || opcoes.version === true || opcoes.skill !== undefined || opcoes.opencli === true;
  if (!pedeAjuda) validarArgumentos(comando, args, caminho.join(" ") || raiz.nome);

  return { comando, caminho, args, opcoes };
}

function separarInline(token: string): [string, string | undefined] {
  if (token.startsWith("--")) {
    const igual = token.indexOf("=");
    if (igual > 2) return [token.slice(0, igual), token.slice(igual + 1)];
  }
  return [token, undefined];
}

function validarArgumentos(comando: Comando, args: string[], nomeCompleto: string): void {
  const defs = comando.argumentos ?? [];
  const obrigatorios = defs.filter((d) => d.obrigatorio).length;
  if (args.length < obrigatorios) {
    const faltando = defs.filter((d) => d.obrigatorio).slice(args.length).map((d) => `<${d.nome}>`);
    throw erro.uso(`Faltam argumentos para "${nomeCompleto}": ${faltando.join(" ")}.`, {
      comando: nomeCompleto,
      faltando,
    });
  }
  const ultimo = defs[defs.length - 1];
  const aceitaVariadico = ultimo?.variadico === true;
  if (!aceitaVariadico && args.length > defs.length) {
    if (comando.subcomandos?.length && defs.length === 0) {
      throw erro.uso(`Subcomando desconhecido para "${nomeCompleto}": "${args[0]}". Use --help.`, {
        comando: nomeCompleto,
        recebido: args[0],
      });
    }
    throw erro.uso(`Argumentos a mais para "${nomeCompleto}": ${args.slice(defs.length).join(" ")}.`, {
      comando: nomeCompleto,
      excedentes: args.slice(defs.length),
    });
  }
  defs.forEach((def, indice) => {
    const valor = args[indice];
    if (valor !== undefined && def.valores && !def.valores.includes(valor)) {
      throw erro.uso(`Valor inválido para <${def.nome}>: "${valor}". Aceitos: ${def.valores.join(", ")}.`, {
        argumento: def.nome,
        valor,
        aceitos: def.valores,
      });
    }
  });
}
