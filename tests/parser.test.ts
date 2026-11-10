/** Testes do parser de argv e do registro. */
import { describe, expect, test } from "bun:test";
import { analisar } from "../src/cli/parser.ts";
import { raiz } from "../src/cli/comandos.ts";
import { ErroApp } from "../src/app/erros.ts";
import { CodigoSaida } from "../src/app/saida.ts";

describe("parser", () => {
  test("resolve subcomandos aninhados, argumentos e opções", () => {
    const a = analisar(raiz, ["config", "set", "saida.formato", "json", "--json"]);
    expect(a.caminho).toEqual(["config", "set"]);
    expect(a.args).toEqual(["saida.formato", "json"]);
    expect(a.opcoes.json).toBe(true);
  });

  test("aceita --chave=valor e aliases", () => {
    const a = analisar(raiz, ["tui", "--aba=about"]);
    expect(a.opcoes.aba).toBe("about");
    const b = analisar(raiz, ["-h"]);
    expect(b.opcoes.help).toBe(true);
  });

  test("--skill aceita valor opcional", () => {
    expect(analisar(raiz, ["--skill"]).opcoes.skill).toBe(true);
    expect(analisar(raiz, ["--skill", "mcp"]).opcoes.skill).toBe("mcp");
  });

  test("rejeita opção desconhecida com USO_INVALIDO", () => {
    try {
      analisar(raiz, ["about", "--nada"]);
      throw new Error("deveria falhar");
    } catch (e) {
      expect(e).toBeInstanceOf(ErroApp);
      expect((e as ErroApp).codigo).toBe(CodigoSaida.USO_INVALIDO);
    }
  });

  test("rejeita argumento obrigatório ausente", () => {
    expect(() => analisar(raiz, ["config", "get"])).toThrow(/Faltam argumentos/);
  });

  test("rejeita valor fora da lista", () => {
    expect(() => analisar(raiz, ["tui", "--aba", "nada"])).toThrow(/Aceitos/);
    expect(() => analisar(raiz, ["skill", "nada"])).toThrow(/Aceitos/);
  });

  test("-- encerra opções", () => {
    const a = analisar(raiz, ["config", "get", "--", "--json"]);
    expect(a.args).toEqual(["--json"]);
    expect(a.opcoes.json).toBeUndefined();
  });
});
