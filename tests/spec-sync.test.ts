/** spec sync: YAML emitter round trip and missing-entry detection. */
import { describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseSpec } from "../src/spec/parse.ts";
import { computeSync, mergedFrontmatter, writeFrontmatter } from "../src/spec/sync.ts";
import { compact, emitYaml } from "../src/spec/yaml.ts";
import { loadSpec } from "../src/spec/index.ts";
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
});

describe("spec sync", () => {
  const minimal = `---
schemaVersion: "1.0.0"
bin: termfy
title: Termfy
description: "CLI, TUI and MCP stdio server skeleton in Bun, with the Termfy framework skills installed."
status: draft
createdAt: "2026-11-10T12:00:00.000Z"
updatedAt: "2026-11-10T12:00:00.000Z"
---

## Purpose

Minimal.

## Audiences

- people

## Out of scope

- nothing

## Checklist

- [ ] First item \`#termfy-cli\` {#a1b2}

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
    expect(additions.screens.map((s) => s.id)).toEqual(["overview", "about"]);
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
    expect(merged.checklist[0]?.id).toBe("a1b2");
    expect(computeSync(merged).total).toBe(0);
    const result = checkSpec(merged, { strict: true });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
    rmSync(dir, { recursive: true, force: true });
  });

  test("the embedded spec has nothing to sync", () => {
    expect(computeSync(loadSpec()).total).toBe(0);
  });
});
