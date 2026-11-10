/** Execução ponta a ponta do CLI em subprocesso, com pasta de dados isolada. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { VARIAVEL_HOME } from "../src/config/caminhos.ts";
import { manifesto } from "../src/app/manifesto.ts";

let pasta: string;

beforeAll(() => {
  pasta = mkdtempSync(join(tmpdir(), "termfy-cli-"));
});
afterAll(() => rmSync(pasta, { recursive: true, force: true }));

async function rodar(args: string[], stdin?: string) {
  const proc = Bun.spawn(["bun", "run", "src/main.ts", ...args], {
    cwd: join(import.meta.dir, ".."),
    env: { ...process.env, [VARIAVEL_HOME]: pasta, NO_COLOR: "1" },
    stdin: stdin === undefined ? "ignore" : new Response(stdin),
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text()]);
  const codigo = await proc.exited;
  return { codigo, stdout, stderr };
}

describe("cli", () => {
  test("--version", async () => {
    const r = await rodar(["--version"]);
    expect(r.codigo).toBe(0);
    expect(r.stdout.trim()).toBe(`${manifesto.bin} ${manifesto.versao}`);
  });

  test("--help lista comandos e códigos de saída", async () => {
    const r = await rodar(["--help"]);
    expect(r.codigo).toBe(0);
    for (const c of ["about", "config", "credentials", "mcp", "skill", "tui"]) expect(r.stdout).toContain(c);
    expect(r.stdout).toContain("TERMINAL_INDISPONIVEL");
  });

  test("sem argumentos e sem TTY imprime ajuda e sai com 2", async () => {
    const r = await rodar([]);
    expect(r.codigo).toBe(2);
    expect(r.stdout).toContain("Uso");
  });

  test("about --json devolve envelope", async () => {
    const r = await rodar(["about", "--json"]);
    expect(r.codigo).toBe(0);
    const json = JSON.parse(r.stdout);
    expect(json.ok).toBe(true);
    expect(json.comando).toBe(`${manifesto.bin} about`);
    expect(json.dados.versao).toBe(manifesto.versao);
  });

  test("config set/get e erro de configuração em JSON", async () => {
    expect((await rodar(["config", "set", "tui.tema", "dia"])).codigo).toBe(0);
    const get = await rodar(["config", "get", "tui.tema"]);
    expect(get.stdout.trim()).toBe("dia");
    const erroJson = await rodar(["config", "get", "nao.existe", "--json"]);
    expect(erroJson.codigo).toBe(3);
    expect(JSON.parse(erroJson.stdout).erro.nome).toBe("CONFIGURACAO");
  });

  test("credentials set via stdin, list e get mascarado", async () => {
    const set = await rodar(["credentials", "set", "github.token", "--stdin"], "ghp_abcdefghijklmnop\n");
    expect(set.codigo).toBe(0);
    const list = await rodar(["credentials", "list", "--json"]);
    expect(JSON.parse(list.stdout).dados.nomes).toEqual(["github.token"]);
    const get = await rodar(["credentials", "get", "github.token"]);
    expect(get.stdout.trim()).not.toContain("abcdefghijklmnop");
    const reveal = await rodar(["credentials", "get", "github.token", "--reveal"]);
    expect(reveal.stdout.trim()).toBe("ghp_abcdefghijklmnop");
    const falta = await rodar(["credentials", "get", "x.y"]);
    expect(falta.codigo).toBe(4);
  });

  test("opção desconhecida sai com 2", async () => {
    const r = await rodar(["about", "--nada"]);
    expect(r.codigo).toBe(2);
    expect(r.stderr).toContain("Opção desconhecida");
  });

  test("tui sem TTY sai com 8", async () => {
    const r = await rodar(["tui"]);
    expect(r.codigo).toBe(8);
  });

  test("--skill imprime a documentação com a referência gerada", async () => {
    const r = await rodar(["--skill"]);
    expect(r.codigo).toBe(0);
    expect(r.stdout).toContain("# CLI");
    expect(r.stdout).toContain("# MCP");
    expect(r.stdout).toContain(`\`${manifesto.bin} credentials set\``);
    const topico = await rodar(["--skill", "codigos", "--json"]);
    expect(JSON.parse(topico.stdout).dados.topico).toBe("codigos");
  });

  test("--opencli devolve documento válido", async () => {
    const r = await rodar(["--opencli"]);
    const doc = JSON.parse(r.stdout);
    expect(doc.opencli).toBe("0.1");
    expect(doc.command.name).toBe(manifesto.bin);
    expect(doc.command.commands.map((c: { name: string }) => c.name)).toContain("credentials");
    expect(doc.command.exitCodes.find((e: { code: number }) => e.code === 0)).toBeTruthy();
  });

  test("mcp --list enumera tools, resources e prompts", async () => {
    const r = await rodar(["mcp", "--list", "--json"]);
    expect(r.codigo).toBe(0);
    const d = JSON.parse(r.stdout).dados;
    expect(d.tools.map((t: { nome: string }) => t.nome)).toEqual(
      expect.arrayContaining(["about", "exit_codes", "skill", "config_list", "config_get", "credentials_status"]),
    );
    expect(d.resources.length).toBeGreaterThanOrEqual(4);
    expect(d.prompts[0].nome).toBe("operar");
  });
});
