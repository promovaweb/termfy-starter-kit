/**
 * Customizes the template for a new binary.
 *
 * Usage:
 *   bun run init -- --name mycli [--title "My CLI"] [--description "..."]
 *                   [--author "Org"] [--repository URL] [--site URL]
 *
 * Rewrites package.json (name, bin, description, termfy block), .env.example
 * and the literal mentions of the previous bin/title in README.md,
 * AGENTS.md, CHANGELOG.md and .github/workflows/*.yml. It does not touch
 * src/ or docs/, which read the identity from the manifest at runtime.
 *
 * CLISPEC.md gets the new bin, title, description and resource URIs
 * (`<bin>://`). When the previous identity is the template itself
 * (`termfy`), init also resets the spec history: fresh dates, an empty
 * `specs` index and the template specs/NNNN-*.md files removed. The
 * delivered surface stays, since the new binary starts with the skeleton
 * commands. A later run on a derived project keeps its specs.
 * Prints what changed and exits with 0; invalid arguments exit with 2.
 */
import { existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { compact, emitYaml } from "../src/spec/yaml.ts";

const argv = process.argv.slice(2);
function option(name: string): string | undefined {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

const name = option("name");
if (!name || !/^[a-z][a-z0-9-]{1,39}$/.test(name)) {
  console.error("Provide --name with lower-case letters, digits and hyphens (2 to 40 characters), starting with a letter.");
  process.exit(2);
}
const title = option("title") ?? name;
const description = option("description");
const author = option("author");
const repository = option("repository");
const site = option("site");

const pkgPath = "package.json";
const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
const previous: string = pkg.termfy?.bin ?? pkg.name;
const previousTitle: string = pkg.termfy?.title ?? previous;

pkg.name = name;
pkg.bin = { [name]: "src/main.ts" };
if (description) pkg.description = description;
pkg.termfy = {
  bin: name,
  title,
  author: author ?? pkg.termfy?.author ?? "",
  site: site ?? pkg.termfy?.site ?? "",
  repository: repository ?? pkg.termfy?.repository ?? "",
  framework: pkg.termfy?.framework ?? "https://github.com/promovaweb/termfy",
};
if (repository) pkg.repository = { type: "git", url: `git+${repository}.git` };
writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`✓ package.json: ${previous} → ${name}`);

const targets = [".env.example", "README.md", "AGENTS.md", "CHANGELOG.md"];
try {
  for (const f of readdirSync(".github/workflows")) targets.push(join(".github/workflows", f));
} catch {
  // No workflows, carry on.
}
const previousPrefix = previous.replace(/[^a-z0-9]/gi, "_").toUpperCase();
const nextPrefix = name.replace(/[^a-z0-9]/gi, "_").toUpperCase();
for (const file of targets) {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  const next = text
    .replaceAll(`${previousPrefix}_`, `${nextPrefix}_`)
    .replaceAll(previousTitle, title)
    .replaceAll(previous, name);
  if (next !== text) {
    writeFileSync(file, next);
    console.log(`✓ ${file}`);
  }
}
const fromTemplate = previous === "termfy" && name !== "termfy";
if (existsSync("CLISPEC.md")) {
  const lines = readFileSync("CLISPEC.md", "utf8").replace(/\r\n/g, "\n").split("\n");
  const end = lines.indexOf("---", 1);
  const parsed: unknown = lines[0] === "---" && end > 0 ? Bun.YAML.parse(lines.slice(1, end).join("\n")) : undefined;
  if (parsed && typeof parsed === "object" && (parsed as { schemaVersion?: unknown }).schemaVersion === "2.0.0") {
    // Resource URIs carry the bin as scheme; rename them with the identity.
    const frontmatter = JSON.parse(JSON.stringify(parsed).replaceAll(`"${previous}://`, `"${name}://`)) as Record<string, unknown>;
    Object.assign(frontmatter, { bin: name, title, description: pkg.description });
    if (fromTemplate) {
      const now = new Date().toISOString();
      Object.assign(frontmatter, { createdAt: now, updatedAt: now, specs: [] });
    }
    writeFileSync("CLISPEC.md", `---\n${emitYaml(compact(frontmatter)).join("\n")}\n---\n${lines.slice(end + 1).join("\n")}`);
    console.log(`✓ CLISPEC.md: identity updated${fromTemplate ? ", spec index cleared" : ""}`);
  }
}
if (fromTemplate && existsSync("specs")) {
  for (const file of readdirSync("specs")) {
    if (/^\d{4}-[a-z0-9-]+\.md$/.test(file)) rmSync(join("specs", file));
  }
  console.log("✓ specs/: template specs removed");
}
console.log(`\nDone. Check with: bun run dev -- --version && bun run dev -- --help`);
console.log("Then run: bun run validate");
