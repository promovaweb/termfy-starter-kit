/**
 * Formatação da saída de texto.
 *
 * Centraliza cores ANSI, tabelas de duas colunas e títulos. As cores
 * respeitam, nesta ordem: `--no-color`, `NO_COLOR`, ausência de TTY e a
 * preferência `saida.cores` em settings.json. O JSON nunca passa por aqui.
 */
import { lerSettings, obterCaminho } from "../config/settings.ts";

let coresForcadas: boolean | undefined;

/** Permite ao `main.ts` desligar cores a partir de `--no-color`. */
export function forcarCores(ativas: boolean | undefined): void {
  coresForcadas = ativas;
}

/** Decide se a saída de texto usa cores. */
export function usarCores(): boolean {
  if (coresForcadas !== undefined) return coresForcadas;
  if (process.env.NO_COLOR && process.env.NO_COLOR !== "") return false;
  if (!process.stdout.isTTY) return false;
  try {
    return obterCaminho(lerSettings(), "saida.cores") !== false;
  } catch {
    return true;
  }
}

function pintar(codigo: string, texto: string): string {
  return usarCores() ? `\u001b[${codigo}m${texto}\u001b[0m` : texto;
}

/** Paleta mínima de texto. Os nomes seguem o papel, não a cor. */
export const cor = {
  titulo: (t: string) => pintar("1;36", t),
  destaque: (t: string) => pintar("1", t),
  sutil: (t: string) => pintar("2", t),
  ok: (t: string) => pintar("32", t),
  aviso: (t: string) => pintar("33", t),
  erro: (t: string) => pintar("31", t),
  codigo: (t: string) => pintar("35", t),
};

/** Tabela de duas colunas alinhada à maior chave. */
export function tabela(linhas: Array<[string, string]>, recuo = 2): string {
  if (linhas.length === 0) return "";
  const largura = Math.max(...linhas.map(([k]) => k.length));
  const espaco = " ".repeat(recuo);
  return linhas.map(([k, v]) => `${espaco}${cor.destaque(k.padEnd(largura))}  ${v}`).join("\n");
}

/** Cabeçalho de seção na ajuda e nos comandos. */
export function secao(titulo: string): string {
  return cor.titulo(titulo);
}

/** Junta blocos separando por linha em branco e ignorando vazios. */
export function blocos(...partes: Array<string | undefined | false>): string {
  return partes.filter((p): p is string => typeof p === "string" && p.length > 0).join("\n\n");
}
