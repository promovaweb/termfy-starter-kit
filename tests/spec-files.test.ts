/** Spec files: change sets, pending entries in check, and the new, close and migrate operations. */
import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AppError } from "../src/app/errors.ts";
import { ExitCode } from "../src/app/exit-codes.ts";
import { checkSpec } from "../src/spec/check.ts";
import { applyChanges, changeCounts } from "../src/spec/delta.ts";
import { closeSpec, createSpec, migrateClispec, renderClispec, renderSpecFile } from "../src/spec/files.ts";
import { loadProject } from "../src/spec/index.ts";
import { parseClispec, parseSpecFile } from "../src/spec/parse.ts";
import type { Clispec, SpecFile } from "../src/spec/schema.ts";
import { syncedClispec, tempProject } from "./support/clispec.ts";

const now = new Date("2026-11-10T15:00:00.000Z");

/** Temporary project whose CLISPEC equals the code (see tests/support/clispec.ts). */
function project(): { dir: string; file: string; clispec: Clispec; done: () => void } {
  return { ...tempProject("termfy-spec-files-"), clispec: syncedClispec().frontmatter };
}

function writeSpec(dir: string, name: string, frontmatter: SpecFile, tasks: string[] = ["- [x] Task `#termfy-cli` {#a1b2}"], tests: string[] = ["- [x] Test {#c3d4}"]): string {
  mkdirSync(join(dir, "specs"), { recursive: true });
  const file = join(dir, "specs", name);
  writeFileSync(file, renderSpecFile(frontmatter, { goal: "Goal.", behavior: "Behavior.", design: "Design.", tasks, tests }));
  return file;
}

function expectConfig(run: () => unknown): void {
  let caught: unknown;
  try { run(); } catch (e) { caught = e; }
  expect(caught).toBeInstanceOf(AppError);
  expect((caught as AppError).code).toBe(ExitCode.CONFIG);
}

const spec = (overrides: Partial<SpecFile>): SpecFile => ({
  schemaVersion: "2.0.0", id: "0001", title: "Change", status: "in_progress",
  createdAt: "2026-11-10T12:00:00.000Z", updatedAt: "2026-11-10T12:00:00.000Z", changes: {}, ...overrides,
});

describe("applyChanges", () => {
  test("adds, updates and removes entries without mutating the input", () => {
    const clispec = syncedClispec().frontmatter;
    const before = structuredClone(clispec);
    const { surface, errors } = applyChanges(clispec, {
      add: { commands: [{ path: "orders list", description: "List orders." }], mcp: { tools: [{ name: "orders_list", effect: "network" }] } },
      update: { commands: [{ path: "about", description: "New about." }] },
      remove: { settings: ["telemetry.enabled"] },
    });
    expect(errors).toEqual([]);
    expect(surface.commands.some((command) => command.path === "orders list")).toBe(true);
    expect(surface.commands.find((command) => command.path === "about")!.description).toBe("New about.");
    expect(surface.mcp.tools.some((tool) => tool.name === "orders_list")).toBe(true);
    expect(surface.settings.some((setting) => setting.key === "telemetry.enabled")).toBe(false);
    expect(clispec).toEqual(before);
  });

  test("reports every conflict", () => {
    const { errors } = applyChanges(syncedClispec().frontmatter, {
      add: { commands: [{ path: "about", description: "Again." }] },
      update: { screens: [{ id: "missing", title: "Missing" }] },
      remove: { tools: ["missing"], commands: ["about"] },
    });
    expect(errors).toEqual([
      "command about appears more than once in the change set.",
      "add command about: already in CLISPEC.md; use update.",
      "update screen missing: not in CLISPEC.md; use add.",
      "remove tool missing: not in CLISPEC.md.",
    ]);
  });

  test("counts entries per operation", () => {
    expect(changeCounts({ add: { commands: [{ path: "a", description: "A." }] }, remove: { screens: ["x", "y"] } })).toEqual({ add: 1, update: 0, remove: 2 });
  });
});

