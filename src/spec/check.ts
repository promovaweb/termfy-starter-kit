/**
 * Compares the CLISPEC contract with the executable registries and with
 * the spec files.
 *
 * Two layers:
 *
 * 1. `CLISPEC.md` against the code. The CLISPEC holds the delivered
 *    surface, so an entry it declares and the code lacks is an error, and a
 *    code entry it lacks is a warning.
 * 2. When spec files are given, each one against the CLISPEC. Open specs
 *    (draft, in_progress, blocked) must apply cleanly to the current
 *    surface; the index in `CLISPEC.md` must match the files.
 *
 * Work planned in an open spec is not a divergence: a code entry that an
 * open spec adds, or a CLISPEC entry that an open spec updates or removes,
 * goes to `pending` instead of `warnings` or `errors`.
 *
 * With `tables` (built from the migrations), `storage.tables` is compared
 * with the real schema. Open specs in progress must also name every
 * changed entry in a task or a test.
 */
import { ExitCode } from "../app/exit-codes.ts";
import { manifest } from "../app/manifest.ts";
import { root } from "../cli/commands.ts";
import { GLOBAL_OPTIONS, type Command, type OptionDefinition } from "../cli/registry.ts";
import { SETTINGS_SCHEMA } from "../config/settings.ts";
import { describeServer } from "../mcp/server.ts";
import { screens } from "../tui/screens/index.ts";
import { applyChanges, changeEntries, type EntryKind } from "./delta.ts";
import type { LoadedSpec } from "./index.ts";
import { isBlank, type ParsedClispec } from "./parse.ts";
import { clispecSchema, OPEN_STATUSES } from "./schema.ts";
import { compareTables, type ActualTable } from "./storage.ts";

export interface SpecCheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  /** Divergences explained by an open spec, as `kind key (spec NNNN)`. */
  pending: string[];
}

export interface CheckOptions {
  strict?: boolean;
  /** Spec files from disk; omitted when the project is not available. */
  specs?: readonly LoadedSpec[];
  /** Tables built by the migrations (see storage.ts); omitted when the binary has no database or runs compiled. */
  tables?: readonly ActualTable[];
}

/** Maps every command path of the registry to its command and the options it accepts. */
export function registryCommands(): { commands: Map<string, Command>; options: Map<string, readonly OptionDefinition[]> } {
  const commands = new Map<string, Command>();
  const options = new Map<string, readonly OptionDefinition[]>();
  const visit = (command: Command, parent: string, inherited: readonly OptionDefinition[]) => {
    const recursive = [...inherited, ...(command.options ?? []).filter((option) => option.recursive)];
    for (const child of command.subcommands ?? []) {
      const path = parent ? `${parent} ${child.name}` : child.name;
      commands.set(path, child);
      options.set(path, [...recursive, ...(child.options ?? [])]);
      visit(child, path, recursive);
    }
  };
  visit(root, "", GLOBAL_OPTIONS);
  return { commands, options };
}

/** Collects the keys touched by open specs: `kind:key` → spec IDs. */
function openChanges(specs: readonly LoadedSpec[] | undefined): Map<string, string[]> {
  const touched = new Map<string, string[]>();
  for (const { spec } of specs ?? []) {
    if (!OPEN_STATUSES.includes(spec.frontmatter.status)) continue;
    for (const entry of changeEntries(spec.frontmatter.changes)) {
      const id = `${entry.kind}:${entry.key}`;
      touched.set(id, [...(touched.get(id) ?? []), spec.frontmatter.id]);
    }
  }
  return touched;
}

