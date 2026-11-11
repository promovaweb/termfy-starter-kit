/**
 * Checks the source CLISPEC.md and specs/ against the code, and the literal
 * credential reads, without counting comments or examples. Credentials that
 * an open spec adds count as declared, so work in progress can read them.
 * When the project has src/db/migrations/index.ts, the CLISPEC tables are
 * compared with the schema the migrations build.
 */
import { join } from "node:path";
import { credentialCalls } from "./credential-calls.ts";
import { checkSpec } from "../src/spec/check.ts";
import { loadProject, loadSpec } from "../src/spec/index.ts";
import { actualTables } from "../src/spec/storage.ts";
import { OPEN_STATUSES, type Clispec } from "../src/spec/schema.ts";

/** Finds literal getCredential calls whose names are absent from the spec. */
export async function checkCredentialUsage(spec: Pick<Clispec, "credentials">, sourceDir: string): Promise<string[]> {
  const names = new Set(spec.credentials.map((credential) => credential.name));
  const errors: string[] = [];
  const files = Array.from(new Bun.Glob("**/*.{ts,tsx,js,jsx,mjs,cjs}").scanSync({ cwd: sourceDir })).sort();
  for (const file of files) {
    for (const call of credentialCalls(await Bun.file(join(sourceDir, file)).text())) {
      if (!names.has(call.name)) errors.push(`${file}:${call.line}: credential ${call.name} is missing from the spec.`);
    }
  }
  return errors;
}

async function main(): Promise<void> {
  const spec = loadSpec();
  const specs = loadProject(join(import.meta.dir, "../CLISPEC.md"))?.specs ?? [];
  const tables = await actualTables();
  const result = checkSpec(spec, { specs, ...(tables ? { tables } : {}) });
  const planned = specs.filter(({ spec: s }) => OPEN_STATUSES.includes(s.frontmatter.status))
    .flatMap(({ spec: s }) => [...(s.frontmatter.changes.add?.credentials ?? []), ...(s.frontmatter.changes.update?.credentials ?? [])]);
  const credentials = [...spec.frontmatter.credentials, ...planned];
  const errors = [...result.errors, ...await checkCredentialUsage({ credentials }, join(import.meta.dir, "../src"))];
  for (const message of result.warnings) console.warn(`Warning: ${message}`);
  for (const message of result.pending) console.log(`Pending: ${message}`);
  for (const message of errors) console.error(`✗ ${message}`);
  if (errors.length) process.exitCode = 1;
  else console.log(`✓ CLISPEC.md matches the code and credential reads; ${specs.length} spec(s) checked`);
}

if (import.meta.main) {
  main().catch((e: unknown) => {
    console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  });
}
