/**
 * Confere se docs/opencli.json está alinhado ao registro de comandos.
 * Falha com código 1 quando o arquivo está ausente ou diferente, para que
 * `bun run validar` lembre de rodar `bun run opencli`.
 */
import { readFileSync } from "node:fs";
import { gerarOpenCli } from "../src/cli/opencli.ts";
import { raiz } from "../src/cli/comandos.ts";

const esperado = `${JSON.stringify(gerarOpenCli(raiz), null, 2)}\n`;
let atual = "";
try {
  atual = readFileSync("docs/opencli.json", "utf8");
} catch {
  console.error("docs/opencli.json não existe. Rode: bun run opencli");
  process.exit(1);
}
if (atual !== esperado) {
  console.error("docs/opencli.json está desatualizado. Rode: bun run opencli");
  process.exit(1);
}
console.log("✓ docs/opencli.json alinhado ao registro de comandos");
