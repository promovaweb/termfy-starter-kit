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
 */
import { readFileSync, writeFileSync } from "node:fs";
import { manifest } from "../app/manifest.ts";
import { root } from "../cli/commands.ts";
import type { Command, OptionDefinition } from "../cli/registry.ts";
import { SETTINGS_SCHEMA } from "../config/settings.ts";
import { describeServer } from "../mcp/server.ts";
import { screens } from "../tui/screens/index.ts";
import type { ParsedSpec } from "./parse.ts";
import type { Spec, SpecCommand, SpecScreen, SpecSetting } from "./schema.ts";
import { compact, emitYaml } from "./yaml.ts";

export interface SpecSyncResult {
  commands: SpecCommand[];
  screens: SpecScreen[];
  tools: Spec["mcp"]["tools"];
  resources: Spec["mcp"]["resources"];
  prompts: Spec["mcp"]["prompts"];
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
export function computeSync(spec: ParsedSpec): SpecSyncResult {
  const declared = spec.frontmatter;
  const commands: SpecCommand[] = [];
  const visit = (command: Command, parent: string) => {
    for (const child of command.subcommands ?? []) {
      if (child.hidden) continue;
      const path = parent ? `${parent} ${child.name}` : child.name;
      if (!declared.commands.some((entry) => entry.path === path)) {
        commands.push(commandEntry(path, child, (child.options ?? []).filter((o) => !o.hidden)));
      }
      visit(child, path);
    }
  };
  visit(root, "");
  const catalog = describeServer();
  const missingScreens = screens.filter((s) => !declared.screens.some((entry) => entry.id === s.id)).map((s) => ({ id: s.id, title: s.title, description: s.description }));
  const tools = catalog.tools.filter((t) => !declared.mcp.tools.some((entry) => entry.name === t.name)).map((t) => ({ name: t.name, description: t.description, effect: "read" as const }));
  const resources = catalog.resources.filter((r) => !declared.mcp.resources.some((entry) => entry.uri === r.uri)).map((r) => ({ uri: r.uri, description: r.description }));
  const prompts = catalog.prompts.filter((p) => !declared.mcp.prompts.some((entry) => entry.name === p.name)).map((p) => ({ name: p.name }));
  const settings = SETTINGS_SCHEMA.filter((s) => !declared.settings.some((entry) => entry.key === s.key)).map((s) => ({ key: s.key, type: s.type, default: s.default, ...(s.values ? { values: [...s.values] } : {}), description: s.description }));
  const total = commands.length + missingScreens.length + tools.length + resources.length + prompts.length + settings.length;
  return { commands, screens: missingScreens, tools, resources, prompts, settings, total };
}

/** Returns the merged front matter as a plain object, ready to emit. */
export function mergedFrontmatter(spec: ParsedSpec, additions: SpecSyncResult, now = new Date()): Spec {
  const d = spec.frontmatter;
  return {
    ...d,
    bin: manifest.bin,
    description: manifest.description,
    updatedAt: additions.total ? now.toISOString() : d.updatedAt,
    commands: [...d.commands, ...additions.commands],
    screens: [...d.screens, ...additions.screens],
    mcp: {
      tools: [...d.mcp.tools, ...additions.tools],
      resources: [...d.mcp.resources, ...additions.resources],
      prompts: [...d.mcp.prompts, ...additions.prompts],
    },
    settings: [...d.settings, ...additions.settings],
    credentials: d.credentials,
  };
}

/** Rewrites the front matter of a CLISPEC file, keeping the body intact. */
export function writeFrontmatter(file: string, frontmatter: Spec): void {
  const raw = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const lines = raw.split("\n");
  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end < 0) throw new Error(`${file} has no front matter to rewrite.`);
  const body = lines.slice(end + 1).join("\n");
  const yaml = emitYaml(compact(frontmatter)).join("\n");
  writeFileSync(file, `---\n${yaml}\n---${body.startsWith("\n") ? "" : "\n"}${body}`);
}
