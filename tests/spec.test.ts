/** Contract tests for spec parsing, registry checks, credential scanning and public interfaces. */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { AppError } from "../src/app/errors.ts";
import { ExitCode } from "../src/app/exit-codes.ts";
import { manifest } from "../src/app/manifest.ts";
import { HOME_VARIABLE } from "../src/config/paths.ts";
import { loadSpec } from "../src/spec/index.ts";
import { parseSpec, type ParsedSpec } from "../src/spec/parse.ts";
import { checkSpec } from "../src/spec/check.ts";
import { checkCredentialUsage } from "../scripts/check-spec.ts";
import type { Spec } from "../src/spec/schema.ts";
import { root } from "../src/cli/commands.ts";

const base: Spec = {
  schemaVersion: "1.0.0", bin: manifest.bin, title: manifest.title, description: manifest.description,
  status: "in_progress", createdAt: "2026-11-10T12:00:00.000Z", updatedAt: "2026-11-10T12:00:00.000Z",
  commands: [], screens: [], mcp: { tools: [], resources: [], prompts: [] }, settings: [], credentials: [],
};

function document(frontmatter: unknown = base, checklist = "- [ ] Build `orders list` `#termfy-cli` {#a1b2}\n- [x] Add tests {#c3d4}"): string {
  return `---\n${Bun.YAML.stringify(frontmatter)}\n---\nIgnored introduction.\n\n## Purpose\n\nExample purpose.\n\n## Audiences\n\nDevelopers.\n\n## Out of scope\n\nNetwork.\n\n## Checklist\n\n${checklist}\n\n## Notes\n`;
}

function expectConfig(raw: string): void {
  let caught: unknown;
  try { parseSpec(raw); } catch (e) { caught = e; }
  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).code).toBe(ExitCode.CONFIG);
}