describe("check with spec files", () => {
  test("an entry planned in an open spec is pending, not a warning or an error", () => {
    const p = project();
    try {
      const clispec = parseClispec(readFileSync(p.file, "utf8"));
      clispec.frontmatter.commands = clispec.frontmatter.commands.filter((command) => command.path !== "doctor");
      clispec.frontmatter.screens.push({ id: "orders", title: "Orders" });
      clispec.frontmatter.specs = [{ id: "0001", title: "Change", status: "in_progress" }];
      const doctor = syncedClispec().frontmatter.commands.find((command) => command.path === "doctor")!;
      writeSpec(p.dir, "0001-change.md", spec({ changes: { add: { commands: [doctor] } } }), ["- [x] Restore the doctor command `#termfy-cli` {#a1b2}"]);
      writeSpec(p.dir, "0002-later.md", spec({ id: "0002", status: "draft", changes: { remove: { screens: ["orders"] } } }));
      clispec.frontmatter.specs.push({ id: "0002", title: "Change", status: "draft" });
      const result = checkSpec(clispec, { strict: true, specs: loadProject(p.file)!.specs });
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
      expect(result.pending).toEqual(["command doctor (spec 0001)", "screen orders (spec 0002)"]);
    } finally { p.done(); }
  });

  test("index divergences and conflicting change sets are errors", () => {
    const p = project();
    try {
      writeSpec(p.dir, "0001-change.md", spec({ changes: { add: { commands: [{ path: "about", description: "Again." }] } } }));
      const clispec = parseClispec(readFileSync(p.file, "utf8"));
      clispec.frontmatter.specs = [{ id: "0001", title: "Other", status: "draft" }, { id: "0003", title: "Ghost", status: "draft" }];
      const { errors } = checkSpec(clispec, { specs: loadProject(p.file)!.specs });
      expect(errors).toContain("Spec 0001 (change) has status in_progress, but the CLISPEC.md index says draft.");
      expect(errors).toContain('Spec 0001 (change) has title "Change", but the CLISPEC.md index says "Other".');
      expect(errors).toContain("Spec 0001 (change): add command about: already in CLISPEC.md; use update.");
      expect(errors).toContain("CLISPEC.md lists spec 0003, but specs/ has no 0003-*.md file.");
    } finally { p.done(); }
  });

  test("spec files must match their name", () => {
    const p = project();
    try {
      writeSpec(p.dir, "0002-change.md", spec({ id: "0001" }));
      expectConfig(() => loadProject(p.file));
      rmSync(join(p.dir, "specs"), { recursive: true });
      mkdirSync(join(p.dir, "specs"));
      writeFileSync(join(p.dir, "specs", "notes.md"), "# Notes");
      expectConfig(() => loadProject(p.file));
    } finally { p.done(); }
  });
});

