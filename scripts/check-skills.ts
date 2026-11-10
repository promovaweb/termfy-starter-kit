/**
 * Checks that the Termfy framework skills are installed in the project.
 *
 * The starter kit depends on `.agents/skills/termfy-*`, installed by
 * `bun run skills:install` (which calls `npx skills add`) and recorded in
 * `skills-lock.json`. This script fails when a skill is missing or absent
 * from the lock, so `bun run validate` reminds you to reinstall. It also
 * reads the "Compatibilidade" line of each SKILL.md and warns when the
 * declared starter kit range does not match this package's major.minor.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const expected = ["termfy-spec", "termfy-init", "termfy-cli", "termfy-tui", "termfy-mcp", "termfy-config"];
const errors: string[] = [];
const warnings: string[] = [];

let lock: { skills?: Record<string, { source?: string }> } = {};
try {
  lock = JSON.parse(readFileSync("skills-lock.json", "utf8"));
} catch {
  errors.push("skills-lock.json missing or invalid. Run: bun run skills:install");
}

const pkg = JSON.parse(readFileSync("package.json", "utf8")) as { version: string };
const [major, minor] = pkg.version.split(".");
const current = `${major}.${minor}`;

for (const name of expected) {
  const dir = join(".agents", "skills", name);
  const skillFile = join(dir, "SKILL.md");
  if (!existsSync(skillFile)) errors.push(`${dir}/SKILL.md missing`);
  if (!existsSync(join(dir, "references"))) errors.push(`${dir}/references missing`);
  if (!lock.skills?.[name]) errors.push(`${name} not recorded in skills-lock.json`);
  if (existsSync(skillFile)) {
    const match = /Starter kit (\d+\.\d+)\.x/.exec(readFileSync(skillFile, "utf8"));
    if (match && match[1] !== current) {
      warnings.push(`${name} declares starter kit ${match[1]}.x; this project is ${pkg.version}. Run: bun run skills:update`);
    }
  }
}

for (const w of warnings) console.warn(`! ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error("Reinstall with: bun run skills:install");
  process.exit(1);
}
console.log(`✓ ${expected.length} Termfy skills installed (${lock.skills?.[expected[0]!]?.source ?? "unknown source"})`);
