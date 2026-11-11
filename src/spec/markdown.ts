/**
 * Line-level helpers for the fixed `##` sections of CLISPEC documents.
 * Headings inside fenced code blocks are ignored, as in the parser.
 */
import { error } from "../app/errors.ts";

/**
 * Finds the line range of a `## heading` section, ignoring headings inside
 * fenced blocks. `end` is the index of the next heading or the line count.
 */
export function sectionRange(lines: readonly string[], heading: string): { start: number; end: number } | undefined {
  let fence: string | undefined;
  let start: number | undefined;
  for (const [index, line] of lines.entries()) {
    const boundary = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) { if (boundary && boundary[1]!.startsWith(fence)) fence = undefined; continue; }
    if (boundary) { fence = boundary[1]!; continue; }
    if (/^#{1,2} /.test(line)) {
      if (start !== undefined) return { start, end: index };
      if (line.trim() === `## ${heading}`) start = index;
    }
  }
  return start === undefined ? undefined : { start, end: lines.length };
}

/** Appends a line at the end of a section, before its trailing blank lines. */
export function appendToSection(lines: string[], heading: string, line: string): string[] {
  const range = sectionRange(lines, heading);
  if (!range) throw error.config(`Section ${heading} not found.`);
  let at = range.end;
  while (at > range.start + 1 && lines[at - 1]!.trim() === "") at--;
  const before = lines.slice(0, at);
  // Keep one blank line between the heading and the first entry.
  if (at === range.start + 1) before.push("");
  return [...before, line, ...(range.end === lines.length ? [""] : ["", ...lines.slice(range.end)])];
}

