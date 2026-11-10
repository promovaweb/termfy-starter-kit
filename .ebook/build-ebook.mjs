/**
 * Gera e confere o guia do usuário do binário em PDF e EPUB.
 *
 * Fonte: `docs/`, na ordem de `docs/reading-order.txt`. É a mesma pasta
 * embutida no binário e impressa por `--skill`; aqui os placeholders
 * `{{bin}}`, `{{titulo}}`, `{{versao}}` e `{{BIN}}` são resolvidos pelo
 * manifesto do `package.json`, como o binário faz em tempo de execução.
 * Saída: `ebook/<Titulo>-Guia-do-Usuario-v<versão>.{pdf,epub}`, os aliases
 * `ebook/ebook-<bin>.{pdf,epub}` e o manifesto `ebook/build.json`.
 * A versão do ebook vem de `ebook/VERSION` e é independente da versão do
 * binário. Roda com `bun run .ebook/build-ebook.mjs`; `--check` só confere
 * versão, hashes, XML, links internos, seções e fontes.
 * Requer Pandoc, WeasyPrint, ImageMagick, xmllint, poppler-utils e unzip.
 */

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { posix } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "..");
const DOCS_ROOT = join(ROOT, "docs");
const EBOOK_ROOT = join(ROOT, "ebook");
const BUILD_ROOT = join(SCRIPT_DIR, "build");
const ORDER_FILE = join(DOCS_ROOT, "reading-order.txt");
const VERSION_FILE = join(EBOOK_ROOT, "VERSION");
const MANIFEST = join(EBOOK_ROOT, "build.json");
const PDF_STYLE = join(SCRIPT_DIR, "pdf.css");
const EPUB_STYLE = join(SCRIPT_DIR, "epub.css");
const TEMPLATE = join(SCRIPT_DIR, "template.html");
const METADATA = join(SCRIPT_DIR, "metadata.yaml");
const LOGO = join(SCRIPT_DIR, "assets", "logo.png");
const PACOTE = join(ROOT, "package.json");
const SCRIPT = fileURLToPath(import.meta.url);
const REQUIRE = createRequire(import.meta.url);
const FONT_FILES = [
  REQUIRE.resolve("@fontsource/inter/files/inter-latin-400-normal.woff2"),
  REQUIRE.resolve("@fontsource/inter/files/inter-latin-700-normal.woff2"),
  REQUIRE.resolve("@fontsource/manrope/files/manrope-latin-600-normal.woff2"),
  REQUIRE.resolve("@fontsource/manrope/files/manrope-latin-800-normal.woff2"),
];

function fail(message) { throw new Error(message); }
function rel(path) { return relative(ROOT, path).split("\\").join("/"); }
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd ?? ROOT, encoding: "utf8", input: options.input, maxBuffer: 32 * 1024 * 1024 });
  if (result.error) fail(`${command} não pôde ser executado: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} falhou: ${(result.stderr || result.stdout).trim()}`);
  return result.stdout || "";
}
async function sha256(path) { return createHash("sha256").update(await readFile(path)).digest("hex"); }
async function filesIn(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) result.push(...await filesIn(path));
    else if (entry.isFile()) result.push(path);
  }
  return result.sort();
}

