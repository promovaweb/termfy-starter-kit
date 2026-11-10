/** Checks the source spec and literal credential reads without counting comments or examples. */
import { join } from "node:path";
import ts from "typescript";
import { checkSpec } from "../src/spec/check.ts";
import { loadSpec } from "../src/spec/index.ts";
import type { Spec } from "../src/spec/schema.ts";

/** Finds literal getCredential calls whose names are absent from the spec. */
export async function checkCredentialUsage(spec: Spec, sourceDir: string): Promise<string[]> {
  const names = new Set(spec.credentials.map((credential) => credential.name));
  const errors: string[] = [];
  const files = Array.from(new Bun.Glob("**/*.{ts,tsx,js,jsx,mjs,cjs}").scanSync({ cwd: sourceDir })).sort();
  for (const file of files) {
    const source = ts.createSourceFile(file, await Bun.file(join(sourceDir, file)).text(), ts.ScriptTarget.Latest, true);
    const visit = (node: ts.Node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "getCredential") {
        const argument = node.arguments[0];
        if (argument && (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) && !names.has(argument.text)) {
          const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
          errors.push(`${file}:${line + 1}: credential ${argument.text} is missing from the spec.`);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  return errors;
}

async function main(): Promise<void> {
  const spec = loadSpec();
  const result = checkSpec(spec);
  const errors = [...result.errors, ...await checkCredentialUsage(spec.frontmatter, join(import.meta.dir, "../src"))];
  for (const message of result.warnings) console.warn(`Warning: ${message}`);
  for (const message of errors) console.error(`✗ ${message}`);
  if (errors.length) process.exitCode = 1;
  else console.log("✓ CLISPEC.md matches the code and credential reads");
}

if (import.meta.main) {
  main().catch((e: unknown) => {
    console.error(`✗ ${e instanceof Error ? e.message : String(e)}`);
    process.exitCode = 1;
  });
}
