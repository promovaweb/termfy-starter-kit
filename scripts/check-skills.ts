/**
 * Checks that the Termfy framework skills are installed in the project.
 *
 * The starter kit depends on `.agents/skills/termfy-*`, installed by
 * `bun run skills:install` (which calls `npx skills add`) and recorded in
 * `skills-lock.json`. This script fails when a skill is missing or absent
 * from the lock, so `bun run validate` reminds you to reinstall.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const expected = ["termfy-spec", "termfy-init", "termfy-cli", "termfy-tui", "termfy-mcp", "termfy-config"];
const errors: string[] = [];

let lock: { skills?: Record<string, { source?: string }> } = {};
try {
  lock = JSON.parse(readFileSync("skills-lock.json", "utf8"));
} catch {
  errors.push("skills-lock.json missing or invalid. Run: bun run skills:install");
}

for (const name of expected) {
  const dir = join(".agents", "skills", name);
  if (!existsSync(join(dir, "SKILL.md"))) errors.push(`${dir}/SKILL.md missing`);
  if (!existsSync(join(dir, "references"))) errors.push(`${dir}/references missing`);
  if (!lock.skills?.[name]) errors.push(`${name} not recorded in skills-lock.json`);
}

if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error("Reinstall with: bun run skills:install");
  process.exit(1);
}
console.log(`✓ ${expected.length} Termfy skills installed (${lock.skills?.[expected[0]!]?.source ?? "unknown source"})`);
