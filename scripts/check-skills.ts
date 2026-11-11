/**
 * Checks that the Termfy framework skills are installed in the project.
 *
 * The starter kit depends on `.agents/skills/termfy-*`, installed by
 * `bun run skills:install` (which calls `npx skills add`) and recorded in
 * `skills-lock.json`. This script fails when a skill is missing or absent
 * from the lock, so `bun run validate` reminds you to reinstall. It also
 * flags termfy-* skills that the framework no longer ships, and reads the
 * "Compatibilidade" line of each SKILL.md and warns when the
 * declared starter kit range does not match this package's major.minor.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const expected = [
  "termfy", "termfy-init", "termfy-brand", "termfy-clispec", "termfy-spec", "termfy-api-import", "termfy-config", "termfy-api", "termfy-database",
  "termfy-cli", "termfy-command-set", "termfy-mcp", "termfy-tui", "termfy-test", "termfy-review", "termfy-docs",
  "termfy-release", "termfy-mcp-client",
];
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

// A renamed or removed framework skill stays behind after `npx skills add`; flag it.
const installed = existsSync(join(".agents", "skills")) ? readdirSync(join(".agents", "skills")).filter((name) => name.startsWith("termfy")) : [];
const recorded = Object.keys(lock.skills ?? {}).filter((name) => name.startsWith("termfy"));
for (const name of new Set([...installed, ...recorded])) {
  if (!expected.includes(name)) errors.push(`${name} is no longer a Termfy skill; remove .agents/skills/${name}, .claude/skills/${name} and its skills-lock.json entry`);
}

for (const w of warnings) console.warn(`! ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`✗ ${e}`);
  console.error("Reinstall with: bun run skills:install");
  process.exit(1);
}
console.log(`✓ ${expected.length} Termfy skills installed (${lock.skills?.[expected[0]!]?.source ?? "unknown source"})`);
