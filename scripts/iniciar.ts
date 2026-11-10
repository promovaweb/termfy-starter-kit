/**
 * Personaliza o template para um binário novo.
 *
 * Uso:
 *   bun run iniciar -- --nome meucli [--titulo "Meu CLI"] [--descricao "..."]
 *                      [--autor "Org"] [--repositorio URL] [--site URL]
 *
 * Reescreve package.json (name, bin, description, bloco termfy), .env.example
 * e as menções literais a "termfy"/"Termfy" em README.md, AGENTS.md,
 * CHANGELOG.md e .github/workflows/*.yml. Não toca em src/ nem em docs/, que
 * leem a identidade do manifesto em tempo de execução. Imprime o que mudou e
 * encerra com 0; argumentos inválidos encerram com 2.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
function opcao(nome: string): string | undefined {
  const i = argv.indexOf(`--${nome}`);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  return v && !v.startsWith("--") ? v : undefined;
}

const nome = opcao("nome");
if (!nome || !/^[a-z][a-z0-9-]{1,39}$/.test(nome)) {
  console.error('Informe --nome com letras minúsculas, números e hífen (2 a 40 caracteres), começando por letra.');
  process.exit(2);
}
const titulo = opcao("titulo") ?? nome;
const descricao = opcao("descricao");
const autor = opcao("autor");
const repositorio = opcao("repositorio");
const site = opcao("site");

const pacotePath = "package.json";
const pacote = JSON.parse(readFileSync(pacotePath, "utf8"));
const antigo: string = pacote.termfy?.bin ?? pacote.name;
const antigoTitulo: string = pacote.termfy?.titulo ?? antigo;

pacote.name = nome;
pacote.bin = { [nome]: "src/main.ts" };
if (descricao) pacote.description = descricao;
pacote.termfy = {
  bin: nome,
  titulo,
  autor: autor ?? pacote.termfy?.autor ?? "",
  site: site ?? pacote.termfy?.site ?? "",
  repositorio: repositorio ?? pacote.termfy?.repositorio ?? "",
  framework: pacote.termfy?.framework ?? "https://github.com/promovaweb/termfy",
};
if (repositorio) pacote.repository = { type: "git", url: `git+${repositorio}.git` };
writeFileSync(pacotePath, `${JSON.stringify(pacote, null, 2)}\n`);
console.log(`✓ package.json: ${antigo} → ${nome}`);

const alvos = [".env.example", "README.md", "AGENTS.md", "CHANGELOG.md"];
try {
  for (const f of readdirSync(".github/workflows")) alvos.push(join(".github/workflows", f));
} catch {
  // Sem workflows, segue.
}
const prefixoAntigo = antigo.replace(/[^a-z0-9]/gi, "_").toUpperCase();
const prefixoNovo = nome.replace(/[^a-z0-9]/gi, "_").toUpperCase();
for (const arquivo of alvos) {
  let texto: string;
  try {
    texto = readFileSync(arquivo, "utf8");
  } catch {
    continue;
  }
  const novo = texto
    .replaceAll(`${prefixoAntigo}_`, `${prefixoNovo}_`)
    .replaceAll(antigoTitulo, titulo)
    .replaceAll(antigo, nome);
  if (novo !== texto) {
    writeFileSync(arquivo, novo);
    console.log(`✓ ${arquivo}`);
  }
}
console.log(`\nPronto. Confira com: bun run dev -- --version && bun run dev -- --help`);