describe("spec new, close and migrate", () => {
  test("new creates a draft with the next ID and indexes it", () => {
    const p = project();
    try {
      const first = createSpec({ slug: "orders-export", file: p.file, now });
      const second = createSpec({ slug: "orders-import", title: "Import orders", file: p.file, now });
      expect([first.id, first.title, second.id, second.title]).toEqual(["0001", "Orders export", "0002", "Import orders"]);
      const loaded = loadProject(p.file)!;
      expect(loaded.clispec.frontmatter.specs).toEqual([
        { id: "0001", title: "Orders export", status: "draft" },
        { id: "0002", title: "Import orders", status: "draft" },
      ]);
      expect(loaded.specs[1]!.spec.frontmatter).toMatchObject({ id: "0002", status: "draft", changes: {} });
      expect(checkSpec(loaded.clispec, { strict: true, specs: loaded.specs }).ok).toBe(true);
      expect(() => createSpec({ slug: "Bad Slug", file: p.file })).toThrow(AppError);
    } finally { p.done(); }
  });

  test("close requires Goal, Behavior, Design and at least one task", () => {
    const p = project();
    try {
      createSpec({ slug: "empty", file: p.file, now });
      expect(readFileSync(join(p.dir, "specs", "0001-empty.md"), "utf8")).toContain("<!-- How the code is built");
      expectConfig(() => closeSpec({ id: "1", file: p.file, now }));
      writeSpec(p.dir, "0001-empty.md", spec({ status: "draft", title: "Empty" }), [], []);
      expectConfig(() => closeSpec({ id: "1", file: p.file, now }));
    } finally { p.done(); }
  });

  test("close refuses pending items and conflicts without writing", () => {
    const p = project();
    try {
      createSpec({ slug: "pending", file: p.file, now });
      const file = writeSpec(p.dir, "0001-pending.md", spec({ status: "draft" }), ["- [ ] Task `#termfy-cli` {#a1b2}"]);
      const before = readFileSync(file, "utf8");
      expectConfig(() => closeSpec({ id: "1", file: p.file, now }));
      writeSpec(p.dir, "0001-pending.md", spec({ status: "draft", changes: { remove: { commands: ["missing"] } } }));
      expectConfig(() => closeSpec({ id: "1", file: p.file, now }));
      writeSpec(p.dir, "0001-pending.md", spec({ status: "draft", changes: { add: { commands: [{ path: "orders list", description: "List orders." }] } } }));
      // The command is not in the registry, so the closed CLISPEC would fail spec check.
      expectConfig(() => closeSpec({ id: "1", file: p.file, now }));
      expect(readFileSync(p.file, "utf8")).toContain("status: draft");
      expect(before).toContain("- [ ] Task");
    } finally { p.done(); }
  });

  test("close applies the change set, marks the spec done and updates the index", () => {
    const p = project();
    try {
      const clispec = parseClispec(readFileSync(p.file, "utf8"));
      const doctor = clispec.frontmatter.commands.find((command) => command.path === "doctor")!;
      writeFileSync(p.file, renderClispec({ ...clispec.frontmatter, commands: clispec.frontmatter.commands.filter((c) => c !== doctor), specs: [{ id: "0001", title: "Change", status: "in_progress" }] }, clispec.sections));
      writeSpec(p.dir, "0001-change.md", spec({ changes: { add: { commands: [doctor] }, update: { commands: [{ ...clispec.frontmatter.commands.find((c) => c.path === "about")!, description: "Updated." }] } } }));
      closeSpec({ id: "0001", file: p.file, now });
      const loaded = loadProject(p.file)!;
      expect(loaded.clispec.frontmatter.commands.some((command) => command.path === "doctor")).toBe(true);
      expect(loaded.clispec.frontmatter.commands.find((command) => command.path === "about")!.description).toBe("Updated.");
      expect(loaded.clispec.frontmatter.specs).toEqual([{ id: "0001", title: "Change", status: "done" }]);
      expect(loaded.specs[0]!.spec.frontmatter).toMatchObject({ status: "done", closedAt: now.toISOString() });
      expect(checkSpec(loaded.clispec, { strict: true, specs: loaded.specs })).toMatchObject({ ok: true, errors: [], warnings: [] });
      expectConfig(() => closeSpec({ id: "0001", file: p.file, now }));
    } finally { p.done(); }
  });

  test("migrate moves a 1.0.0 checklist into specs/0001-baseline.md", () => {
    const p = project();
    try {
      const { specs: _specs, schemaVersion: _version, ...rest } = p.clispec;
      const legacy = `---\n${Bun.YAML.stringify({ schemaVersion: "1.0.0", ...rest, status: "in_progress" })}\n---\n\n## Purpose\n\nKept.\n\n## Audiences\n\nPeople.\n\n## Out of scope\n\nNothing.\n\n## Checklist\n\n- [x] Done item \`#termfy-cli\` {#a1b2}\n- [ ] Open item \`#termfy-tui\` {#c3d4}\n\n## Notes\n`;
      writeFileSync(p.file, legacy);
      const plan = migrateClispec({ file: p.file, now });
      expect(plan).toMatchObject({ needed: true, migrated: false, spec: { id: "0001", items: 2, status: "in_progress" } });
      expect(existsSync(join(p.dir, "specs"))).toBe(false);
      migrateClispec({ file: p.file, write: true, now });
      const loaded = loadProject(p.file)!;
      expect(loaded.clispec.legacy).toBeUndefined();
      expect(loaded.clispec.sections.Purpose).toBe("Kept.");
      expect(loaded.clispec.frontmatter.specs).toEqual([{ id: "0001", title: "Baseline", status: "in_progress" }]);
      const baseline = parseSpecFile(readFileSync(join(p.dir, "specs", "0001-baseline.md"), "utf8"));
      expect(baseline.tasks.map((item) => [item.id, item.done, item.skill])).toEqual([["a1b2", true, "termfy-cli"], ["c3d4", false, "termfy-tui"]]);
      expect(migrateClispec({ file: p.file })).toMatchObject({ needed: false });
      expect(checkSpec(loaded.clispec, { strict: true, specs: loaded.specs }).ok).toBe(true);
    } finally { p.done(); }
  });
});
