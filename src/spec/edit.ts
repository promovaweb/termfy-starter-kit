/**
 * Edits spec files without hand-written YAML or Markdown: lifecycle
 * status, new tasks and tests with generated IDs, and marking items done.
 *
 * Every operation re-parses the result before writing, so a refused edit
 * leaves the file untouched, and keeps the CLISPEC.md index in line with
 * the spec (status and `updatedAt`).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { error } from "../app/errors.ts";
import { findSpec, indexOf, loadProject, type LoadedSpec, type Project } from "./index.ts";
import { parseSpecFile, renderItem } from "./parse.ts";
import type { SpecFile, SpecStatus } from "./schema.ts";
import { renderFrontmatter, writeFrontmatter } from "./files.ts";
import { appendToSection, sectionRange } from "./markdown.ts";

/** Splits a Markdown file into front matter lines and body lines. */
function split(raw: string): { head: string[]; body: string[] } {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const end = lines.indexOf("---", 1);
  return { head: lines.slice(0, end + 1), body: lines.slice(end + 1) };
}

function save(project: Project, target: LoadedSpec, frontmatter: SpecFile, body: string[]): void {
  const content = `${renderFrontmatter(frontmatter)}${body.join("\n").replace(/^\n/, "")}`;
  const spec = parseSpecFile(content, target.file);
  writeFileSync(target.file, content);
  const specs = project.specs.map((entry) => entry === target ? { ...entry, spec } : entry);
  const clispec = project.clispec.frontmatter;
  const index = indexOf(specs);
  if (JSON.stringify(index) !== JSON.stringify(clispec.specs)) writeFrontmatter(project.file, { ...clispec, updatedAt: frontmatter.updatedAt, specs: index });
}

function open(id: string, file: string): { project: Project; target: LoadedSpec } {
  const project = loadProject(file, { required: true })!;
  return { project, target: findSpec(project.specs, id) };
}

const TRANSITIONS: Record<"in_progress" | "blocked" | "archived", readonly SpecStatus[]> = {
  in_progress: ["draft", "blocked"],
  blocked: ["draft", "in_progress"],
  archived: ["draft", "in_progress", "blocked"],
};

/** Moves a spec to in_progress, blocked or archived; `done` only comes from `spec close`. */
export function setStatus({ id, status, reason, file = "CLISPEC.md", now = new Date() }: { id: string; status: keyof typeof TRANSITIONS; reason?: string; file?: string; now?: Date }): { id: string; from: SpecStatus; to: SpecStatus } {
  const { project, target } = open(id, file);
  const current = target.spec.frontmatter;
  if (!TRANSITIONS[status].includes(current.status)) throw error.config(`Spec ${current.id} is ${current.status}; it cannot move to ${status}.`);
  if (status !== "in_progress" && !reason?.trim()) throw error.usage(`--reason is required to move a spec to ${status}.`);
  const { blockedReason: _blocked, archivedReason: _archived, ...rest } = current;
  const next: SpecFile = {
    ...rest, status, updatedAt: now.toISOString(),
    ...(status === "blocked" ? { blockedReason: reason!.trim() } : {}),
    ...(status === "archived" ? { archivedReason: reason!.trim() } : {}),
  };
  save(project, target, next, split(readFileSync(target.file, "utf8")).body);
  return { id: current.id, from: current.status, to: status };
}

function newItemId(taken: Set<string>): string {
  const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let attempt = 0; attempt < 1000; attempt++) {
    const id = Array.from(crypto.getRandomValues(new Uint8Array(4)), (byte) => alphabet[byte % alphabet.length]).join("");
    if (!taken.has(id)) return id;
  }
  throw error.config("Could not generate a free item ID.");
}

/** Appends a task or a test with a generated `{#id}` and returns the item. */
export function addItem({ id, section, text, skill, file = "CLISPEC.md", now = new Date() }: { id: string; section: "Tasks" | "Tests"; text: string; skill?: string; file?: string; now?: Date }): { id: string; item: string; section: "Tasks" | "Tests" } {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) throw error.usage("The item text must not be blank.");
  if (/\{#[^}]*\}/.test(clean)) throw error.usage("The item text must not contain {#...}.");
  if (skill !== undefined && !/^[a-z0-9-]+$/.test(skill)) throw error.usage("--tag takes a skill name such as termfy-cli.");
  const { project, target } = open(id, file);
  const { frontmatter, tasks, tests } = target.spec;
  if (frontmatter.status === "done" || frontmatter.status === "archived") throw error.config(`Spec ${frontmatter.id} is ${frontmatter.status}; open a new spec instead.`);
  const item = newItemId(new Set([...tasks, ...tests].map((entry) => entry.id)));
  const current = split(readFileSync(target.file, "utf8")).body;
  // The first real item replaces the example comment that `spec new` leaves in the section.
  const range = sectionRange(current, section);
  const cleaned = current.filter((line, index) => !(range && index > range.start && index < range.end && /^<!-- - \[ \] .* -->$/.test(line.trim())));
  const body = appendToSection(cleaned, section, renderItem({ id: item, text: clean, done: false, ...(skill ? { skill } : {}) }));
  save(project, target, { ...frontmatter, updatedAt: now.toISOString() }, body);
  return { id: frontmatter.id, item, section };
}

/** Marks (or, with `done: false`, unmarks) a task or test by its `{#id}`. */
export function markItem({ id, item, done = true, file = "CLISPEC.md", now = new Date() }: { id: string; item: string; done?: boolean; file?: string; now?: Date }): { id: string; item: string; done: boolean } {
  const { project, target } = open(id, file);
  const { frontmatter } = target.spec;
  if (frontmatter.status === "done" || frontmatter.status === "archived") throw error.config(`Spec ${frontmatter.id} is ${frontmatter.status}; its items are frozen.`);
  if (![...target.spec.tasks, ...target.spec.tests].some((entry) => entry.id === item)) throw error.config(`Spec ${frontmatter.id} has no item {#${item}}.`);
  const body = split(readFileSync(target.file, "utf8")).body;
  const ranges = ["Tasks", "Tests"].map((heading) => sectionRange(body, heading)!);
  const next = body.map((line, index) => {
    if (!ranges.some((range) => index > range.start && index < range.end)) return line;
    if (!new RegExp(`\\{#${item}\\}\\s*$`).test(line)) return line;
    return line.replace(/^(\s*-\s+)\[[ xX]\]/, `$1[${done ? "x" : " "}]`);
  });
  save(project, target, { ...frontmatter, updatedAt: now.toISOString() }, next);
  return { id: frontmatter.id, item, done };
}