describe("parseSpec", () => {
  test("parses YAML, exact sections, optional skill tags and progress", () => {
    const spec = parseSpec(document());
    expect(spec.frontmatter).toEqual(base);
    expect(spec.sections.Purpose).toBe("Example purpose.");
    expect(spec.sections.Notes).toBe("");
    expect(spec.checklist).toEqual([
      { id: "a1b2", text: "Build `orders list`", done: false, skill: "termfy-cli" },
      { id: "c3d4", text: "Add tests", done: true },
    ]);
    expect(spec.progress).toEqual({ done: 1, total: 2, percent: 50 });
  });

  test.each(["- [ ] Missing ID", "- [ ] Short ID {#abc}", "- [ ] Uppercase ID {#AB12}", "- [ ] Long ID {#abcde}"])("rejects invalid checklist item: %s", (item) => {
    expectConfig(document(base, item));
  });

  test("rejects repeated IDs", () => {
    expectConfig(document(base, "- [ ] First {#a1b2}\n- [x] Second {#a1b2}"));
  });

  test.each([
    "* [ ] Pending {#a1b2}", "+ [ ] Pending", "1. [ ] Pending {#a1b2}",
    "- [?] Unknown state {#a1b2}", "- [] Empty checkbox {#a1b2}",
    "- [ ]   {#a1b2}", "- [ ] `#termfy-cli` {#a1b2}",
  ])("rejects malformed tasks instead of hiding pending work: %s", (item) => {
    expectConfig(document({ ...base, status: "done" }, item));
  });

  test("accepts checkbox whitespace and uppercase X", () => {
    expect(parseSpec(document(base, "-\t[X]\tComplete\t{#a1b2}")).progress).toEqual({ done: 1, total: 1, percent: 100 });
  });

  test("rejects status done with a pending item", () => {
    expectConfig(document({ ...base, status: "done" }));
    expect(parseSpec(document({ ...base, status: "done" }, "- [x] Complete {#a1b2}")).progress.percent).toBe(100);
  });

  test("empty checklist has finite zero progress and preserves declared status", () => {
    const spec = parseSpec(document({ ...base, status: "draft" }, ""));
    expect(spec.progress).toEqual({ done: 0, total: 0, percent: 0 });
    expect(spec.frontmatter.status).toBe("draft");
  });

  test("ignores fenced examples and text outside fixed sections", () => {
    const raw = document(base, "```markdown\n## Notes\n- [ ] Example without ID\n```\n- [x] Real item {#a1b2}")
      .replace("## Audiences", "## Other\nOutside text.\n\n## Audiences");
    const spec = parseSpec(raw.replace(/\n/g, "\r\n"));
    expect(spec.progress.total).toBe(1);
    expect(spec.sections.Checklist).toContain("Example without ID");
    expect(spec.sections.Purpose).not.toContain("Outside text");
  });

  test("requires exact headings, order and uniqueness", () => {
    expectConfig(document().replace("## Notes", "## notes"));
    expectConfig(document().replace("## Purpose", "## Notes"));
    expectConfig(`${document()}\n## Purpose\nRepeated.`);
  });

  test("rejects missing front matter, malformed YAML and unknown fields", () => {
    expectConfig("## Purpose\nNo YAML.");
    expectConfig("---\nbin: example\n");
    expectConfig("---\n---\n");
    expectConfig("---\nunterminated: [\n---\n");
    expectConfig(document({ ...base, extra: true }));
    expectConfig(document({ ...base, commands: [{ path: "about", description: "About.", extra: true }] }));
    expectConfig(document({ ...base, mcp: { tools: [{ name: "about", effect: "read", extra: true }], resources: [], prompts: [] } }));
  });

  test.each([
    { schemaVersion: "2.0.0" }, { status: "unknown" }, { createdAt: "yesterday" },
    { title: "   " }, { bin: "\t" },
    { commands: "about" }, { settings: [{ key: "x", type: "object", default: {} }] },
    { credentials: [{ name: "Invalid Name", usedBy: [] }] },
    { commands: [{ path: "about", description: "About.", exitCodes: [1.5] }] },
    { commands: [{ path: "about", description: "About.", options: [{ name: "short" }] }] },
  ])("rejects invalid field types and values: %j", (override) => {
    expectConfig(document({ ...base, ...override }));
  });

  test("requires reasons only for the matching lifecycle state", () => {
    expectConfig(document({ ...base, status: "blocked" }));
    expectConfig(document({ ...base, status: "archived" }));
    expectConfig(document({ ...base, blockedReason: "Waiting." }));
    expect(parseSpec(document({ ...base, status: "blocked", blockedReason: "Waiting for an API." })).frontmatter.status).toBe("blocked");
    expect(parseSpec(document({ ...base, status: "archived", archivedReason: "Project closed." })).frontmatter.status).toBe("archived");
  });
});

