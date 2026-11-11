/**
 * Parses CLISPEC Markdown documents without interpreting fenced examples.
 *
 * `parseClispec` reads `CLISPEC.md` (schemaVersion 2.0.0, or 1.0.0 converted
 * in memory with the legacy checklist kept for `spec migrate`).
 * `parseSpecFile` reads one `specs/NNNN-slug.md`. Both share the same
 * document reader: YAML front matter, fixed `##` sections in a fixed order
 * and GFM checklists whose items end with a four-character `{#id}`.
 */
import type { z } from "zod";
import { error } from "../app/errors.ts";
import {
  clispecSchema, clispecV1Schema, specFileSchema,
  type Clispec, type ClispecV1, type SpecFile,
} from "./schema.ts";

export const CLISPEC_SECTIONS = ["Purpose", "Audiences", "Out of scope", "Notes"] as const;
/**
 * Spec sections. `Behavior` says how the binary works after the change
 * (flows, inputs, text and JSON output, errors, keys, tool calls); `Design`
 * says how the code is built (files, layers, shared functions,
 * dependencies, error handling). Both may stay blank in a draft and are
 * required to close the spec.
 */
export const SPEC_SECTIONS = ["Goal", "Behavior", "Design", "Tasks", "Tests", "Notes"] as const;

/** Sections a spec needs, beyond its checklists, before `spec close`. */
export const REQUIRED_TO_CLOSE = ["Goal", "Behavior", "Design"] as const;
const LEGACY_SECTIONS = ["Purpose", "Audiences", "Out of scope", "Checklist", "Notes"] as const;

export type ClispecSection = (typeof CLISPEC_SECTIONS)[number];
export type SpecSection = (typeof SPEC_SECTIONS)[number];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  skill?: string;
}

export interface Progress { done: number; total: number; percent: number }

/** Data kept from a 1.0.0 CLISPEC so `spec migrate` can move it into a spec. */
export interface LegacyClispec {
  status: ClispecV1["status"];
  blockedReason?: string;
  archivedReason?: string;
  checklist: ChecklistItem[];
}

export interface ParsedClispec {
  frontmatter: Clispec;
  sections: Record<ClispecSection, string>;
  /** Present only when the source used schemaVersion 1.0.0. */
  legacy?: LegacyClispec;
}

export interface ParsedSpecFile {
  frontmatter: SpecFile;
  sections: Record<SpecSection, string>;
  tasks: ChecklistItem[];
  tests: ChecklistItem[];
  progress: Progress;
}

interface RawDocument {
  yaml: Record<string, unknown>;
  sections: Record<string, string>;
  items: Record<string, ChecklistItem[]>;
}

function readFrontmatter(raw: string, label: string): { yaml: Record<string, unknown>; body: string[] } {
  const lines = raw.replace(/^﻿/, "").replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") throw error.config(`${label} must start with YAML front matter.`);
  const end = lines.indexOf("---", 1);
  if (end < 0) throw error.config(`${label} front matter has no closing delimiter.`);
  let yaml: unknown;
  try {
    yaml = Bun.YAML.parse(lines.slice(1, end).join("\n"));
  } catch {
    throw error.config(`${label} front matter contains invalid YAML.`);
  }
  if (typeof yaml !== "object" || yaml === null || Array.isArray(yaml)) throw error.config(`${label} front matter must be a YAML mapping.`);
  return { yaml: yaml as Record<string, unknown>, body: lines.slice(end + 1) };
}

