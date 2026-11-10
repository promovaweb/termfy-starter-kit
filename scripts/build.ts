/**
 * Compiles the binary with `bun build --compile`.
 *
 * Without arguments, produces `dist/<bin>` for the current platform. With
 * `--all`, produces one executable per supported target, named
 * `dist/<bin>-<target>`. OpenTUI requires the target's native package to be
 * installed; for cross builds run `bun install --os="*" --cpu="*" @opentui/core` first.
 */
import { mkdirSync } from "node:fs";
import { manifest } from "../src/app/manifest.ts";

const targets = [
  { target: "bun-linux-x64", suffix: "linux-x64" },
  { target: "bun-linux-arm64", suffix: "linux-arm64" },
  { target: "bun-darwin-x64", suffix: "darwin-x64" },
  { target: "bun-darwin-arm64", suffix: "darwin-arm64" },
  { target: "bun-windows-x64", suffix: "windows-x64" },
] as const;

const all = process.argv.includes("--all");
mkdirSync("dist", { recursive: true });

async function compile(outfile: string, target?: string): Promise<void> {
  const args = ["build", "src/main.ts", "--compile", "--minify", `--outfile=${outfile}`];
  if (target) args.push(`--target=${target}`);
  const proc = Bun.spawn(["bun", ...args], { stdout: "inherit", stderr: "inherit" });
  const code = await proc.exited;
  if (code !== 0) throw new Error(`Failed to compile ${outfile} (exit code ${code}).`);
  console.log(`✓ ${outfile}`);
}

if (all) {
  for (const { target, suffix } of targets) {
    const ext = suffix.startsWith("windows") ? ".exe" : "";
    await compile(`dist/${manifest.bin}-${suffix}${ext}`, target);
  }
} else {
  await compile(`dist/${manifest.bin}`);
}
