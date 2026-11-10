/**
 * Confere se as skills do framework Termfy estão instaladas no projeto.
 *
 * O starter kit depende de `.agents/skills/termfy-*`, instaladas por
 * `bun run skills:instalar` (que chama `npx skills add`) e registradas em
 * `skills-lock.json`. Este script falha quando falta alguma skill ou quando
 * o lock não a registra, para que `bun run validar` lembre de reinstalar.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const esperadas = ["termfy-iniciar", "termfy-cli", "termfy-tui", "termfy-mcp", "termfy-config"];
const erros: string[] = [];

let lock: { skills?: Record<string, { source?: string }> } = {};
try {
  lock = JSON.parse(readFileSync("skills-lock.json", "utf8"));
} catch {
  erros.push("skills-lock.json ausente ou inválido. Rode: bun run skills:instalar");
}

for (const nome of esperadas) {
  const pasta = join(".agents", "skills", nome);
  if (!existsSync(join(pasta, "SKILL.md"))) erros.push(`${pasta}/SKILL.md ausente`);
  if (!existsSync(join(pasta, "references"))) erros.push(`${pasta}/references ausente`);
  if (!lock.skills?.[nome]) erros.push(`${nome} não registrada em skills-lock.json`);
}

if (erros.length) {
  for (const e of erros) console.error(`✗ ${e}`);
  console.error("Reinstale com: bun run skills:instalar");
  process.exit(1);
}
console.log(`✓ ${esperadas.length} skills do Termfy instaladas (${lock.skills?.[esperadas[0]!]?.source ?? "origem desconhecida"})`);
