/** Spec editing commands, storage checks against migrations, traceability, closing notes and sync into a spec. */
import { describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AppError } from "../src/app/errors.ts";
import { checkSpec } from "../src/spec/check.ts";
import { addItem, markItem, setStatus } from "../src/spec/edit.ts";
import { closeSpec, createSpec, writeFrontmatter } from "../src/spec/files.ts";
import { loadProject } from "../src/spec/index.ts";
import { appendToSection, sectionRange } from "../src/spec/markdown.ts";
import { compareTables, loadMigrations, schemaFromMigrations } from "../src/spec/storage.ts";
import { addToSpec, computeSync } from "../src/spec/sync.ts";
import type { Clispec } from "../src/spec/schema.ts";
import { syncedClispec, tempProject } from "./support/clispec.ts";

const now = new Date("2026-11-10T15:00:00.000Z");

function project(): { dir: string; file: string; done: () => void } {
  return tempProject("termfy-spec-edit-");
}

const notes = [{ version: 1, name: "create_notes", up: "CREATE TABLE notes (id INTEGER PRIMARY KEY, title TEXT NOT NULL, body TEXT) STRICT;" }];
const notesTable: Clispec["storage"]["tables"][number] = {
  name: "notes",
  columns: [{ name: "id", type: "INTEGER", primaryKey: true }, { name: "title", type: "TEXT", notNull: true }, { name: "body", type: "TEXT" }],
};

describe("markdown sections", () => {
  test("finds sections outside fences and appends before trailing blanks", () => {
    const lines = ["## Tasks", "", "- [ ] A {#a1b2}", "", "```", "## Tests", "```", "## Tests", "", "## Notes"];
    expect(sectionRange(lines, "Tasks")).toEqual({ start: 0, end: 7 });
    expect(appendToSection(lines, "Notes", "- note")).toEqual([...lines, "", "- note", ""]);
    expect(appendToSection(["## Tests", "", "## Notes"], "Tests", "- [ ] T {#c3d4}")).toEqual(["## Tests", "", "- [ ] T {#c3d4}", "", "## Notes"]);
  });
});

describe("spec editing", () => {
  test("status moves keep the index in line and require reasons", () => {
    const p = project();
    try {
      createSpec({ slug: "orders", file: p.file, now });
      expect(setStatus({ id: "1", status: "in_progress", file: p.file, now })).toEqual({ id: "0001", from: "draft", to: "in_progress" });
      expect(() => setStatus({ id: "1", status: "blocked", file: p.file, now })).toThrow(AppError);
      setStatus({ id: "1", status: "blocked", reason: "Waiting for the API key.", file: p.file, now });
      const loaded = loadProject(p.file)!;
      expect(loaded.specs[0]!.spec.frontmatter).toMatchObject({ status: "blocked", blockedReason: "Waiting for the API key." });
      expect(loaded.clispec.frontmatter.specs[0]!.status).toBe("blocked");
      setStatus({ id: "1", status: "in_progress", file: p.file, now });
      expect(loadProject(p.file)!.specs[0]!.spec.frontmatter.blockedReason).toBeUndefined();
      setStatus({ id: "1", status: "archived", reason: "Dropped.", file: p.file, now });
      expect(() => setStatus({ id: "1", status: "in_progress", file: p.file, now })).toThrow(AppError);
    } finally { p.done(); }
  });

  test("tasks and tests get generated IDs and can be marked and unmarked", () => {
    const p = project();
    try {
      createSpec({ slug: "orders", file: p.file, now });
      const task = addItem({ id: "1", section: "Tasks", text: "Implement  orders list", skill: "termfy-cli", file: p.file, now });
      const check = addItem({ id: "1", section: "Tests", text: "orders list --json returns { count }", file: p.file, now });
      expect(task.item).toMatch(/^[a-z0-9]{4}$/);
      let spec = loadProject(p.file)!.specs[0]!.spec;
      expect(spec.tasks).toEqual([{ id: task.item, text: "Implement orders list", done: false, skill: "termfy-cli" }]);
      expect(spec.tests[0]!.id).toBe(check.item);
      expect(readFileSync(loadProject(p.file)!.specs[0]!.file, "utf8")).not.toContain("<!-- - [ ]");
      markItem({ id: "1", item: task.item, file: p.file, now });
      spec = loadProject(p.file)!.specs[0]!.spec;
      expect(spec.tasks[0]!.done).toBe(true);
      markItem({ id: "1", item: task.item, done: false, file: p.file, now });
      expect(loadProject(p.file)!.specs[0]!.spec.tasks[0]!.done).toBe(false);
      expect(() => markItem({ id: "1", item: "zzzz", file: p.file, now })).toThrow(AppError);
      expect(() => addItem({ id: "1", section: "Tasks", text: "Bad {#a1b2}", file: p.file, now })).toThrow(AppError);
    } finally { p.done(); }
  });
});