describe("checkSpec", () => {
  test("the shipped spec covers every registry entry", () => {
    expect(checkSpec(loadSpec(), { strict: true })).toEqual({ ok: true, errors: [], warnings: [] });
  });

  test("unknown command is an error", () => {
    const spec = loadSpec();
    spec.frontmatter.commands.push({ path: "orders list", description: "List orders." });
    const result = checkSpec(spec);
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("Unknown command: orders list.");
  });

  test("undeclared code command warns and fails only in strict mode", () => {
    const spec = loadSpec();
    spec.frontmatter.commands = spec.frontmatter.commands.filter((command) => command.path !== "config get");
    expect(checkSpec(spec).ok).toBe(true);
    expect(checkSpec(spec).warnings).toContain("Command missing from spec: config get.");
    expect(checkSpec(spec, { strict: true }).ok).toBe(false);
  });

  const cases: Array<[string, (spec: ParsedSpec) => void]> = [
    ["identity", (s) => { s.frontmatter.bin = "other"; s.frontmatter.description = "Other description."; }],
    ["option", (s) => { s.frontmatter.commands.find((c) => c.path === "about")!.options = [{ name: "--unknown" }]; }],
    ["argument", (s) => { s.frontmatter.commands.find((c) => c.path === "about")!.arguments = [{ name: "unknown" }]; }],
    ["exit code", (s) => { s.frontmatter.commands.find((c) => c.path === "about")!.exitCodes = [999, ExitCode.CREDENTIALS]; }],
    ["screen", (s) => { s.frontmatter.screens.push({ id: "unknown", title: "Unknown" }); }],
    ["tool", (s) => { s.frontmatter.mcp.tools.push({ name: "unknown", effect: "read" }); }],
    ["resource", (s) => { s.frontmatter.mcp.resources.push({ uri: "termfy://unknown" }); }],
    ["prompt", (s) => { s.frontmatter.mcp.prompts.push({ name: "unknown" }); }],
    ["setting", (s) => { s.frontmatter.settings.push({ key: "unknown", type: "string", default: "" }); }],
    ["setting type", (s) => { s.frontmatter.settings[0]!.type = "number"; }],
    ["credential consumer", (s) => { s.frontmatter.credentials.push({ name: "shop.token", usedBy: ["unknown"] }); }],
    ["pending done item", (s) => { s.checklist[0]!.done = false; }],
  ];
  test.each(cases)("rejects a mismatched %s", (_, change) => {
    const spec = loadSpec();
    change(spec);
    expect(checkSpec(spec).ok).toBe(false);
    expect(checkSpec(spec).errors.length).toBeGreaterThan(0);
  });

  test("warns for missing screens, tools and settings but not resources or prompts", () => {
    const spec = loadSpec();
    spec.frontmatter.screens = [];
    spec.frontmatter.settings = [];
    spec.frontmatter.mcp = { tools: [], resources: [], prompts: [] };
    const result = checkSpec(spec);
    expect(result.ok).toBe(true);
    for (const kind of ["Screen", "Tool", "Setting"]) expect(result.warnings.some((message) => message.startsWith(kind))).toBe(true);
    expect(result.warnings.some((message) => /^(Resource|Prompt)/.test(message))).toBe(false);
  });

  test("accepts global options and existing command or tool credential consumers", () => {
    const spec = loadSpec();
    spec.frontmatter.commands.find((command) => command.path === "about")!.options = [{ name: "--json" }];
    spec.frontmatter.credentials.push({ name: "shop.token", usedBy: ["config get", "config_get"] });
    expect(checkSpec(spec).ok).toBe(true);
  });

  test("accepts recursive ancestor options and rejects non-recursive ones", () => {
    const original = root.options;
    try {
      root.options = [{ name: "--ancestor", description: "Test ancestor option.", recursive: true, argument: { name: "level" } }];
      const spec = loadSpec();
      spec.frontmatter.commands.find((command) => command.path === "config get")!.options = [{ name: "--ancestor", argument: "level" }];
      expect(checkSpec(spec).ok).toBe(true);
      root.options = [{ ...root.options[0]!, recursive: false }];
      expect(checkSpec(spec).errors).toContain("Unknown option --ancestor on command config get.");
    } finally { root.options = original; }
  });
});

