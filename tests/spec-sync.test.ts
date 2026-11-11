/** spec sync: YAML emitter round trip and missing-entry detection. */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseClispec as parseSpec } from "../src/spec/parse.ts";
import { computeSync, mergedFrontmatter } from "../src/spec/sync.ts";
import { writeFrontmatter } from "../src/spec/files.ts";
import { compact, emitYaml } from "../src/spec/yaml.ts";
import { loadProject, loadSpec } from "../src/spec/index.ts";
import { checkSpec } from "../src/spec/check.ts";

describe("yaml emitter", () => {
  test("round-trips nested objects, arrays and risky strings through Bun.YAML", () => {
    const value = {
      title: "Termfy",
      description: "CLI, TUI: with colon",
      flag: true,
      count: 3,
      items: [{ name: "--tab", values: ["overview", "about"] }, { name: "yes" }],
      empty: [],
      date: "2026-11-10T12:00:00.000Z",
    };
    const text = emitYaml(value).join("\n");
    expect(Bun.YAML.parse(text)).toEqual(value);
  });

  test("compact drops empty arrays and interactive: false but keeps mcp lists", () => {
    const out = compact({ a: [], interactive: false, keep: true, mcp: { tools: [], resources: [], prompts: [] } }) as Record<string, unknown>;
    expect(out).toEqual({ keep: true, mcp: { tools: [], resources: [], prompts: [] } });
  });

  test("compact drops empty objects, which block YAML would read back as null", () => {
    expect(compact({ id: "0002", changes: {}, nested: { add: { mcp: { tools: [] } } } }) as Record<string, unknown>).toEqual({ id: "0002" });
  });
});

describe("spec sync", () => {
  const minimal = `---
schemaVersion: "2.0.0"
bin: termfy
title: Termfy
description: "CLI, TUI and MCP stdio server skeleton in Bun, with the Termfy framework skills installed."
createdAt: "2026-11-10T12:00:00.000Z"
updatedAt: "2026-11-10T12:00:00.000Z"
---

## Purpose

Minimal.

## Audiences

- people

## Out of scope

- nothing

## Notes

- none
`;

  test("parses a spec without optional collections", () => {
    const spec = parseSpec(minimal);
    expect(spec.frontmatter.commands).toEqual([]);
    expect(spec.frontmatter.mcp.tools).toEqual([]);
  });

  test("computes every code entry as missing for a minimal spec", () => {
    const additions = computeSync(parseSpec(minimal));
    expect(additions.commands.map((c) => c.path)).toContain("spec sync");
    expect(additions.screens.map((s) => s.id)).toEqual(expect.arrayContaining(["overview", "specs", "about"]));
    expect(additions.tools.map((t) => t.name)).toContain("about");
    expect(additions.settings.map((s) => s.key)).toContain("output.format");
    expect(additions.total).toBeGreaterThan(20);
  });

  test("writes the merged front matter and the result passes strict check", () => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-sync-"));
    const file = join(dir, "CLISPEC.md");
    writeFileSync(file, minimal);
    const spec = parseSpec(minimal);
    writeFrontmatter(file, mergedFrontmatter(spec, computeSync(spec)));
    const merged = parseSpec(readFileSync(file, "utf8"));
    expect(merged.sections.Purpose).toBe("Minimal.");
    expect(merged.sections.Notes).toBe("- none");
    expect(computeSync(merged).total).toBe(0);
    const result = checkSpec(merged, { strict: true });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("the embedded spec has nothing to sync beyond open specs", () => {
    expect(computeSync(loadSpec(), loadProject(join(import.meta.dir, "../CLISPEC.md"))!.specs).total).toBe(0);
  });
});
