/**
 * Write operations on the CLISPEC contract: rewrite a front matter keeping
 * the body, create a spec, close a spec into the CLISPEC and migrate a
 * 1.0.0 CLISPEC.
 *
 * Every operation computes the new content first and writes only after
 * every check passed, so a refused operation leaves the files untouched.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { error } from "../app/errors.ts";
import { checkSpec, type SpecCheckResult } from "./check.ts";
import { applyChanges } from "./delta.ts";
import { findSpec, indexOf, loadProject, type Project } from "./index.ts";
import { CLISPEC_SECTIONS, isBlank, renderItem, REQUIRED_TO_CLOSE, type ParsedClispec } from "./parse.ts";
import type { Clispec, SpecFile } from "./schema.ts";
import { appendToSection } from "./markdown.ts";
import type { ActualTable } from "./storage.ts";
import { compact, emitYaml } from "./yaml.ts";

/** Serializes a front matter in block-style YAML between `---` delimiters. */
export function renderFrontmatter(frontmatter: object): string {
  return `---\n${emitYaml(compact(frontmatter)).join("\n")}\n---\n`;
}

/** Rewrites the front matter of a Markdown file, keeping the body intact. */
export function writeFrontmatter(file: string, frontmatter: object): void {
  const lines = readFileSync(file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end < 0) throw error.config(`${file} has no front matter to rewrite.`);
  const body = lines.slice(end + 1).join("\n");
  writeFileSync(file, `${renderFrontmatter(frontmatter)}${body.startsWith("\n") ? body.slice(1) : body}`);
}

function nextId(project: Project): string {
  const ids = [...project.specs.map(({ spec }) => Number(spec.frontmatter.id)), ...project.clispec.frontmatter.specs.map((entry) => Number(entry.id))];
  const next = (ids.length ? Math.max(...ids) : 0) + 1;
  if (next > 9999) throw error.config("Spec IDs are exhausted (9999).");
  return String(next).padStart(4, "0");
}

