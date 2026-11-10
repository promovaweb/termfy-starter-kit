/** Compares the declared specification with the executable registries. */
import { ExitCode } from "../app/exit-codes.ts";
import { manifest } from "../app/manifest.ts";
import { root } from "../cli/commands.ts";
import { GLOBAL_OPTIONS, type Command } from "../cli/registry.ts";
import { SETTINGS_SCHEMA } from "../config/settings.ts";
import { describeServer } from "../mcp/server.ts";
import { screens } from "../tui/screens/index.ts";
import type { ParsedSpec } from "./parse.ts";
import { specSchema } from "./schema.ts";

export interface SpecCheckResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Checks declared names and types; strict mode also fails on undeclared code entries. */
export function checkSpec(spec: ParsedSpec, { strict = false }: { strict?: boolean } = {}): SpecCheckResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const parsed = specSchema.safeParse(spec.frontmatter);
  if (!parsed.success) return { ok: false, errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`), warnings };
  const declared = parsed.data;
  if (declared.bin !== manifest.bin) errors.push("Spec bin differs from package.json.");
  if (declared.description !== manifest.description) errors.push("Spec description differs from package.json.");
  const commands = new Map<string, Command>();
  const visit = (command: Command, parent: string) => {
    for (const child of command.subcommands ?? []) {
      const path = parent ? `${parent} ${child.name}` : child.name;
      commands.set(path, child);
      visit(child, path);
    }
  };
  visit(root, "");
  const codes = new Set<number>(Object.values(ExitCode));
  for (const command of declared.commands) {
    const actual = commands.get(command.path);
    if (!actual) { errors.push(`Unknown command: ${command.path}.`); continue; }
    for (const option of command.options ?? []) {
      const match = [...GLOBAL_OPTIONS, ...(actual.options ?? [])].find((entry) => entry.name === option.name);
      if (!match) errors.push(`Unknown option ${option.name} on command ${command.path}.`);
      else if (option.argument !== undefined && option.argument !== match.argument?.name) errors.push(`Unknown option argument ${option.argument} for ${command.path} ${option.name}.`);
    }
    for (const argument of command.arguments ?? []) {
      if (!actual.arguments?.some((entry) => entry.name === argument.name)) errors.push(`Unknown argument ${argument.name} on command ${command.path}.`);
    }
    for (const code of command.exitCodes ?? []) {
      if (!codes.has(code) || ![ExitCode.SUCCESS, ExitCode.GENERIC_ERROR, ExitCode.USAGE, ...(actual.exitCodes ?? [])].includes(code as ExitCode)) errors.push(`Unknown exit code ${code} on command ${command.path}.`);
    }
  }
  const catalog = describeServer();
  const compare = (kind: string, expected: string[], actual: string[], warn: boolean) => {
    for (const name of expected) if (!actual.includes(name)) errors.push(`Unknown ${kind}: ${name}.`);
    if (warn) for (const name of actual) if (!expected.includes(name)) warnings.push(`${kind} missing from spec: ${name}.`);
  };
  for (const path of commands.keys()) if (!declared.commands.some((command) => command.path === path)) warnings.push(`Command missing from spec: ${path}.`);
  compare("Screen", declared.screens.map((screen) => screen.id), screens.map((screen) => screen.id), true);
  compare("Tool", declared.mcp.tools.map((tool) => tool.name), catalog.tools.map((tool) => tool.name), true);
  compare("Resource", declared.mcp.resources.map((resource) => resource.uri), catalog.resources.map((resource) => resource.uri), false);
  compare("Prompt", declared.mcp.prompts.map((prompt) => prompt.name), catalog.prompts.map((prompt) => prompt.name), false);
  compare("Setting", declared.settings.map((setting) => setting.key), SETTINGS_SCHEMA.map((setting) => setting.key), true);
  for (const setting of declared.settings) {
    const actual = SETTINGS_SCHEMA.find((entry) => entry.key === setting.key);
    if (actual && actual.type !== setting.type) errors.push(`Setting type differs for ${setting.key}: expected ${actual.type}.`);
  }
  for (const credential of declared.credentials) {
    for (const name of credential.usedBy) {
      if (!commands.has(name) && !catalog.tools.some((tool) => tool.name === name)) errors.push(`Unknown credential consumer ${name} for ${credential.name}.`);
    }
  }
  const ids = new Set<string>();
  for (const item of spec.checklist) {
    if (!/^[a-z0-9]{4}$/.test(item.id) || ids.has(item.id)) errors.push(`Invalid or repeated checklist ID: ${item.id}.`);
    ids.add(item.id);
  }
  if (declared.status === "done" && spec.checklist.some((item) => !item.done)) errors.push("Status done requires every checklist item to be complete.");
  return { ok: errors.length === 0 && (!strict || warnings.length === 0), errors, warnings };
}
