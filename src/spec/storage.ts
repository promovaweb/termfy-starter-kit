/**
 * Reads the schema of the optional SQLite database for `spec check`.
 *
 * A binary has a database only when the project created
 * `src/db/migrations/index.ts` (see template/db/). When it exists, the
 * checker applies every migration to an in-memory database and reads the
 * resulting tables and columns, so `storage.tables` in CLISPEC.md is
 * compared with what the migrations really build, not with prose.
 *
 * The module is loaded by path at runtime, never by a literal import, so
 * the skeleton (which has no database) still builds. In the compiled
 * binary the source path does not exist and the storage check is skipped;
 * `bun run spec:check` and `bun run dev -- spec check` run it.
 */
import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { SpecTable } from "./schema.ts";

export interface ActualColumn { name: string; type: string; primaryKey: boolean; notNull: boolean }
export interface ActualTable { name: string; columns: ActualColumn[] }
interface MigrationLike { version: number; name: string; up: string }

/** Path of the migration registry of a project with a database. */
export const MIGRATIONS_MODULE = join(import.meta.dir, "../db/migrations/index.ts");

/** Loads the migration list, or `undefined` when the binary has no database (or runs compiled). */
export async function loadMigrations(path: string = MIGRATIONS_MODULE): Promise<readonly MigrationLike[] | undefined> {
  if (!existsSync(path)) return undefined;
  const module = await import(path) as { migrations?: readonly MigrationLike[] };
  if (!Array.isArray(module.migrations)) throw new Error(`${path} must export a migrations array.`);
  return module.migrations;
}

/** Applies the migrations to an in-memory database and returns its tables. */
export function schemaFromMigrations(migrations: readonly MigrationLike[]): ActualTable[] {
  const db = new Database(":memory:");
  try {
    for (const migration of migrations) db.run(migration.up);
    const names = db.query<{ name: string }, []>("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
    return names.map(({ name }) => ({
      name,
      columns: db.query<{ name: string; type: string; pk: number; notnull: number; hidden: number }, []>(`PRAGMA table_xinfo("${name.replaceAll('"', '""')}")`).all()
        .filter((column) => column.hidden === 0)
        .map((column) => {
          const type = column.type.toUpperCase();
          return { name: column.name, type: type === "INT" ? "INTEGER" : type, primaryKey: column.pk > 0, notNull: column.notnull === 1 };
        }),
    }));
  } finally {
    db.close();
  }
}

/** Loads the migrations and returns the tables they build, or `undefined` without a database. */
export async function actualTables(path?: string): Promise<ActualTable[] | undefined> {
  const migrations = await loadMigrations(path);
  return migrations ? schemaFromMigrations(migrations) : undefined;
}

/**
 * Compares declared and actual tables. Declared entries the migrations do
 * not build are errors; tables and columns the migrations build and the
 * CLISPEC lacks are warnings. `pending(table)` skips tables an open spec
 * changes.
 */
export function compareTables(declared: readonly SpecTable[], actual: readonly ActualTable[], pending: (table: string) => boolean): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  for (const table of declared) {
    const real = actual.find((entry) => entry.name === table.name);
    if (!real) { if (!pending(table.name)) errors.push(`Unknown table: ${table.name}; no migration creates it.`); continue; }
    const mismatches: string[] = [];
    for (const column of table.columns) {
      const match = real.columns.find((entry) => entry.name === column.name);
      if (!match) { mismatches.push(`Unknown column ${table.name}.${column.name}.`); continue; }
      if (match.type !== column.type) mismatches.push(`Column ${table.name}.${column.name} is ${match.type} in the migrations, not ${column.type}.`);
      if (match.primaryKey !== Boolean(column.primaryKey)) mismatches.push(`Column ${table.name}.${column.name} primaryKey differs from the migrations.`);
      if (!match.primaryKey && match.notNull !== Boolean(column.notNull)) mismatches.push(`Column ${table.name}.${column.name} notNull differs from the migrations.`);
    }
    const extra = real.columns.filter((column) => !table.columns.some((entry) => entry.name === column.name));
    if (pending(table.name)) continue;
    errors.push(...mismatches);
    for (const column of extra) warnings.push(`Column missing from spec: ${table.name}.${column.name}.`);
  }
  for (const table of actual) {
    if (!declared.some((entry) => entry.name === table.name) && !pending(table.name)) warnings.push(`Table missing from spec: ${table.name}.`);
  }
  return { errors, warnings };
}
