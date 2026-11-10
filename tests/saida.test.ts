/** Códigos de saída: unicidade e cobertura da tabela de descrições. */
import { describe, expect, test } from "bun:test";
import { CodigoSaida, descricoesSaida, nomeDoCodigo } from "../src/app/saida.ts";

describe("códigos de saída", () => {
  test("zero é sucesso e os códigos são únicos", () => {
    expect(CodigoSaida.SUCESSO).toBe(0);
    const valores = Object.values(CodigoSaida);
    expect(new Set(valores).size).toBe(valores.length);
  });

  test("toda constante tem descrição", () => {
    for (const [nome, codigo] of Object.entries(CodigoSaida)) {
      expect(nomeDoCodigo(codigo)).toBe(nome);
    }
    expect(descricoesSaida.length).toBe(Object.keys(CodigoSaida).length);
  });
});
