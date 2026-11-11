/**
 * Applies a spec change set to the CLISPEC surface.
 *
 * A surface has eight kinds of entries, each identified by one key: command
 * `path`, screen `id`, tool `name`, resource `uri`, prompt `name`, setting
 * `key`, credential `name` and table `name`. A change set adds new entries, replaces
 * existing ones (`update`, full entry) or removes them by key. The function
 * never mutates its input and reports every conflict instead of stopping at
 * the first one, so `spec check` and `spec close` can list them all.
 */
import type { SpecChanges, Surface } from "./schema.ts";

export type EntryKind = "command" | "screen" | "tool" | "resource" | "prompt" | "setting" | "credential" | "table";
export type ChangeOp = "add" | "update" | "remove";

interface KindInfo {
  kind: EntryKind;
  /** Field in the change set's `remove` block. */
  removal: keyof NonNullable<SpecChanges["remove"]>;
  key: string;
  get(surface: Partial<Surface> | undefined): Array<Record<string, unknown>> | undefined;
  set(surface: Surface, entries: Array<Record<string, unknown>>): void;
}

/** One entry per kind, in the order used by reports. */
export const KINDS: readonly KindInfo[] = [
  { kind: "command", removal: "commands", key: "path", get: (s) => s?.commands, set: (s, e) => { s.commands = e as Surface["commands"]; } },
  { kind: "screen", removal: "screens", key: "id", get: (s) => s?.screens, set: (s, e) => { s.screens = e as Surface["screens"]; } },
  { kind: "tool", removal: "tools", key: "name", get: (s) => s?.mcp?.tools, set: (s, e) => { s.mcp.tools = e as Surface["mcp"]["tools"]; } },
  { kind: "resource", removal: "resources", key: "uri", get: (s) => s?.mcp?.resources, set: (s, e) => { s.mcp.resources = e as Surface["mcp"]["resources"]; } },
  { kind: "prompt", removal: "prompts", key: "name", get: (s) => s?.mcp?.prompts, set: (s, e) => { s.mcp.prompts = e as Surface["mcp"]["prompts"]; } },
  { kind: "setting", removal: "settings", key: "key", get: (s) => s?.settings, set: (s, e) => { s.settings = e as Surface["settings"]; } },
  { kind: "credential", removal: "credentials", key: "name", get: (s) => s?.credentials, set: (s, e) => { s.credentials = e as Surface["credentials"]; } },
  { kind: "table", removal: "tables", key: "name", get: (s) => s?.storage?.tables, set: (s, e) => { s.storage = { tables: e as Surface["storage"]["tables"] }; } },
] as const;

export interface ChangeEntry { op: ChangeOp; kind: EntryKind; key: string }

/** Lists every entry touched by a change set as `{ op, kind, key }`. */
export function changeEntries(changes: SpecChanges): ChangeEntry[] {
  const entries: ChangeEntry[] = [];
  for (const info of KINDS) {
    for (const op of ["add", "update"] as const) {
      // A change set's partial surface has the same shape as Surface, with optional lists.
      for (const entry of info.get(changes[op] as Partial<Surface> | undefined) ?? []) entries.push({ op, kind: info.kind, key: String(entry[info.key]) });
    }
    for (const key of changes.remove?.[info.removal] ?? []) entries.push({ op: "remove", kind: info.kind, key });
  }
  return entries;
}

/** Counts entries per operation, for summaries. */
export function changeCounts(changes: SpecChanges): Record<ChangeOp, number> {
  const counts: Record<ChangeOp, number> = { add: 0, update: 0, remove: 0 };
  for (const entry of changeEntries(changes)) counts[entry.op]++;
  return counts;
}

/** Deep copy of a surface, so callers can change the result freely. */
export function cloneSurface(surface: Surface): Surface {
  return structuredClone({ commands: surface.commands, screens: surface.screens, mcp: surface.mcp, settings: surface.settings, credentials: surface.credentials, storage: surface.storage ?? { tables: [] } });
}

/**
 * Returns the surface after the change set and the conflicts found:
 * adding an existing key, updating or removing a missing one, or touching
 * the same key twice in one change set.
 */
export function applyChanges(surface: Surface, changes: SpecChanges): { surface: Surface; errors: string[] } {
  const result = cloneSurface(surface);
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const entry of changeEntries(changes)) {
    const id = `${entry.kind}:${entry.key}`;
    if (seen.has(id)) errors.push(`${entry.kind} ${entry.key} appears more than once in the change set.`);
    seen.add(id);
  }
  for (const info of KINDS) {
    let list = [...(info.get(result) ?? [])];
    const has = (key: string) => list.some((entry) => entry[info.key] === key);
    for (const entry of info.get(changes.add as Partial<Surface> | undefined) ?? []) {
      const key = String(entry[info.key]);
      if (has(key)) errors.push(`add ${info.kind} ${key}: already in CLISPEC.md; use update.`);
      else list.push(structuredClone(entry));
    }
    for (const entry of info.get(changes.update as Partial<Surface> | undefined) ?? []) {
      const key = String(entry[info.key]);
      if (!has(key)) errors.push(`update ${info.kind} ${key}: not in CLISPEC.md; use add.`);
      else list = list.map((current) => current[info.key] === key ? structuredClone(entry) : current);
    }
    for (const key of changes.remove?.[info.removal] ?? []) {
      if (!has(key)) errors.push(`remove ${info.kind} ${key}: not in CLISPEC.md.`);
      else list = list.filter((current) => current[info.key] !== key);
    }
    info.set(result, list);
  }
  return { surface: result, errors };
}
