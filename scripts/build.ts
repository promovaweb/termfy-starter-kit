/**
 * Compila o binário com `bun build --compile`.
 *
 * Sem argumentos, gera `dist/<bin>` para a plataforma atual. Com `--todos`,
 * gera um executável por alvo suportado, nomeado `dist/<bin>-<alvo>`.
 * O OpenTUI exige que o pacote nativo do alvo esteja instalado; para builds
 * cruzados rode antes `bun install --os="*" --cpu="*" @opentui/core`.
 */
import { mkdirSync } from "node:fs";
import { manifesto } from "../src/app/manifesto.ts";

const alvos = [
  { alvo: "bun-linux-x64", sufixo: "linux-x64" },
  { alvo: "bun-linux-arm64", sufixo: "linux-arm64" },
  { alvo: "bun-darwin-x64", sufixo: "darwin-x64" },
  { alvo: "bun-darwin-arm64", sufixo: "darwin-arm64" },
  { alvo: "bun-windows-x64", sufixo: "windows-x64" },
] as const;

const todos = process.argv.includes("--todos");
mkdirSync("dist", { recursive: true });

async function compilar(saida: string, alvo?: string): Promise<void> {
  const args = ["build", "src/main.ts", "--compile", "--minify", `--outfile=${saida}`];
  if (alvo) args.push(`--target=${alvo}`);
  const proc = Bun.spawn(["bun", ...args], { stdout: "inherit", stderr: "inherit" });
  const codigo = await proc.exited;
  if (codigo !== 0) throw new Error(`Falha ao compilar ${saida} (código ${codigo}).`);
  console.log(`✓ ${saida}`);
}

if (todos) {
  for (const { alvo, sufixo } of alvos) {
    const ext = sufixo.startsWith("windows") ? ".exe" : "";
    await compilar(`dist/${manifesto.bin}-${sufixo}${ext}`, alvo);
  }
} else {
  await compilar(`dist/${manifesto.bin}`);
}
