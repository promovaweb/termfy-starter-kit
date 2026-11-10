/** Monta a TUI no renderer de teste do OpenTUI e confere as abas por frame. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestRenderer, type TestRendererSetup } from "@opentui/core/testing";
import { VARIAVEL_HOME } from "../src/config/caminhos.ts";
import { manifesto } from "../src/app/manifesto.ts";
import { montarTui } from "../src/tui/index.ts";

let pasta: string;
let setup: TestRendererSetup;
let encerrada: Promise<void>;

beforeAll(async () => {
  pasta = mkdtempSync(join(tmpdir(), "termfy-tui-"));
  process.env[VARIAVEL_HOME] = pasta;
  setup = await createTestRenderer({ width: 120, height: 32 });
  encerrada = montarTui(setup.renderer, {});
  await setup.renderOnce();
});

afterAll(async () => {
  await encerrada.catch(() => undefined);
  rmSync(pasta, { recursive: true, force: true });
  delete process.env[VARIAVEL_HOME];
});

describe("tui", () => {
  test("abre na aba Overview com cabeçalho, painéis e barra de teclas", async () => {
    const frame = setup.captureCharFrame();
    expect(frame).toContain(manifesto.titulo);
    expect(frame).toContain(`v${manifesto.versao}`);
    expect(frame).toContain("Overview");
    expect(frame).toContain("About");
    expect(frame).toContain("Ambiente");
    expect(frame).toContain("Configuração em vigor");
    expect(frame).toContain("sair");
  });

  test("tecla 2 vai para About e ? abre a ajuda", async () => {
    setup.mockInput.pressKey("2");
    await setup.renderOnce();
    let frame = setup.captureCharFrame();
    expect(frame).toContain("Créditos");
    expect(frame).toContain("OpenTUI");
    setup.mockInput.pressKey("?");
    await setup.renderOnce();
    frame = setup.captureCharFrame();
    expect(frame).toContain("Teclas");
    setup.mockInput.pressKey("?");
    await setup.renderOnce();
  });

  test("q encerra o renderer", async () => {
    setup.mockInput.pressKey("q");
    await encerrada;
    expect(setup.renderer.isDestroyed).toBe(true);
  });
});
