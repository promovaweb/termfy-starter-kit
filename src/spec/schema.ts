/**
 * Closed Zod schemas for the CLISPEC contract, version 2.0.0.
 *
 * Two documents share these building blocks:
 *
 * - `CLISPEC.md`, unique per binary: identity, the delivered surface
 *   (commands, screens, MCP catalog, settings, credentials and, when the
 *   binary has a database, its tables) and the index
 *   of the specs that evolve it;
 * - `specs/NNNN-slug.md`, one per evolution: lifecycle status and the
 *   change set (`add`, `update`, `remove`) applied to the CLISPEC surface
 *   when the spec is closed.
 *
 * `clispecV1Schema` keeps the 1.0.0 contract readable so older projects can
 * be migrated with `spec migrate`.
 */
import { z } from "zod";

const text = z.string().refine((value) => value.trim().length > 0, "Must not be blank.");
const scalar = z.union([z.string(), z.number(), z.boolean()]);
const credentialName = z.string().regex(/^[a-z0-9][a-z0-9_.-]{0,63}$/);
const dateTime = z.iso.datetime({ offset: true });

/** Four-digit sequential spec identifier, also the file name prefix. */
export const specId = z.string().regex(/^\d{4}$/, "Must be four digits, such as 0001.");

/** Lifecycle shared by specs (and by the legacy 1.0.0 CLISPEC). */
export const specStatus = z.enum(["draft", "in_progress", "blocked", "done", "archived"]);
export type SpecStatus = z.infer<typeof specStatus>;

/** Statuses whose change set is still pending. */
export const OPEN_STATUSES: readonly SpecStatus[] = ["draft", "in_progress", "blocked"];

export const specCommandSchema = z.strictObject({
  path: text,
  description: text,
  arguments: z.array(z.strictObject({
    name: text, required: z.boolean().optional(), variadic: z.boolean().optional(),
    values: z.array(z.string()).optional(),
  })).optional(),
  options: z.array(z.strictObject({
    name: z.string().regex(/^--[^\s]+$/), argument: text.optional(),
    values: z.array(z.string()).optional(), default: scalar.optional(), description: z.string().optional(),
  })).optional(),
  data: z.string().optional(),
  exitCodes: z.array(z.int()).optional(),
  credentials: z.array(credentialName).optional(),
  interactive: z.boolean().optional(),
  example: z.string().optional(),
});

export const specScreenSchema = z.strictObject({
  id: text, title: text, description: z.string().optional(),
  keys: z.array(z.strictObject({ key: text, action: text })).optional(),
});

const toolSchema = z.strictObject({
  name: text, description: z.string().optional(), input: z.string().optional(),
  output: z.string().optional(), effect: z.enum(["read", "write", "network"]),
});
const resourceSchema = z.strictObject({ uri: text, description: z.string().optional() });
const promptSchema = z.strictObject({ name: text, args: z.array(z.string()).optional() });

export const specMcpSchema = z.strictObject({
  tools: z.array(toolSchema).default([]),
  resources: z.array(resourceSchema).default([]),
  prompts: z.array(promptSchema).default([]),
});

export const specSettingSchema = z.strictObject({
  key: text, type: z.enum(["string", "number", "boolean", "enum"]), default: scalar,
  values: z.array(z.string()).optional(), description: z.string().optional(),
});

export const specCredentialSchema = z.strictObject({
  name: credentialName, usedBy: z.array(text), howToObtain: z.string().optional(),
});

/** SQLite column as created by the migrations (`PRAGMA table_xinfo`). */
export const specColumnSchema = z.strictObject({
  name: text,
  type: z.enum(["INTEGER", "REAL", "TEXT", "BLOB", "ANY"]),
  primaryKey: z.boolean().optional(),
  notNull: z.boolean().optional(),
  description: z.string().optional(),
});

/** SQLite table of the optional local database (~/.<bin>/data.db). */
export const specTableSchema = z.strictObject({
  name: text,
  description: z.string().optional(),
  columns: z.array(specColumnSchema).min(1),
});

/** Entry of the spec index kept in the CLISPEC front matter. */
export const specIndexEntrySchema = z.strictObject({ id: specId, title: text, status: specStatus });

const surfaceShape = {
  commands: z.array(specCommandSchema).default([]),
  screens: z.array(specScreenSchema).default([]),
  mcp: specMcpSchema.default({ tools: [], resources: [], prompts: [] }),
  settings: z.array(specSettingSchema).default([]),
  credentials: z.array(specCredentialSchema).default([]),
  storage: z.strictObject({ tables: z.array(specTableSchema).default([]) }).default({ tables: [] }),
};