/** Checks the CLISPEC against the code and, when given, the spec files against the CLISPEC. */
export function checkSpec(clispec: ParsedClispec, { strict = false, specs, tables }: CheckOptions = {}): SpecCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const pending: string[] = [];
  const parsed = clispecSchema.safeParse(clispec.frontmatter);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`), warnings, pending };
  const declared = parsed.data;
  const planned = openChanges(specs);
  const isPending = (kind: EntryKind, key: string) => {
    const ids = planned.get(`${kind}:${key}`);
    if (ids) pending.push(`${kind} ${key} (spec ${ids.join(", ")})`);
    return Boolean(ids);
  };

  if (clispec.legacy) warnings.push("CLISPEC.md uses schemaVersion 1.0.0; run spec migrate --write to move the checklist into specs/.");
  if (declared.bin !== manifest.bin) errors.push("Spec bin differs from package.json.");
  if (declared.description !== manifest.description) errors.push("Spec description differs from package.json.");

  const { commands, options } = registryCommands();
  const codes = new Set<number>(Object.values(ExitCode));
  for (const command of declared.commands) {
    const actual = commands.get(command.path);
    if (!actual) { if (!isPending("command", command.path)) errors.push(`Unknown command: ${command.path}.`); continue; }
    const mismatches: string[] = [];
    for (const option of command.options ?? []) {
      const match = options.get(command.path)?.find((entry) => entry.name === option.name || entry.aliases?.includes(option.name));
      if (!match) mismatches.push(`Unknown option ${option.name} on command ${command.path}.`);
      else if (option.argument !== undefined && option.argument !== match.argument?.name) mismatches.push(`Unknown option argument ${option.argument} for ${command.path} ${option.name}.`);
    }
    for (const argument of command.arguments ?? []) {
      if (!actual.arguments?.some((entry) => entry.name === argument.name)) mismatches.push(`Unknown argument ${argument.name} on command ${command.path}.`);
    }
    for (const code of command.exitCodes ?? []) {
      if (!codes.has(code) || ![ExitCode.SUCCESS, ExitCode.GENERIC_ERROR, ExitCode.USAGE, ...(actual.exitCodes ?? [])].includes(code as ExitCode)) mismatches.push(`Unknown exit code ${code} on command ${command.path}.`);
    }
    if (mismatches.length && !isPending("command", command.path)) errors.push(...mismatches);
  }
  for (const path of commands.keys()) {
    if (!declared.commands.some((command) => command.path === path) && !isPending("command", path)) warnings.push(`Command missing from spec: ${path}.`);
  }

  const catalog = describeServer();
  const compare = (kind: EntryKind, label: string, expected: string[], actual: string[], warn: boolean) => {
    for (const name of expected) if (!actual.includes(name) && !isPending(kind, name)) errors.push(`Unknown ${label}: ${name}.`);
    for (const name of actual) {
      if (expected.includes(name)) continue;
      if (isPending(kind, name)) continue;
      if (warn) warnings.push(`${label} missing from spec: ${name}.`);
    }
  };
  compare("screen", "Screen", declared.screens.map((screen) => screen.id), screens.map((screen) => screen.id), true);
  compare("tool", "Tool", declared.mcp.tools.map((tool) => tool.name), catalog.tools.map((tool) => tool.name), true);
  compare("resource", "Resource", declared.mcp.resources.map((resource) => resource.uri), catalog.resources.map((resource) => resource.uri), false);
  compare("prompt", "Prompt", declared.mcp.prompts.map((prompt) => prompt.name), catalog.prompts.map((prompt) => prompt.name), false);
  compare("setting", "Setting", declared.settings.map((setting) => setting.key), SETTINGS_SCHEMA.map((setting) => setting.key), true);
  for (const setting of declared.settings) {
    const actual = SETTINGS_SCHEMA.find((entry) => entry.key === setting.key);
    if (actual && actual.type !== setting.type && !isPending("setting", setting.key)) errors.push(`Setting type differs for ${setting.key}: expected ${actual.type}.`);
  }
  for (const credential of declared.credentials) {
    for (const name of credential.usedBy) {
      if (!commands.has(name) && !catalog.tools.some((tool) => tool.name === name)) errors.push(`Unknown credential consumer ${name} for ${credential.name}.`);
    }
  }
  const declaredCredentials = new Set(declared.credentials.map((credential) => credential.name));
  for (const command of declared.commands) {
    for (const name of command.credentials ?? []) {
      if (!declaredCredentials.has(name)) errors.push(`Command ${command.path} uses credential ${name} that is not declared in credentials.`);
    }
  }

  if (tables) {
    const storage = compareTables(declared.storage.tables, tables, (name) => isPending("table", name));
    errors.push(...storage.errors);
    warnings.push(...storage.warnings);
  } else if (declared.storage.tables.length && !clispec.legacy) {
    pending.push("storage not checked: run bun run spec:check from the source tree");
  }

  if (specs) checkSpecFiles(clispec, specs, errors, warnings);
  return { ok: errors.length === 0 && (!strict || warnings.length === 0), errors, warnings, pending: [...new Set(pending)] };
}

/** Checks the index, the change sets of open specs and conflicts between them. */
function checkSpecFiles(clispec: ParsedClispec, specs: readonly LoadedSpec[], errors: string[], warnings: string[]): void {
  const index = clispec.frontmatter.specs;
  for (const { spec, slug } of specs) {
    const { id, title, status, changes } = spec.frontmatter;
    const label = `Spec ${id} (${slug})`;
    const entry = index.find((item) => item.id === id);
    if (!entry) errors.push(`${label} is missing from the specs index of CLISPEC.md.`);
    else {
      if (entry.status !== status) errors.push(`${label} has status ${status}, but the CLISPEC.md index says ${entry.status}.`);
      if (entry.title !== title) errors.push(`${label} has title "${title}", but the CLISPEC.md index says "${entry.title}".`);
    }
    for (const item of spec.tasks) if (!item.skill) warnings.push(`${label}: task ${item.id} has no skill tag.`);
    if (status === "in_progress" || status === "blocked") {
      // Traceability: every entry the spec changes must be named by a task or a test.
      const texts = [...spec.tasks, ...spec.tests].map((item) => item.text);
      for (const change of changeEntries(changes)) {
        if (!texts.some((text) => text.includes(change.key))) warnings.push(`${label}: ${change.op} ${change.kind} ${change.key} is not named by any task or test.`);
      }
    }
    if (status === "in_progress") {
      for (const heading of ["Behavior", "Design"] as const) if (isBlank(spec.sections[heading])) warnings.push(`${label} is in progress without ${heading}.`);
    }
    if (!OPEN_STATUSES.includes(status)) continue;
    const applied = applyChanges(clispec.frontmatter, changes);
    for (const message of applied.errors) errors.push(`${label}: ${message}`);
    const consumers = new Set([...applied.surface.commands.map((command) => command.path), ...applied.surface.mcp.tools.map((tool) => tool.name)]);
    const credentials = new Set(applied.surface.credentials.map((credential) => credential.name));
    for (const credential of [...(changes.add?.credentials ?? []), ...(changes.update?.credentials ?? [])]) {
      for (const name of credential.usedBy) if (!consumers.has(name)) errors.push(`${label}: credential ${credential.name} is used by ${name}, which neither CLISPEC.md nor the spec declares.`);
    }
    for (const command of [...(changes.add?.commands ?? []), ...(changes.update?.commands ?? [])]) {
      for (const name of command.credentials ?? []) if (!credentials.has(name)) errors.push(`${label}: command ${command.path} uses credential ${name} that is not declared.`);
    }
  }
  for (const entry of index) {
    if (!specs.some(({ spec }) => spec.frontmatter.id === entry.id)) errors.push(`CLISPEC.md lists spec ${entry.id}, but specs/ has no ${entry.id}-*.md file.`);
  }
  const owners = new Map<string, string>();
  for (const { spec } of specs) {
    if (!OPEN_STATUSES.includes(spec.frontmatter.status)) continue;
    for (const change of changeEntries(spec.frontmatter.changes)) {
      const key = `${change.kind}:${change.key}`;
      const owner = owners.get(key);
      if (owner && owner !== spec.frontmatter.id) warnings.push(`${change.kind} ${change.key} is changed by open specs ${owner} and ${spec.frontmatter.id}; close one before the other.`);
      owners.set(key, spec.frontmatter.id);
    }
  }
}
