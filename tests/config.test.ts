/** settings.json e credentials.json em uma pasta temporária. */
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VARIAVEL_CHAVE_MESTRA, VARIAVEL_HOME, caminhos } from "../src/config/caminhos.ts";
import { converterValor, gravarSettings, lerSettings, obterCaminho, definirCaminho, removerCaminho, achatar } from "../src/config/settings.ts";
import { definirCredencial, listarCredenciais, mascarar, obterCredencial, removerCredencial, statusCofre, validarNome } from "../src/config/credenciais.ts";
import { cifrar, decifrar } from "../src/config/cripto.ts";
import { ErroApp } from "../src/app/erros.ts";
import { CodigoSaida } from "../src/app/saida.ts";

let pasta: string;

beforeEach(() => {
  pasta = mkdtempSync(join(tmpdir(), "termfy-teste-"));
  process.env[VARIAVEL_HOME] = pasta;
  delete process.env[VARIAVEL_CHAVE_MESTRA];
});

afterEach(() => {
  rmSync(pasta, { recursive: true, force: true });
  delete process.env[VARIAVEL_HOME];
});

describe("settings", () => {
  test("lê padrões sem arquivo e grava com notação de ponto", () => {
    const s = lerSettings();
    expect(obterCaminho(s, "saida.formato")).toBe("texto");
    definirCaminho(s, "saida.formato", "json");
    gravarSettings(s);
    expect(obterCaminho(lerSettings(), "saida.formato")).toBe("json");
    expect(caminhos.settings()).toBe(join(pasta, "settings.json"));
  });

  test("converte tipos e rejeita enum inválido", () => {
    expect(converterValor("saida.cores", "nao")).toBe(false);
    expect(converterValor("saida.cores", "1")).toBe(true);
    expect(() => converterValor("tui.tema", "roxo")).toThrow(/aceita apenas/);
    expect(converterValor("livre.chave", "x")).toBe("x");
  });

  test("remove e achata", () => {
    const s = { a: { b: 1, c: 2 }, d: true };
    expect(removerCaminho(s, "a.b")).toBe(true);
    expect(removerCaminho(s, "a.b")).toBe(false);
    expect(achatar(s)).toEqual([["a.c", 2], ["d", true]]);
  });
});

describe("cripto", () => {
  test("cifra e decifra com a mesma chave; chave errada falha com CREDENCIAIS", () => {
    const chave = Buffer.alloc(32, 7);
    const env = cifrar("segredo", chave);
    expect(env.algoritmo).toBe("aes-256-gcm");
    expect(decifrar(env, chave)).toBe("segredo");
    try {
      decifrar(env, Buffer.alloc(32, 8));
      throw new Error("deveria falhar");
    } catch (e) {
      expect((e as ErroApp).codigo).toBe(CodigoSaida.CREDENCIAIS);
    }
  });
});

describe("credenciais", () => {
  test("grava cifrado, lista, lê, mascara e remove", () => {
    definirCredencial("openai.api_key", "sk-1234567890abcdef");
    const bruto = readFileSync(caminhos.credentials(), "utf8");
    expect(bruto).not.toContain("sk-1234567890abcdef");
    expect(JSON.parse(bruto).algoritmo).toBe("aes-256-gcm");
    expect(listarCredenciais()).toEqual(["openai.api_key"]);
    expect(obterCredencial("openai.api_key")).toBe("sk-1234567890abcdef");
    expect(mascarar("sk-1234567890abcdef")).toMatch(/^sk-1\*+ef$/);
    expect(statusCofre().origemChave).toBe("arquivo");
    expect(statSync(caminhos.chaveMestra()).mode & 0o777).toBe(0o600);
    expect(removerCredencial("openai.api_key")).toBe(true);
    expect(listarCredenciais()).toEqual([]);
  });

  test("credencial ausente encerra com código 4", () => {
    definirCredencial("a.b", "x");
    try {
      obterCredencial("nao.existe");
      throw new Error("deveria falhar");
    } catch (e) {
      expect((e as ErroApp).codigo).toBe(CodigoSaida.CREDENCIAIS);
    }
  });

  test("usa a chave da variável de ambiente quando definida", () => {
    process.env[VARIAVEL_CHAVE_MESTRA] = "ab".repeat(32);
    definirCredencial("x.y", "valor");
    expect(statusCofre().origemChave).toBe("env");
    expect(obterCredencial("x.y")).toBe("valor");
  });

  test("valida nomes", () => {
    expect(validarNome("GitHub.Token")).toBe("github.token");
    expect(() => validarNome("com espaço")).toThrow(/inválido/);
  });
});