/** `CLISPEC.md` front matter: identity, delivered surface and spec index. */
export const clispecSchema = z.strictObject({
  schemaVersion: z.literal("2.0.0"), bin: text, title: text, description: text,
  createdAt: dateTime, updatedAt: dateTime,
  ...surfaceShape,
  specs: z.array(specIndexEntrySchema).default([]),
}).superRefine((spec, ctx) => {
  const ids = new Set<string>();
  spec.specs.forEach((entry, index) => {
    if (ids.has(entry.id)) ctx.addIssue({ code: "custom", path: ["specs", index, "id"], message: `Repeated spec ID ${entry.id}.` });
    ids.add(entry.id);
  });
});

/** Partial surface used by `add` and `update`: entries carry their full shape. */
const partialSurfaceSchema = z.strictObject({
  commands: z.array(specCommandSchema).optional(),
  screens: z.array(specScreenSchema).optional(),
  mcp: z.strictObject({
    tools: z.array(toolSchema).optional(),
    resources: z.array(resourceSchema).optional(),
    prompts: z.array(promptSchema).optional(),
  }).optional(),
  settings: z.array(specSettingSchema).optional(),
  credentials: z.array(specCredentialSchema).optional(),
  storage: z.strictObject({ tables: z.array(specTableSchema).optional() }).optional(),
});

/** `remove` lists keys only: command paths, screen ids, tool names, URIs, prompt names, setting keys, credential names, table names. */
const removalSchema = z.strictObject({
  commands: z.array(text).optional(),
  screens: z.array(text).optional(),
  tools: z.array(text).optional(),
  resources: z.array(text).optional(),
  prompts: z.array(text).optional(),
  settings: z.array(text).optional(),
  credentials: z.array(text).optional(),
  tables: z.array(text).optional(),
});

export const specChangesSchema = z.strictObject({
  add: partialSurfaceSchema.optional(),
  update: partialSurfaceSchema.optional(),
  remove: removalSchema.optional(),
});

function lifecycleRules(ctx: z.RefinementCtx, spec: { status: SpecStatus; blockedReason?: string; archivedReason?: string }): void {
  for (const [status, field] of [["blocked", "blockedReason"], ["archived", "archivedReason"]] as const) {
    if (spec.status === status && !spec[field]?.trim()) {
      ctx.addIssue({ code: "custom", path: [field], message: `${field} is required when status is ${status}.` });
    } else if (spec.status !== status && spec[field] !== undefined) {
      ctx.addIssue({ code: "custom", path: [field], message: `${field} is only allowed when status is ${status}.` });
    }
  }
}

/** `specs/NNNN-slug.md` front matter: lifecycle and change set of one evolution. */
export const specFileSchema = z.strictObject({
  schemaVersion: z.literal("2.0.0"), id: specId, title: text, status: specStatus,
  createdAt: dateTime, updatedAt: dateTime, closedAt: dateTime.optional(),
  blockedReason: text.optional(), archivedReason: text.optional(),
  changes: specChangesSchema.default({}),
}).superRefine((spec, ctx) => {
  lifecycleRules(ctx, spec);
  if (spec.status === "done" && !spec.closedAt) ctx.addIssue({ code: "custom", path: ["closedAt"], message: "closedAt is required when status is done." });
  if (spec.status !== "done" && spec.closedAt !== undefined) ctx.addIssue({ code: "custom", path: ["closedAt"], message: "closedAt is only allowed when status is done." });
});

/** Legacy 1.0.0 CLISPEC front matter, read only to migrate. */
export const clispecV1Schema = z.strictObject({
  schemaVersion: z.literal("1.0.0"), bin: text, title: text, description: text,
  status: specStatus, createdAt: dateTime, updatedAt: dateTime,
  blockedReason: text.optional(), archivedReason: text.optional(),
  ...surfaceShape,
}).superRefine((spec, ctx) => lifecycleRules(ctx, spec));

export type Clispec = z.infer<typeof clispecSchema>;
export type ClispecV1 = z.infer<typeof clispecV1Schema>;
export type SpecFile = z.infer<typeof specFileSchema>;
export type SpecChanges = z.infer<typeof specChangesSchema>;
export type SpecIndexEntry = z.infer<typeof specIndexEntrySchema>;
export type SpecCommand = z.infer<typeof specCommandSchema>;
export type SpecScreen = z.infer<typeof specScreenSchema>;
export type SpecMcp = z.infer<typeof specMcpSchema>;
export type SpecSetting = z.infer<typeof specSettingSchema>;
export type SpecCredential = z.infer<typeof specCredentialSchema>;
export type SpecTable = z.infer<typeof specTableSchema>;
/** The part of the CLISPEC that describes what the binary exposes. */
export type Surface = Pick<Clispec, "commands" | "screens" | "mcp" | "settings" | "credentials" | "storage">;
