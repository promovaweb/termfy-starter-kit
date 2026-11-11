/**
 * Test fixtures for the CLISPEC contract that hold in any project derived
 * from the starter kit.
 *
 * The shipped CLISPEC.md lags behind the code while a spec is open (that is
 * the point of `pending`), so tests that need "a CLISPEC equal to the code"
 * build one: the embedded CLISPEC plus every code entry `spec sync` would
 * add, with no specs and no tables. Tests about the project's own specs
 * read them from disk instead of assuming the template's history.
 */
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderClispec } from "../../src/spec/files.ts";
import { loadProject, loadSpec } from "../../src/spec/index.ts";
import type { ParsedClispec } from "../../src/spec/parse.ts";
import { computeSync, mergedFrontmatter } from "../../src/spec/sync.ts";

export const projectRoot = join(import.meta.dir, "../..");

/** The project as found on disk (CLISPEC.md and specs/). */
export function repositoryProject() {
  return loadProject(join(projectRoot, "CLISPEC.md"))!;
}

/** A parsed CLISPEC that declares exactly what the code has, without specs or tables. */
export function syncedClispec(): ParsedClispec {
  const shipped = loadSpec();
  const base: ParsedClispec = { ...shipped, frontmatter: { ...shipped.frontmatter, specs: [], storage: { tables: [] } } };
  const frontmatter = mergedFrontmatter(base, computeSync(base), new Date("2026-11-10T12:00:00.000Z"), []);
  return { ...base, frontmatter: { ...frontmatter, specs: [], storage: { tables: [] } } };
}

/** Writes `syncedClispec()` to a temporary folder; call `done()` to remove it. */
export function tempProject(prefix = "termfy-spec-"): { dir: string; file: string; done: () => void } {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  const file = join(dir, "CLISPEC.md");
  const clispec = syncedClispec();
  writeFileSync(file, renderClispec(clispec.frontmatter, clispec.sections));
  return { dir, file, done: () => rmSync(dir, { recursive: true, force: true }) };
}
