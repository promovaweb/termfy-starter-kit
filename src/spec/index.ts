/**
 * Loads the CLISPEC contract.
 *
 * `CLISPEC.md` is embedded at build time, so the compiled binary always
 * knows its own identity, surface and spec index, whatever the working
 * directory. The spec files under `specs/` are development records: they
 * are read from disk, and only when the working directory holds the
 * project (a `CLISPEC.md` whose `bin` matches this binary). Elsewhere the
 * index in the embedded CLISPEC is the only view of the specs.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import embedded from "../../CLISPEC.md" with { type: "text" };
import { manifest } from "../app/manifest.ts";
import { error } from "../app/errors.ts";
import { parseClispec, parseSpecFile, type ParsedClispec, type ParsedSpecFile } from "./parse.ts";
import type { SpecIndexEntry } from "./schema.ts";

/** Spec file names: four-digit ID, kebab-case slug, `.md`. */
export const SPEC_FILE = /^(\d{4})-([a-z0-9][a-z0-9-]*)\.md$/;

export interface LoadedSpec {
  /** Path of the file on disk. */
  file: string;
  /** Slug taken from the file name. */
  slug: string;
  spec: ParsedSpecFile;
}

export interface Project {
  /** `CLISPEC.md` path on disk. */
  file: string;
  /** `specs/` path next to it (may not exist yet). */
  dir: string;
  clispec: ParsedClispec;
  specs: LoadedSpec[];
}

/** Returns a freshly parsed copy of the embedded `CLISPEC.md`. */
export function loadSpec(): ParsedClispec {
  return parseClispec(embedded);
}

/** Reads every spec file of a directory, sorted by ID. A missing directory yields an empty list. */
export function loadSpecFiles(dir: string): LoadedSpec[] {
  if (!existsSync(dir)) return [];
  const specs: LoadedSpec[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md") || name === "README.md") continue;
    const match = SPEC_FILE.exec(name);
    if (!match) throw error.config(`specs/${name}: spec files are named NNNN-slug.md, such as 0002-orders-export.md.`);
    const file = join(dir, name);
    const spec = parseSpecFile(readFileSync(file, "utf8"), `specs/${name}`);
    if (spec.frontmatter.id !== match[1]) throw error.config(`specs/${name}: front matter id ${spec.frontmatter.id} differs from the file name.`);
    specs.push({ file, slug: match[2]!, spec });
  }
  const ids = new Set<string>();
  for (const { spec, file } of specs) {
    if (ids.has(spec.frontmatter.id)) throw error.config(`${file}: repeated spec ID ${spec.frontmatter.id}.`);
    ids.add(spec.frontmatter.id);
  }
  return specs;
}

/**
 * Loads `CLISPEC.md` and `specs/` from disk when `file` exists and belongs
 * to this binary; returns `undefined` otherwise. `required` turns the
 * absence into a CONFIG error, for commands that write files.
 */
export function loadProject(file = "CLISPEC.md", { required = false }: { required?: boolean } = {}): Project | undefined {
  const path = resolve(file);
  if (!existsSync(path)) {
    if (required) throw error.config(`${file} not found; run this command from the project root or pass --file.`);
    return undefined;
  }
  const clispec = parseClispec(readFileSync(path, "utf8"), file);
  if (clispec.frontmatter.bin !== manifest.bin) {
    if (required) throw error.config(`${file} belongs to ${clispec.frontmatter.bin}, not ${manifest.bin}.`);
    return undefined;
  }
  const dir = join(path, "..", "specs");
  return { file: path, dir, clispec, specs: loadSpecFiles(dir) };
}

/** Finds a spec by ID (`2`, `02` or `0002`), raising CONFIG when it does not exist. */
export function findSpec(specs: readonly LoadedSpec[], id: string): LoadedSpec {
  const normalized = /^\d{1,4}$/.test(id) ? id.padStart(4, "0") : id;
  const found = specs.find((entry) => entry.spec.frontmatter.id === normalized);
  if (!found) throw error.config(`Spec ${id} not found in specs/.`);
  return found;
}

/** Builds the CLISPEC index entries from the spec files, in ID order. */
export function indexOf(specs: readonly LoadedSpec[]): SpecIndexEntry[] {
  return specs.map(({ spec }) => ({ id: spec.frontmatter.id, title: spec.frontmatter.title, status: spec.frontmatter.status }));
}
