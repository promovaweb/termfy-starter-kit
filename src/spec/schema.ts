/** Closed Zod schemas for the CLISPEC front matter contract. */
import { z } from "zod";

const text = z.string().refine((value) => value.trim().length > 0, "Must not be blank.");
const scalar = z.union([z.string(), z.number(), z.boolean()]);
const credentialName = z.string().regex(/^[a-z0-9][a-z0-9_.-]{0,63}$/);

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

export const specMcpSchema = z.strictObject({
  tools: z.array(z.strictObject({
    name: text, description: z.string().optional(), input: z.string().optional(),
    output: z.string().optional(), effect: z.enum(["read", "write", "network"]),
  })).default([]),
  resources: z.array(z.strictObject({ uri: text, description: z.string().optional() })).default([]),
  prompts: z.array(z.strictObject({ name: text, args: z.array(z.string()).optional() })).default([]),
});

export const specSettingSchema = z.strictObject({
  key: text, type: z.enum(["string", "number", "boolean", "enum"]), default: scalar,
  values: z.array(z.string()).optional(), description: z.string().optional(),
});

export const specCredentialSchema = z.strictObject({
  name: credentialName, usedBy: z.array(text), howToObtain: z.string().optional(),
});

export const specSchema = z.strictObject({
  schemaVersion: z.literal("1.0.0"), bin: text, title: text, description: text,
  status: z.enum(["draft", "in_progress", "blocked", "done", "archived"]),
  createdAt: z.iso.datetime({ offset: true }), updatedAt: z.iso.datetime({ offset: true }),
  blockedReason: text.optional(), archivedReason: text.optional(),
  commands: z.array(specCommandSchema).default([]),
  screens: z.array(specScreenSchema).default([]),
  mcp: specMcpSchema.default({ tools: [], resources: [], prompts: [] }),
  settings: z.array(specSettingSchema).default([]),
  credentials: z.array(specCredentialSchema).default([]),
}).superRefine((spec, ctx) => {
  for (const [status, field] of [["blocked", "blockedReason"], ["archived", "archivedReason"]] as const) {
    if (spec.status === status && !spec[field]?.trim()) {
      ctx.addIssue({ code: "custom", path: [field], message: `${field} is required when status is ${status}.` });
    } else if (spec.status !== status && spec[field] !== undefined) {
      ctx.addIssue({ code: "custom", path: [field], message: `${field} is only allowed when status is ${status}.` });
    }
  }
});

export type Spec = z.infer<typeof specSchema>;
export type SpecCommand = z.infer<typeof specCommandSchema>;
export type SpecScreen = z.infer<typeof specScreenSchema>;
export type SpecMcp = z.infer<typeof specMcpSchema>;
export type SpecSetting = z.infer<typeof specSettingSchema>;
export type SpecCredential = z.infer<typeof specCredentialSchema>;