function titleFromSlug(slug: string): string {
  const words = slug.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Renders a spec file from its front matter and body parts. */
export function renderSpecFile(frontmatter: SpecFile, parts: { goal: string; behavior?: string; design?: string; tasks?: string[]; tests?: string[]; notes?: string }): string {
  const text = (value: string | undefined) => (value ? `${value}\n\n` : "");
  const block = (lines: string[] | undefined) => (lines?.length ? `${lines.join("\n")}\n\n` : "");
  return `${renderFrontmatter(frontmatter)}\n## Goal\n\n${text(parts.goal)}## Behavior\n\n${text(parts.behavior)}## Design\n\n${text(parts.design)}## Tasks\n\n${block(parts.tasks)}## Tests\n\n${block(parts.tests)}## Notes\n${parts.notes ? `\n${parts.notes}\n` : ""}`;
}

/** Guidance written into new specs as HTML comments; blank for `spec close`. */
export const SPEC_TEMPLATE = {
  goal: "<!-- The change, who needs it and what stays out of this spec. -->",
  behavior: "<!-- How the binary works after the change: flows, arguments and flags, text and --json output, errors and exit codes, TUI keys, MCP tool input and output. -->",
  design: "<!-- How the code is built: files and layers touched, functions shared by CLI, MCP and TUI, dependencies, error handling, starter kit patterns to follow. -->",
  tasks: ["<!-- - [ ] Implement orders list `#termfy-cli` {#a1b2} -->"],
  tests: ["<!-- - [ ] orders list --json returns { count, orders[] } {#c3d4} -->"],
};

export interface NewSpecResult { id: string; file: string; title: string }

/** Creates `specs/NNNN-slug.md` as a draft and adds it to the CLISPEC index. */
export function createSpec({ slug, title, file = "CLISPEC.md", now = new Date() }: { slug: string; title?: string; file?: string; now?: Date }): NewSpecResult {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw error.usage("The slug uses lowercase letters, digits and hyphens, such as orders-export.");
  const project = loadProject(file, { required: true })!;
  const id = nextId(project);
  const path = join(project.dir, `${id}-${slug}.md`);
  const timestamp = now.toISOString();
  const name = title?.trim() || titleFromSlug(slug);
  const frontmatter: SpecFile = { schemaVersion: "2.0.0", id, title: name, status: "draft", createdAt: timestamp, updatedAt: timestamp, changes: {} };
  mkdirSync(project.dir, { recursive: true });
  writeFileSync(path, renderSpecFile(frontmatter, SPEC_TEMPLATE), { flag: "wx" });
  const clispec = project.clispec.frontmatter;
  writeFrontmatter(project.file, { ...clispec, updatedAt: timestamp, specs: [...clispec.specs, { id, title: name, status: "draft" }] });
  return { id, file: path, title: name };
}

export interface CloseSpecResult { id: string; file: string; check: SpecCheckResult }

/**
 * Closes a spec: requires every task and test done, applies its change set
 * to the CLISPEC surface, marks it done with `closedAt` and updates the
 * index, and adds a dated line to the CLISPEC `## Notes`. Refuses (CONFIG)
 * when the change set conflicts or when the resulting CLISPEC fails
 * `spec check` against the code (and the migrations, given `tables`).
 */
export function closeSpec({ id, file = "CLISPEC.md", now = new Date(), tables }: { id: string; file?: string; now?: Date; tables?: readonly ActualTable[] }): CloseSpecResult {
  const project = loadProject(file, { required: true })!;
  if (project.clispec.legacy) throw error.config("CLISPEC.md uses schemaVersion 1.0.0; run spec migrate --write first.");
  const target = findSpec(project.specs, id);
  const { frontmatter } = target.spec;
  if (frontmatter.status === "done" || frontmatter.status === "archived") throw error.config(`Spec ${frontmatter.id} is already ${frontmatter.status}.`);
  if (frontmatter.status === "blocked") throw error.config(`Spec ${frontmatter.id} is blocked: ${frontmatter.blockedReason}. Change its status before closing.`);
  const blank = REQUIRED_TO_CLOSE.filter((heading) => isBlank(target.spec.sections[heading]));
  if (blank.length) throw error.config(`Spec ${frontmatter.id} needs ${blank.join(", ")} before closing: say how the binary works and how the code is built.`);
  if (!target.spec.tasks.length) throw error.config(`Spec ${frontmatter.id} has no tasks.`);
  const open = [...target.spec.tasks, ...target.spec.tests].filter((item) => !item.done);
  if (open.length) throw error.config(`Spec ${frontmatter.id} has ${open.length} pending item(s): ${open.map((item) => item.id).join(", ")}.`);
  const applied = applyChanges(project.clispec.frontmatter, frontmatter.changes);
  if (applied.errors.length) throw error.config(`Spec ${frontmatter.id} does not apply to CLISPEC.md: ${applied.errors.join(" ")}`);
  const timestamp = now.toISOString();
  const closed: SpecFile = { ...frontmatter, status: "done", updatedAt: timestamp, closedAt: timestamp };
  const specs = project.specs.map((entry) => entry === target ? { ...entry, spec: { ...entry.spec, frontmatter: closed } } : entry);
  const clispec: Clispec = { ...project.clispec.frontmatter, ...applied.surface, updatedAt: timestamp, specs: indexOf(specs) };
  const check = checkSpec({ ...project.clispec, frontmatter: clispec }, { specs, ...(tables ? { tables } : {}) });
  if (!check.ok) throw error.config(`Closing spec ${frontmatter.id} leaves CLISPEC.md out of line with the code: ${check.errors.join(" ")}`);
  writeFrontmatter(target.file, closed);
  writeFrontmatter(project.file, clispec);
  // Record the closing in the macro view, so CLISPEC.md keeps its own history.
  const lines = readFileSync(project.file, "utf8").replace(/\r\n/g, "\n").split("\n");
  const end = lines.indexOf("---", 1);
  const body = appendToSection(lines.slice(end + 1), "Notes", `- ${now.toLocaleDateString("sv-SE")}: spec ${frontmatter.id} (${frontmatter.title}) closed.`);
  writeFileSync(project.file, [...lines.slice(0, end + 1), ...body].join("\n"));
  return { id: frontmatter.id, file: target.file, check };
}

/** Renders `CLISPEC.md` from its front matter and fixed sections. */
export function renderClispec(frontmatter: Clispec, sections: ParsedClispec["sections"]): string {
  return `${renderFrontmatter(frontmatter)}${CLISPEC_SECTIONS.map((heading) => `\n## ${heading}\n${sections[heading] ? `\n${sections[heading]}\n` : ""}`).join("")}`;
}

export interface MigrateResult {
  /** False when the file already uses schemaVersion 2.0.0. */
  needed: boolean;
  migrated: boolean;
  file: string;
  /** Spec created from the legacy checklist, when it had items. */
  spec?: { id: string; file: string; items: number; status: SpecFile["status"] };
}

/**
 * Converts a 1.0.0 `CLISPEC.md` to 2.0.0: drops `status` and the
 * `Checklist` section, and moves the checklist into `specs/NNNN-baseline.md`
 * with the old status. With `write: false`, only reports what would change.
 */
export function migrateClispec({ file = "CLISPEC.md", write = false, now = new Date() }: { file?: string; write?: boolean; now?: Date } = {}): MigrateResult {
  const project = loadProject(file, { required: true })!;
  const { legacy } = project.clispec;
  if (!legacy) return { needed: false, migrated: false, file: project.file };
  const timestamp = now.toISOString();
  const frontmatter: Clispec = { ...project.clispec.frontmatter, updatedAt: timestamp };
  let spec: MigrateResult["spec"];
  let content: string | undefined;
  if (legacy.checklist.length) {
    const id = nextId(project);
    const path = join(project.dir, `${id}-baseline.md`);
    const status = legacy.status;
    const specFrontmatter: SpecFile = {
      schemaVersion: "2.0.0", id, title: "Baseline", status,
      createdAt: project.clispec.frontmatter.createdAt, updatedAt: timestamp,
      ...(status === "done" ? { closedAt: timestamp } : {}),
      ...(legacy.blockedReason ? { blockedReason: legacy.blockedReason } : {}),
      ...(legacy.archivedReason ? { archivedReason: legacy.archivedReason } : {}),
      changes: {},
    };
    content = renderSpecFile(specFrontmatter, {
      goal: "Checklist moved from CLISPEC.md (schemaVersion 1.0.0).",
      behavior: "The surface this checklist delivered is described in CLISPEC.md.",
      design: "Built before specs existed; see docs/architecture.md for the layers.",
      tasks: legacy.checklist.map(renderItem),
      notes: `- ${now.toLocaleDateString("sv-SE")}: created by spec migrate.`,
    });
    frontmatter.specs = [...frontmatter.specs, { id, title: "Baseline", status }];
    spec = { id, file: path, items: legacy.checklist.length, status };
  }
  if (write) {
    if (spec && content) {
      mkdirSync(project.dir, { recursive: true });
      writeFileSync(spec.file, content, { flag: "wx" });
    }
    writeFileSync(project.file, renderClispec(frontmatter, project.clispec.sections));
  }
  return { needed: true, migrated: write, file: project.file, ...(spec ? { spec } : {}) };
}