/** Reads fixed sections and the checklists of the named sections. IDs are unique across the document. */
function readBody(body: string[], label: string, headings: readonly string[], checklists: readonly string[], forbidden: readonly string[] = []): Omit<RawDocument, "yaml"> {
  const sections: Record<string, string> = Object.fromEntries(headings.map((heading) => [heading, ""]));
  const items: Record<string, ChecklistItem[]> = Object.fromEntries(checklists.map((heading) => [heading, []]));
  const ids = new Set<string>();
  let current: string | undefined;
  let found = 0;
  let fence: { marker: string; length: number } | undefined;
  for (const line of body) {
    const boundary = /^ {0,3}(`{3,}|~{3,})(.*)$/.exec(line);
    if (fence) {
      if (current) sections[current] += `${line}\n`;
      if (boundary && boundary[1]![0] === fence.marker && boundary[1]!.length >= fence.length && !boundary[2]!.trim()) fence = undefined;
      continue;
    }
    if (boundary) {
      fence = { marker: boundary[1]![0]!, length: boundary[1]!.length };
      if (current) sections[current] += `${line}\n`;
      continue;
    }
    if (/^#{1,2} /.test(line)) {
      const title = line.startsWith("## ") ? line.slice(3).trim() : "";
      if (forbidden.includes(title)) throw error.config(`${label} must not have a ${title} section; pending work lives in specs/.`);
      if (headings.includes(title)) {
        if (title !== headings[found]) throw error.config(`${label}: unexpected or repeated section ${title}. Expected ${headings[found] ?? "no more fixed sections"}.`);
        current = title;
        found++;
      } else current = undefined;
      continue;
    }
    if (current) sections[current] += `${line}\n`;
    if (!current || !checklists.includes(current) || !/^\s*(?:[-+*]|\d+[.)])\s+\[/.test(line)) continue;
    const item = /^\s*-\s+\[([ xX])\]\s+(\S.*?)\s+\{#([a-z0-9]{4})\}\s*$/.exec(line);
    if (!item || /\{#[^}]*\}/.test(item[2]!)) throw error.config(`${label}: use - [ ] text {#id} or - [x] text {#id}; each item must end with exactly one four-character ID using [a-z0-9].`);
    const [, mark, content, id] = item as unknown as [string, string, string, string];
    if (ids.has(id)) throw error.config(`${label}: repeated checklist ID ${id}.`);
    ids.add(id);
    const tag = /(?:^|\s+)`#([a-z0-9-]+)`$/.exec(content);
    const text = tag ? content.slice(0, tag.index).trimEnd() : content;
    if (!text) throw error.config(`${label}: each checklist item must have text before its skill tag and ID.`);
    items[current]!.push({ id, text, done: mark.toLowerCase() === "x", ...(tag ? { skill: tag[1]! } : {}) });
  }
  if (found !== headings.length) throw error.config(`${label}: missing section ${headings[found]}.`);
  for (const heading of headings) sections[heading] = sections[heading]!.trim();
  return { sections, items };
}

function validate<T>(schema: z.ZodType<T>, yaml: unknown, label: string): T {
  const result = schema.safeParse(yaml);
  if (!result.success) {
    throw error.config(`Invalid ${label} front matter: ${result.error.issues.map((issue) => `${issue.path.map(String).join(".")}: ${issue.message}`).join("; ")}`);
  }
  return result.data;
}

/** Computes `{ done, total, percent }`; percent is zero for an empty list. */
export function progressOf(items: readonly ChecklistItem[]): Progress {
  const done = items.filter((item) => item.done).length;
  const total = items.length;
  return { done, total, percent: total ? done / total * 100 : 0 };
}

/** Reads `CLISPEC.md`, converting a 1.0.0 document in memory. Raises CONFIG when invalid. */
export function parseClispec(raw: string, label = "CLISPEC.md"): ParsedClispec {
  const { yaml, body } = readFrontmatter(raw, label);
  if (yaml.schemaVersion === "1.0.0") {
    const v1 = validate<ClispecV1>(clispecV1Schema, yaml, label);
    const { sections, items } = readBody(body, label, LEGACY_SECTIONS, ["Checklist"]);
    const checklist = items.Checklist!;
    if (v1.status === "done" && checklist.some((item) => !item.done)) throw error.config(`${label}: status done requires every checklist item to be complete.`);
    const { status, blockedReason, archivedReason, schemaVersion: _version, ...rest } = v1;
    return {
      frontmatter: { schemaVersion: "2.0.0", ...rest, specs: [] },
      sections: { Purpose: sections.Purpose!, Audiences: sections.Audiences!, "Out of scope": sections["Out of scope"]!, Notes: sections.Notes! },
      legacy: { status, checklist, ...(blockedReason ? { blockedReason } : {}), ...(archivedReason ? { archivedReason } : {}) },
    };
  }
  const frontmatter = validate<Clispec>(clispecSchema, yaml, label);
  const { sections } = readBody(body, label, CLISPEC_SECTIONS, [], ["Checklist", "Tasks"]);
  return { frontmatter, sections: sections as Record<ClispecSection, string> };
}

/** Reads one `specs/NNNN-slug.md`. Raises CONFIG when invalid or when `done` has pending items. */
export function parseSpecFile(raw: string, label = "spec"): ParsedSpecFile {
  const { yaml, body } = readFrontmatter(raw, label);
  const frontmatter = validate<SpecFile>(specFileSchema, yaml, label);
  const { sections, items } = readBody(body, label, SPEC_SECTIONS, ["Tasks", "Tests"]);
  const tasks = items.Tasks!;
  const tests = items.Tests!;
  const progress = progressOf([...tasks, ...tests]);
  if (frontmatter.status === "done" && progress.done !== progress.total) throw error.config(`${label}: status done requires every task and test to be complete.`);
  return { frontmatter, sections: sections as Record<SpecSection, string>, tasks, tests, progress };
}

/** True when a section has no text besides HTML comments (template guidance). */
export function isBlank(markdown: string): boolean {
  return markdown.replace(/<!--[^]*?-->/g, "").trim().length === 0;
}

/** Renders one checklist line in the canonical form. */
export function renderItem(item: ChecklistItem): string {
  return `- [${item.done ? "x" : " "}] ${item.text}${item.skill ? ` \`#${item.skill}\`` : ""} {#${item.id}}`;
}
