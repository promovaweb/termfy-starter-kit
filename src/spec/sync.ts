/**
 * Brings the spec front matter up to date with the code.
 *
 * `spec check` tells what the spec declares and the code lacks, or the other
 * way round. `spec sync` goes one step further for the second case: it
 * builds the entries the code has and the spec does not (commands with
 * their arguments, options and exit codes; screens; MCP tools, resources
 * and prompts; settings) and, with `write`, re-emits the front matter with
 * those entries appended. Existing entries and the Markdown body are kept
 * as they are. The result is a draft for the person to review: effects of
 * tools default to `read`, descriptions come from the registry.
 *
 * Entries that an open spec already plans to add are left out, so closing
 * that spec does not find them twice. With the spec files at hand, the
 * merged front matter also refreshes the spec index from the files.
 */
import { manifest } from "../app/manifest.ts";
import { root } from "../cli/commands.ts";
import type { Command, OptionDefinition } from "../cli/registry.ts";
import { SETTINGS_SCHEMA } from "../config/settings.ts";
import { describeServer } from "../mcp/server.ts";
import { screens } from "../tui/screens/index.ts";
import { changeEntries } from "./delta.ts";
import { indexOf, type LoadedSpec } from "./index.ts";
import type { ParsedClispec } from "./parse.ts";
import { error } from "../app/errors.ts";
import { OPEN_STATUSES, type Clispec, type SpecCommand, type SpecFile, type SpecScreen, type SpecSetting } from "./schema.ts";

export interface SpecSyncResult {
  commands: SpecCommand[];
  screens: SpecScreen[];
  tools: Clispec["mcp"]["tools"];
  resources: Clispec["mcp"]["resources"];
  prompts: Clispec["mcp"]["prompts"];
  settings: SpecSetting[];
  total: number;
}

function commandEntry(path: string, command: Command, options: readonly OptionDefinition[]): SpecCommand {
  return {
    path,
    description: command.description,
    ...(command.arguments?.length
      ? { arguments: command.arguments.map((a) => ({ name: a.name, ...(a.required ? { required: true } : {}), ...(a.variadic ? { variadic: true } : {}), ...(a.values ? { values: [...a.values] } : {}) })) }
      : {}),
    ...(options.length
      ? { options: options.map((o) => ({ name: o.name, ...(o.argument ? { argument: o.argument.name } : {}), ...(o.argument?.values ? { values: [...o.argument.values] } : {}), ...(o.default !== undefined ? { default: o.default } : {}), description: o.description })) }
      : {}),
    ...(command.exitCodes?.length ? { exitCodes: [...command.exitCodes] } : {}),
    ...(command.interactive ? { interactive: true } : {}),
    ...(command.examples?.[0] ? { example: command.examples[0] } : {}),
  };
}

/** Computes the entries the code has and the spec lacks. */
export function computeSync(spec: ParsedClispec, specs: readonly LoadedSpec[] = []): SpecSyncResult {
  const planned = new Set(specs.filter(({ spec: s }) => OPEN_STATUSES.includes(s.frontmatter.status))
    .flatMap(({ spec: s }) => changeEntries(s.frontmatter.changes).map((entry) => `${entry.kind}:${entry.key}`)));
  const known = (kind: string, key: string) => planned.has(`${kind}:${key}`);
  const declared = spec.frontmatter;
  const commands: SpecCommand[] = [];
  const visit = (command: Command, parent: string) => {
    for (const child of command.subcommands ?? []) {
      if (child.hidden) continue;
      const path = parent ? `${parent} ${child.name}` : child.name;
      if (!declared.commands.some((entry) => entry.path === path) && !known("command", path)) {
        commands.push(commandEntry(path, child, (child.options ?? []).filter((o) => !o.hidden)));
      }
      visit(child, path);
    }
  };
  visit(root, "");
  const catalog = describeServer();
  const missingScreens = screens.filter((s) => !declared.screens.some((entry) => entry.id === s.id) && !known("screen", s.id)).map((s) => ({ id: s.id, title: s.title, description: s.description }));
  const tools = catalog.tools.filter((t) => !declared.mcp.tools.some((entry) => entry.name === t.name) && !known("tool", t.name)).map((t) => ({ name: t.name, description: t.description, effect: "read" as const }));
  const resources = catalog.resources.filter((r) => !declared.mcp.resources.some((entry) => entry.uri === r.uri) && !known("resource", r.uri)).map((r) => ({ uri: r.uri, description: r.description }));
  const prompts = catalog.prompts.filter((p) => !declared.mcp.prompts.some((entry) => entry.name === p.name) && !known("prompt", p.name)).map((p) => ({ name: p.name }));
  const settings = SETTINGS_SCHEMA.filter((s) => !declared.settings.some((entry) => entry.key === s.key) && !known("setting", s.key)).map((s) => ({ key: s.key, type: s.type, default: s.default, ...(s.values ? { values: [...s.values] } : {}), description: s.description }));
  const total = commands.length + missingScreens.length + tools.length + resources.length + prompts.length + settings.length;
  return { commands, screens: missingScreens, tools, resources, prompts, settings, total };
}

/**
 * Moves the missing entries into the `changes.add` of an open spec instead
 * of the CLISPEC, so adopting existing code leaves a spec in the history.
 * Returns the new spec front matter; `spec close` later applies it.
 */
export function addToSpec(target: LoadedSpec, additions: SpecSyncResult, now = new Date()): SpecFile {
  const { frontmatter } = target.spec;
  if (!OPEN_STATUSES.includes(frontmatter.status)) throw error.config(`Spec ${frontmatter.id} is ${frontmatter.status}; sync into an open spec.`);
  const add = frontmatter.changes.add ?? {};
  const mcp = add.mcp ?? {};
  return {
    ...frontmatter,
    updatedAt: additions.total ? now.toISOString() : frontmatter.updatedAt,
    changes: {
      ...frontmatter.changes,
      add: {
        ...add,
        commands: [...(add.commands ?? []), ...additions.commands],
        screens: [...(add.screens ?? []), ...additions.screens],
        mcp: { tools: [...(mcp.tools ?? []), ...additions.tools], resources: [...(mcp.resources ?? []), ...additions.resources], prompts: [...(mcp.prompts ?? []), ...additions.prompts] },
        settings: [...(add.settings ?? []), ...additions.settings],
      },
    },
  };
}

/** Returns the merged front matter as a plain object, ready to emit; `specs` refreshes the index. */
export function mergedFrontmatter(spec: ParsedClispec, additions: SpecSyncResult, now = new Date(), specs?: readonly LoadedSpec[]): Clispec {
  const d = spec.frontmatter;
  const index = specs ? indexOf(specs) : d.specs;
  const changed = additions.total > 0 || JSON.stringify(index) !== JSON.stringify(d.specs);
  return {
    ...d,
    bin: manifest.bin,
    description: manifest.description,
    updatedAt: changed ? now.toISOString() : d.updatedAt,
    commands: [...d.commands, ...additions.commands],
    screens: [...d.screens, ...additions.screens],
    mcp: {
      tools: [...d.mcp.tools, ...additions.tools],
      resources: [...d.mcp.resources, ...additions.resources],
      prompts: [...d.mcp.prompts, ...additions.prompts],
    },
    settings: [...d.settings, ...additions.settings],
    credentials: d.credentials,
    specs: index,
  };
}