describe("storage", () => {
  test("reads tables and columns built by the migrations", () => {
    expect(schemaFromMigrations(notes)).toEqual([{ name: "notes", columns: [
      { name: "id", type: "INTEGER", primaryKey: true, notNull: false },
      { name: "title", type: "TEXT", primaryKey: false, notNull: true },
      { name: "body", type: "TEXT", primaryKey: false, notNull: false },
    ] }]);
  });

  test("compares declared tables with the migrations", () => {
    const actual = schemaFromMigrations(notes);
    expect(compareTables([notesTable], actual, () => false)).toEqual({ errors: [], warnings: [] });
    const wrong = compareTables([{ ...notesTable, columns: [{ name: "id", type: "TEXT", primaryKey: true }, { name: "missing", type: "TEXT" }] }, { name: "ghost", columns: [{ name: "id", type: "INTEGER" }] }], actual, () => false);
    expect(wrong.errors).toEqual(expect.arrayContaining([
      "Column notes.id is INTEGER in the migrations, not TEXT.",
      "Unknown column notes.missing.",
      "Unknown table: ghost; no migration creates it.",
    ]));
    expect(wrong.errors).toHaveLength(3);
    expect(compareTables([], actual, () => false).warnings).toEqual(["Table missing from spec: notes."]);
    expect(compareTables([], actual, (name) => name === "notes")).toEqual({ errors: [], warnings: [] });
  });

  test("loads the migration registry by path and checkSpec uses it", async () => {
    const dir = mkdtempSync(join(tmpdir(), "termfy-storage-"));
    try {
      const module = join(dir, "index.ts");
      writeFileSync(module, `export const migrations = ${JSON.stringify(notes)};`);
      expect(await loadMigrations(join(dir, "missing.ts"))).toBeUndefined();
      const tables = schemaFromMigrations((await loadMigrations(module))!);
      const spec = syncedClispec();
      expect(checkSpec(spec, { tables }).warnings).toContain("Table missing from spec: notes.");
      spec.frontmatter.storage.tables = [notesTable];
      expect(checkSpec(spec, { tables, strict: true }).ok).toBe(true);
      expect(checkSpec(spec).pending).toContain("storage not checked: run bun run spec:check from the source tree");
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("traceability, closing notes and sync into a spec", () => {
  test("an entry changed by a spec in progress must be named by a task or test", () => {
    const p = project();
    try {
      const doctor = syncedClispec().frontmatter.commands.find((command) => command.path === "doctor")!;
      const clispec = loadProject(p.file)!.clispec;
      writeFrontmatter(p.file, { ...clispec.frontmatter, commands: clispec.frontmatter.commands.filter((c) => c.path !== "doctor") });
      createSpec({ slug: "doctor", file: p.file, now });
      const loaded = loadProject(p.file)!;
      writeFrontmatter(loaded.specs[0]!.file, { ...loaded.specs[0]!.spec.frontmatter, changes: { add: { commands: [doctor] } } });
      setStatus({ id: "1", status: "in_progress", file: p.file, now });
      const warn = () => checkSpec(loadProject(p.file)!.clispec, { specs: loadProject(p.file)!.specs }).warnings;
      expect(warn()).toContain("Spec 0001 (doctor): add command doctor is not named by any task or test.");
      addItem({ id: "1", section: "Tasks", text: "Restore the doctor command", skill: "termfy-cli", file: p.file, now });
      expect(warn().some((message) => message.includes("not named"))).toBe(false);
    } finally { p.done(); }
  });

  test("close adds a dated line to the CLISPEC Notes", () => {
    const p = project();
    try {
      createSpec({ slug: "docs", title: "Docs pass", file: p.file, now });
      const spec = loadProject(p.file)!.specs[0]!;
      const raw = readFileSync(spec.file, "utf8")
        .replace(/## Goal\n\n.*\n/, "## Goal\n\nBetter docs.\n")
        .replace(/## Behavior\n\n.*\n/, "## Behavior\n\nNo change.\n")
        .replace(/## Design\n\n.*\n/, "## Design\n\nDocs only.\n");
      writeFileSync(spec.file, raw);
      const task = addItem({ id: "1", section: "Tasks", text: "Rewrite docs", skill: "termfy-docs", file: p.file, now });
      markItem({ id: "1", item: task.item, file: p.file, now });
      closeSpec({ id: "1", file: p.file, now });
      const clispec = loadProject(p.file)!.clispec;
      expect(clispec.sections.Notes.split("\n").at(-1)).toBe(`- ${now.toLocaleDateString("sv-SE")}: spec 0001 (Docs pass) closed.`);
    } finally { p.done(); }
  });

  test("sync --spec puts missing code entries into the changes of an open spec", () => {
    const p = project();
    try {
      const clispec = loadProject(p.file)!.clispec;
      writeFrontmatter(p.file, { ...clispec.frontmatter, commands: clispec.frontmatter.commands.filter((c) => c.path !== "doctor") });
      createSpec({ slug: "adopt", file: p.file, now });
      const loaded = loadProject(p.file)!;
      const additions = computeSync(loaded.clispec, loaded.specs);
      expect(additions.commands.map((c) => c.path)).toEqual(["doctor"]);
      const next = addToSpec(loaded.specs[0]!, additions, now);
      expect(next.changes.add?.commands?.map((c) => c.path)).toEqual(["doctor"]);
      writeFrontmatter(loaded.specs[0]!.file, next);
      expect(computeSync(loadProject(p.file)!.clispec, loadProject(p.file)!.specs).total).toBe(0);
    } finally { p.done(); }
  });
});

test("specs/ README.md is ignored by the loader", () => {
  const p = project();
  try {
    mkdirSync(join(p.dir, "specs"));
    writeFileSync(join(p.dir, "specs", "README.md"), "# Specs");
    expect(loadProject(p.file)!.specs).toEqual([]);
  } finally { p.done(); }
});
