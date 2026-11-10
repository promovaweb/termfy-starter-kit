/**
 * Minimal block-style YAML emitter for the CLISPEC front matter.
 *
 * `Bun.YAML.stringify` emits flow style, which is hard to read and edit by
 * hand. This emitter covers the shapes the spec schema allows: objects,
 * arrays of scalars or objects, strings, numbers and booleans. Strings that
 * could be misread by a YAML parser (colons, leading symbols, numbers,
 * reserved words) are quoted. Empty arrays are omitted by `emitSpec`, so
 * the file stays short.
 */

const RESERVED = new Set(["true", "false", "null", "yes", "no", "on", "off", "~", ""]);

function quoteIfNeeded(value: string): string {
  const risky =
    RESERVED.has(value.toLowerCase()) ||
    /^[\s\-?:,[\]{}#&*!|>'"%@`]/.test(value) ||
    /[:#]\s|\s$|^\s|[\n\r\t]/.test(value) ||
    /^[-+]?(\d[\d_]*(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(value) ||
    /^0x[0-9a-f]+$/i.test(value) ||
    /^\d{4}-\d{2}-\d{2}/.test(value);
  return risky ? JSON.stringify(value) : value;
}

function scalar(value: unknown): string {
  if (typeof value === "string") return quoteIfNeeded(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "null";
  return JSON.stringify(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Emits a value as YAML lines at the given indentation. */
export function emitYaml(value: unknown, indent = 0): string[] {
  const pad = " ".repeat(indent);
  const lines: string[] = [];
  if (Array.isArray(value)) {
    for (const item of value) {
      if (isObject(item)) {
        const inner = emitYaml(item, indent + 2);
        if (inner.length === 0) {
          lines.push(`${pad}- {}`);
          continue;
        }
        lines.push(`${pad}- ${inner[0]!.trimStart()}`);
        lines.push(...inner.slice(1));
      } else if (Array.isArray(item)) {
        lines.push(`${pad}-`);
        lines.push(...emitYaml(item, indent + 2));
      } else {
        lines.push(`${pad}- ${scalar(item)}`);
      }
    }
    return lines;
  }
  if (isObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (item === undefined) continue;
      if (Array.isArray(item)) {
        if (item.length === 0) {
          lines.push(`${pad}${key}: []`);
        } else {
          lines.push(`${pad}${key}:`);
          lines.push(...emitYaml(item, indent + 2));
        }
      } else if (isObject(item)) {
        lines.push(`${pad}${key}:`);
        lines.push(...emitYaml(item, indent + 2));
      } else {
        lines.push(`${pad}${key}: ${scalar(item)}`);
      }
    }
    return lines;
  }
  return [`${pad}${scalar(value)}`];
}

/** Removes empty arrays and `false` flags so the emitted spec stays compact. */
export function compact<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => compact(item)) as T;
  if (isObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      if (Array.isArray(item) && item.length === 0 && !["tools", "resources", "prompts"].includes(key)) continue;
      if (item === false && key === "interactive") continue;
      if (item === undefined) continue;
      out[key] = compact(item);
    }
    return out as T;
  }
  return value;
}
