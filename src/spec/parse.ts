/** Parses embedded CLISPEC Markdown without interpreting examples as checklist items. */
import { error } from "../app/errors.ts";
import { specSchema, type Spec } from "./schema.ts";

const headings = ["Purpose", "Audiences", "Out of scope", "Checklist", "Notes"] as const;
export type SpecSection = (typeof headings)[number];

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  skill?: string;
}

export interface ParsedSpec {
  frontmatter: Spec;
  sections: Record<SpecSection, string>;
  checklist: ChecklistItem[];
  progress: { done: number; total: number; percent: number };
}

/** Reads YAML, fixed sections and checklist IDs, raising CONFIG for invalid specs. */
export function parseSpec(raw: string): ParsedSpec {
  const lines = raw.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").split("\n");
  if (lines[0] !== "---") throw error.config("CLISPEC.md must start with YAML front matter.");
  const end = lines.indexOf("---", 1);
  if (end < 0) throw error.config("CLISPEC.md front matter has no closing delimiter.");
  let yaml: unknown;
  try {
    yaml = Bun.YAML.parse(lines.slice(1, end).join("\n"));
  } catch {
    throw error.config("CLISPEC.md front matter contains invalid YAML.");
  }
  const result = specSchema.safeParse(yaml);
  if (!result.success) {
    throw error.config(`Invalid CLISPEC.md front matter: ${result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ")}`);
  }
  const sections: Record<SpecSection, string> = { Purpose: "", Audiences: "", "Out of scope": "", Checklist: "", Notes: "" };
  const checklist: ChecklistItem[] = [];
  const ids = new Set<string>();
  let current: SpecSection | undefined;
  let found = 0;
  let fence: { marker: string; length: number } | undefined;
  for (const line of lines.slice(end + 1)) {
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
      const title = line.startsWith("## ") ? line.slice(3) : "";
      if (headings.includes(title as SpecSection)) {
        if (title !== headings[found]) throw error.config(`Unexpected or repeated section: ${title}. Expected ${headings[found] ?? "no more fixed sections"}.`);
        current = title as SpecSection;
        found++;
      } else current = undefined;
      continue;
    }
    if (current) sections[current] += `${line}\n`;
    if (current !== "Checklist" || !/^\s*-\s+\[[ xX]\]/.test(line)) continue;
    const item = /^\s*- \[([ xX])\] (.+?)\s+\{#([a-z0-9]{4})\}\s*$/.exec(line);
    if (!item || /\{#[^}]*\}/.test(item[2]!)) throw error.config("Each checklist item must end with exactly one four-character {#id} using [a-z0-9].");
    const mark = item[1]!;
    const content = item[2]!;
    const id = item[3]!;
    if (ids.has(id)) throw error.config(`Repeated checklist ID: ${id}.`);
    ids.add(id);
    const tag = /\s+`#([a-z0-9-]+)`$/.exec(content);
    checklist.push({ id, text: tag ? content.slice(0, tag.index).trimEnd() : content, done: mark.toLowerCase() === "x", ...(tag ? { skill: tag[1]! } : {}) });
  }
  if (found !== headings.length) throw error.config(`Missing section: ${headings[found]}.`);
  for (const heading of headings) sections[heading] = sections[heading].trim();
  const done = checklist.filter((item) => item.done).length;
  const total = checklist.length;
  if (result.data.status === "done" && done !== total) throw error.config("Status done requires every checklist item to be complete.");
  return { frontmatter: result.data, sections, checklist, progress: { done, total, percent: total ? done / total * 100 : 0 } };
}