/** Identidade do binário, lida do package.json como o manifesto faz. */
function manifesto() {
  const pacote = JSON.parse(readFileSync(PACOTE, "utf8"));
  const bloco = pacote.termfy ?? {};
  const bin = bloco.bin ?? pacote.name;
  return {
    bin,
    titulo: bloco.titulo ?? bin,
    versao: pacote.version,
    descricao: pacote.description ?? "",
    autor: bloco.autor ?? "",
    repositorio: bloco.repositorio ?? "",
    prefixoEnv: bin.replace(/[^a-z0-9]/gi, "_").toUpperCase(),
    slugTitulo: (bloco.titulo ?? bin).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  };
}
function substituir(texto, m) {
  return texto.replaceAll("{{bin}}", m.bin).replaceAll("{{titulo}}", m.titulo).replaceAll("{{versao}}", m.versao).replaceAll("{{BIN}}", m.prefixoEnv);
}
function version() {
  const value = readFileSync(VERSION_FILE, "utf8").trim();
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) fail("ebook/VERSION deve conter SemVer estável.");
  return value;
}
async function pages() {
  const ordered = (await readFile(ORDER_FILE, "utf8")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!ordered.length) fail("docs/reading-order.txt está vazio.");
  const seen = new Set();
  const paths = [];
  for (const value of ordered) {
    if (!/^docs\/.*\.md$/.test(value) || seen.has(value)) fail(`entrada inválida na ordem de leitura: ${value}`);
    const path = join(ROOT, value);
    await readFile(path);
    seen.add(value);
    paths.push(path);
  }
  for (const path of (await filesIn(DOCS_ROOT)).filter((item) => item.endsWith(".md"))) {
    if (!seen.has(rel(path))) fail(`página fora da ordem de leitura: ${rel(path)}`);
  }
  return paths;
}
async function sourceHash(paths) {
  const records = [];
  for (const path of paths) records.push(`${rel(path)}\0${await sha256(path)}\n`);
  return createHash("sha256").update(records.join(""), "utf8").digest("hex");
}
function outputs(value, m) {
  const stem = `${m.slugTitulo}-Guia-do-Usuario-v${value}`;
  return {
    stem,
    pdf: join(EBOOK_ROOT, `${stem}.pdf`),
    epub: join(EBOOK_ROOT, `${stem}.epub`),
    pdfAlias: join(EBOOK_ROOT, `ebook-${m.bin}.pdf`),
    epubAlias: join(EBOOK_ROOT, `ebook-${m.bin}.epub`),
  };
}
async function preparedPages(paths, m) {
  const directory = join(BUILD_ROOT, "pages");
  await mkdir(directory, { recursive: true });
  const inputs = [];
  const htmlAssets = join(BUILD_ROOT, "assets");
  await mkdir(htmlAssets, { recursive: true });
  await copyFile(LOGO, join(htmlAssets, "logo.png"));
  for (const path of paths) {
    const name = path.split(/[\\/]/).pop();
    let text = substituir(await readFile(path, "utf8"), m);
    // Links entre páginas viram texto: no ebook tudo é um documento só.
    text = text.replace(/(?<!!)\[([^\]]+)\]\((?!https?:|mailto:|tel:)[^)]+\)/g, "$1");
    await writeFile(join(directory, name), text);
    inputs.push(name);
  }
  return { directory, inputs };
}
function zipEntries(epub) {
  return run("unzip", ["-Z1", epub]).split(/\r?\n/).filter(Boolean);
}
function isExternal(target) { return /^[a-z][a-z\d+.-]*:/i.test(target) || target.startsWith("//"); }
function epubLinkFailures(epub) {
  const names = new Set(zipEntries(epub));
  const documents = new Map();
  for (const name of [...names].filter((entry) => /\.x?html$/.test(entry))) {
    const text = run("unzip", ["-p", epub, name]);
    documents.set(name, { text, ids: new Set([...text.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => match[1])) });
  }
  const failures = [];
  for (const [name, document] of documents) {
    for (const match of document.text.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      const target = decodeURIComponent(match[1]);
      if (isExternal(target) || target.startsWith("data:")) continue;
      const [pathPart, fragment = ""] = target.split("#");
      const resolved = pathPart ? posix.normalize(posix.join(posix.dirname(name), pathPart)) : name;
      if (!names.has(resolved)) { failures.push(`${name} -> ${target}`); continue; }
      if (fragment && documents.has(resolved) && !documents.get(resolved).ids.has(fragment)) failures.push(`${name} -> #${fragment}`);
    }
  }
  return failures;
}
function pdfLinkFailures(pdf) {
  const xml = run("pdftohtml", ["-xml", "-hidden", "-i", pdf, "-stdout"]);
  const pages = new Set([...xml.matchAll(/<page\b[^>]*\bnumber=["']([^"']+)["']/gi)].map((match) => match[1]));
  const failures = [];
  for (const match of xml.matchAll(/\bhref=["']([^"']+)["']/gi)) {
    const target = match[1];
    if (isExternal(target)) continue;
    const fragment = target.includes("#") ? target.slice(target.indexOf("#") + 1) : "";
    if (fragment && !pages.has(fragment)) failures.push(target);
  }
  return failures;
}
function datePtBr() {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric" }).format(new Date());
}
async function check(value, sources, m) {
  const paths = outputs(value, m);
  const manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  if (manifest.version !== value || manifest.source_sha256 !== await sourceHash(sources)) fail("ebook/build.json está desatualizado; execute bun run ebook.");
  if (manifest.bin !== m.bin || manifest.titulo !== m.titulo) fail("ebook/build.json foi gerado para outra identidade; execute bun run ebook.");
  for (const [kind, path, alias] of [["pdf", paths.pdf, paths.pdfAlias], ["epub", paths.epub, paths.epubAlias]]) {
    const binary = await readFile(path);
    const aliasBinary = await readFile(alias);
    if (!binary.equals(aliasBinary)) fail(`alias ${kind} diverge da edição vigente.`);
    if (manifest.artifacts[kind].sha256 !== await sha256(path)) fail(`hash de ${kind} diverge do manifesto.`);
  }
  run("unzip", ["-tqq", paths.epub]);
  for (const entry of zipEntries(paths.epub).filter((name) => /\.(xhtml|opf|ncx|xml)$/.test(name))) {
    const xml = run("unzip", ["-p", paths.epub, entry]);
    run("xmllint", [entry.endsWith(".xhtml") ? "--html" : "--noout", ...(entry.endsWith(".xhtml") ? ["--noout"] : []), "-"], { input: xml });
  }
  const linkFailures = [...pdfLinkFailures(paths.pdf), ...epubLinkFailures(paths.epub)];
  if (linkFailures.length) fail(`links internos inválidos:\n${linkFailures.join("\n")}`);
  const text = run("pdftotext", [paths.pdf, "-"]);
  for (const title of [m.titulo, "Guia do usuário", "CLI", "TUI", "MCP", "Configuração e credenciais", "Códigos de saída", "Arquitetura"]) {
    if (!text.includes(title)) fail(`PDF não contém a seção: ${title}`);
  }
  const fonts = run("pdffonts", [paths.pdf]);
  for (const font of ["Inter", "Manrope"]) if (!fonts.includes(font)) fail(`PDF não incorporou a fonte ${font}.`);
  console.log(`OK: ebook v${value} de ${m.bin} sincronizado com docs/.`);
}
async function build(value, sources, pagePaths, m) {
  await mkdir(BUILD_ROOT, { recursive: true });
  await mkdir(EBOOK_ROOT, { recursive: true });
  const prepared = await preparedPages(pagePaths, m);
  const paths = outputs(value, m);
  const html = join(BUILD_ROOT, `${paths.stem}.html`);
  const cover = join(BUILD_ROOT, `${paths.stem}-cover.png`);
  const rodape = join(BUILD_ROOT, "rodape.css");
  // O rodapé do PDF leva o título do binário; a regra fica fora do pdf.css
  // para que o design system continue genérico entre projetos derivados.
  await writeFile(rodape, `@page { @bottom-center { content: "${m.titulo.replace(/"/g, "'")} · Guia do usuário · " counter(page) " / " counter(pages); } }\n`);
  run("magick", [LOGO, "-background", "white", "-gravity", "center", "-resize", "1100x", "-extent", "1600x2560", cover]);
  const common = [
    "--from=markdown", "--standalone", "--file-scope", "--toc", "--toc-depth=2",
    `--metadata-file=${METADATA}`,
    "--metadata", `title=${m.titulo}: guia do usuário`,
    "--metadata", `subtitle=${m.descricao}`,
    "--metadata", `description=Guia do usuário do ${m.titulo}: CLI, TUI, servidor MCP, configuração, credenciais e códigos de saída.`,
    "--metadata", `author=${m.autor || m.titulo}`,
    "--metadata", `identifier=${m.repositorio || m.bin}`,
    "--metadata", `rights=Documentação do ${m.titulo}`,
    "--metadata", `version=${value}`,
  ];
  run("pandoc", [...prepared.inputs, "--to=html5", ...common, `--template=${TEMPLATE}`, "--variable", `kicker=${m.titulo}`, "--metadata", `date=${datePtBr()}`, "--output", html], { cwd: prepared.directory });
  run("weasyprint", [html, paths.pdf, "--base-url", SCRIPT_DIR, "--stylesheet", PDF_STYLE, "--stylesheet", rodape]);
  run("pandoc", [...prepared.inputs, "--to=epub3", ...common, `--css=${EPUB_STYLE}`, `--epub-cover-image=${cover}`, ...FONT_FILES.flatMap((font) => [`--epub-embed-font=${font}`]), "--output", paths.epub], { cwd: prepared.directory });
  const manifest = {
    schema_version: 1,
    version: value,
    edition: `v${value}`,
    bin: m.bin,
    titulo: m.titulo,
    generated_at: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    source_sha256: await sourceHash(sources),
    sources: sources.map(rel).sort(),
    artifacts: {
      pdf: { file: paths.pdf.split(/[\\/]/).pop(), sha256: await sha256(paths.pdf) },
      epub: { file: paths.epub.split(/[\\/]/).pop(), sha256: await sha256(paths.epub) },
    },
  };
  await writeFile(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`);
  await copyFile(paths.pdf, paths.pdfAlias);
  await copyFile(paths.epub, paths.epubAlias);
  await check(value, sources, m);
}
async function main() {
  const onlyCheck = process.argv[2] === "--check";
  if (process.argv.length > (onlyCheck ? 3 : 2)) fail("uso: bun run .ebook/build-ebook.mjs [--check]");
  const m = manifesto();
  const value = version();
  const pagePaths = await pages();
  const sources = [...(await filesIn(DOCS_ROOT)).filter((p) => p.endsWith(".md") || p.endsWith(".txt")), VERSION_FILE, PDF_STYLE, EPUB_STYLE, TEMPLATE, METADATA, LOGO, PACOTE, SCRIPT].sort();
  if (onlyCheck) await check(value, sources, m);
  else await build(value, sources, pagePaths, m);
}

main().catch((error) => { console.error(`Erro: ${error.message}`); process.exitCode = 1; });