test("credential scanner ignores comments and strings but checks literal calls", async () => {
  const dir = mkdtempSync(join(tmpdir(), "termfy-spec-scan-"));
  try {
    await Bun.write(join(dir, "example.ts"), [
      '// getCredential("comment.token")',
      'const example = \'getCredential("example.token")\';',
      'getCredential("shop.token");',
      "getCredential('other.token');",
      'getCredential(name);',
    ].join("\n"));
    const spec = { ...base, credentials: [{ name: "shop.token", usedBy: [] }] };
    expect(await checkCredentialUsage(spec, dir)).toEqual(["example.ts:4: credential other.token is missing from the spec."]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

describe("spec interfaces", () => {
  test("show uses a concise text summary and preserves complete JSON", async () => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-spec-show-"));
    try {
      const run = async (args: string[]) => {
        const proc = Bun.spawn([process.execPath, "run", "src/main.ts", "spec", "show", ...args], {
          cwd: join(import.meta.dir, ".."), env: { ...process.env, [HOME_VARIABLE]: dir, NO_COLOR: "1" },
          stdin: "ignore", stdout: "pipe", stderr: "pipe",
        });
        const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
        expect(code).toBe(ExitCode.SUCCESS);
        expect(stderr).toBe("");
        return stdout;
      };
      const text = await run([]);
      for (const label of ["Status", "Commands", "Screens", "Tools", "Settings", "Credentials", "Checklist", "Purpose", "Out of scope"]) expect(text).toContain(label);
      expect(text).not.toContain("schemaVersion:");
      expect(text).not.toContain("## Notes");
      expect(text.length).toBeLessThan(1600);
      const { frontmatter, sections, progress } = loadSpec();
      expect(JSON.parse(await run(["--json"])).data).toEqual({ frontmatter, sections, progress });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test.each([
    { strict: false, remove: false, code: ExitCode.SUCCESS },
    { strict: true, remove: false, code: ExitCode.CONFIG },
    { strict: false, remove: true, code: ExitCode.CONFIG },
  ])("check reports warnings and errors with the correct exit code: %j", async ({ strict, remove, code }) => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-spec-check-"));
    try {
      // Alter only the in-memory registry of an isolated subprocess, never repository files.
      const script = `
        import { root } from "./src/cli/commands.ts";
        import { runCli } from "./src/cli/index.ts";
        root.subcommands = ${remove ? 'root.subcommands.filter((command) => command.name !== "about")' : '[...root.subcommands, { name: "test-only", description: "Test only." }]'};
        process.exit(await runCli(${JSON.stringify(["spec", "check", "--json", ...(strict ? ["--strict"] : [])])}));
      `;
      const proc = Bun.spawn([process.execPath, "-e", script], {
        cwd: join(import.meta.dir, ".."), env: { ...process.env, [HOME_VARIABLE]: dir, NO_COLOR: "1" },
        stdin: "ignore", stdout: "pipe", stderr: "pipe",
      });
      const [stdout, stderr, actual] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
      expect(stderr).toBe("");
      expect(actual).toBe(code);
      const result = JSON.parse(stdout).data;
      expect(result.ok).toBe(code === ExitCode.SUCCESS);
      if (remove) expect(result.errors).toContain("Unknown command: about.");
      else {
        expect(result.errors).toEqual([]);
        expect(result.warnings).toContain("Command missing from spec: test-only.");
      }
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test("CLI spec check --json succeeds in a subprocess", async () => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-spec-cli-"));
    try {
      const proc = Bun.spawn([process.execPath, "run", "src/main.ts", "spec", "check", "--json"], {
        cwd: join(import.meta.dir, ".."), env: { ...process.env, [HOME_VARIABLE]: dir, NO_COLOR: "1" },
        stdin: "ignore", stdout: "pipe", stderr: "pipe",
      });
      const [stdout, stderr, code] = await Promise.all([new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited]);
      expect(stderr).toBe("");
      expect(code).toBe(ExitCode.SUCCESS);
      expect(JSON.parse(stdout)).toEqual({ ok: true, command: `${manifest.bin} spec check`, data: { ok: true, errors: [], warnings: [] } });
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });

  test("MCP spec returns the same parsed data as the loader", async () => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-spec-mcp-"));
    const client = new Client({ name: "spec-test", version: "1.0.0" });
    const transport = new StdioClientTransport({
      command: process.execPath, args: ["run", "src/main.ts", "mcp"], cwd: join(import.meta.dir, ".."),
      env: { ...process.env, [HOME_VARIABLE]: dir } as Record<string, string>, stderr: "pipe",
    });
    try {
      await client.connect(transport);
      const result = await client.callTool({ name: "spec", arguments: {} });
      const { frontmatter, sections, progress } = loadSpec();
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toEqual({ frontmatter, sections, progress });
      expect(JSON.parse((result.content as Array<{ text: string }>)[0]!.text)).toEqual(result.structuredContent);
    } finally {
      await client.close();
      await transport.close();
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
