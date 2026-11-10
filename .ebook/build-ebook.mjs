/**
 * Builds and checks the binary user guide as PDF and EPUB.
 *
 * Source: `docs/`, in the order of `docs/reading-order.txt`. It is the same folder
 * embedded in the binary and printed by `--skill`; here the placeholders
 * `{{bin}}`, `{{title}}`, `{{version}}` and `{{BIN}}` are resolved from the
 * `package.json` manifest, as the binary does at runtime.
 * Output: `ebook/<Title>-User-Guide-v<version>.{pdf,epub}`, the aliases
 * `ebook/ebook-<bin>.{pdf,epub}` and the `ebook/build.json` manifest.
 * The ebook version comes from `ebook/VERSION` and is independent of the
 * binary version. Runs with `bun run .ebook/build-ebook.mjs`; `--check` only verifies
 * version, hashes, XML, internal links, sections and fonts.
 * Requires Pandoc, WeasyPrint, ImageMagick, xmllint, poppler-utils and unzip.
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
const PACKAGE_JSON = join(ROOT, "package.json");
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
  if (result.error) fail(`${command} could not run: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} failed: ${(result.stderr || result.stdout).trim()}`);
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

/** Binary identity, read from package.json as the manifest does. */
function manifest() {
  const pkg = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  const block = pkg.termfy ?? {};
  const bin = block.bin ?? pkg.name;
  return {
    bin,
    title: block.title ?? bin,
    version: pkg.version,
    description: pkg.description ?? "",
    author: block.author ?? "",
    repository: block.repository ?? "",
    envPrefix: bin.replace(/[^a-z0-9]/gi, "_").toUpperCase(),
    titleSlug: (block.title ?? bin).replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  };
}
function substitute(text, m) {
  return text.replaceAll("{{bin}}", m.bin).replaceAll("{{title}}", m.title).replaceAll("{{version}}", m.version).replaceAll("{{BIN}}", m.envPrefix);
}
function version() {
  const value = readFileSync(VERSION_FILE, "utf8").trim();
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) fail("ebook/VERSION must contain a stable SemVer.");
  return value;
}
async function pages() {
  const ordered = (await readFile(ORDER_FILE, "utf8")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!ordered.length) fail("docs/reading-order.txt is empty.");
  const seen = new Set();
  const paths = [];
  for (const value of ordered) {
    if (!/^docs\/.*\.md$/.test(value) || seen.has(value)) fail(`invalid reading-order entry: ${value}`);
    const path = join(ROOT, value);
    await readFile(path);
    seen.add(value);
    paths.push(path);
  }
  for (const path of (await filesIn(DOCS_ROOT)).filter((item) => item.endsWith(".md"))) {
    if (!seen.has(rel(path))) fail(`page missing from reading order: ${rel(path)}`);
  }
  return paths;
}
async function sourceHash(paths) {
  const records = [];
  for (const path of paths) records.push(`${rel(path)}\0${await sha256(path)}\n`);
  return createHash("sha256").update(records.join(""), "utf8").digest("hex");
}
function outputs(value, m) {
  const stem = `${m.titleSlug}-User-Guide-v${value}`;
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
    let text = substitute(await readFile(path, "utf8"), m);
    // Links between pages become plain text: the ebook is a single document.
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
  if (manifest.version !== value || manifest.source_sha256 !== await sourceHash(sources)) fail("ebook/build.json is out of date; run bun run ebook.");
  if (manifest.bin !== m.bin || manifest.title !== m.title) fail("ebook/build.json was generated for another identity; run bun run ebook.");
  for (const [kind, path, alias] of [["pdf", paths.pdf, paths.pdfAlias], ["epub", paths.epub, paths.epubAlias]]) {
    const binary = await readFile(path);
    const aliasBinary = await readFile(alias);
    if (!binary.equals(aliasBinary)) fail(`${kind} alias differs from the current edition.`);
    if (manifest.artifacts[kind].sha256 !== await sha256(path)) fail(`${kind} hash differs from the manifest.`);
  }
  run("unzip", ["-tqq", paths.epub]);
  for (const entry of zipEntries(paths.epub).filter((name) => /\.(xhtml|opf|ncx|xml)$/.test(name))) {
    const xml = run("unzip", ["-p", paths.epub, entry]);
    run("xmllint", [entry.endsWith(".xhtml") ? "--html" : "--noout", ...(entry.endsWith(".xhtml") ? ["--noout"] : []), "-"], { input: xml });
  }
  const linkFailures = [...pdfLinkFailures(paths.pdf), ...epubLinkFailures(paths.epub)];
  if (linkFailures.length) fail(`invalid internal links:\n${linkFailures.join("\n")}`);
  const text = run("pdftotext", [paths.pdf, "-"]);
  for (const title of [m.title, "Guia do usuário", "CLI", "TUI", "MCP", "Configuração e credenciais", "Exit codes", "Arquitetura"]) {
    if (!text.includes(title)) fail(`PDF does not contain the section: ${title}`);
  }
  const fonts = run("pdffonts", [paths.pdf]);
  for (const font of ["Inter", "Manrope"]) if (!fonts.includes(font)) fail(`PDF did not embed the ${font} font.`);
  console.log(`OK: ebook v${value} of ${m.bin} in sync with docs/.`);
}
async function build(value, sources, pagePaths, m) {
  await mkdir(BUILD_ROOT, { recursive: true });
  await mkdir(EBOOK_ROOT, { recursive: true });
  const prepared = await preparedPages(pagePaths, m);
  const paths = outputs(value, m);
  const html = join(BUILD_ROOT, `${paths.stem}.html`);
  const cover = join(BUILD_ROOT, `${paths.stem}-cover.png`);
  const footerCss = join(BUILD_ROOT, "footer.css");
  // The PDF footer carries the binary title; the rule lives outside pdf.css
  // so the design system stays generic across derived projects.
  await writeFile(footerCss, `@page { @bottom-center { content: "${m.title.replace(/"/g, "'")} · Guia do usuário · " counter(page) " / " counter(pages); } }\n`);
  run("magick", [LOGO, "-background", "white", "-gravity", "center", "-resize", "1100x", "-extent", "1600x2560", cover]);
  const common = [
    "--from=markdown", "--standalone", "--file-scope", "--toc", "--toc-depth=2",
    `--metadata-file=${METADATA}`,
    "--metadata", `title=${m.title}: guia do usuário`,
    "--metadata", `subtitle=${m.description}`,
    "--metadata", `description=Guia do usuário do ${m.title}: CLI, TUI, servidor MCP, configuração, credenciais e códigos de saída.`,
    "--metadata", `author=${m.author || m.title}`,
    "--metadata", `identifier=${m.repository || m.bin}`,
    "--metadata", `rights=Documentação do ${m.title}`,
    "--metadata", `version=${value}`,
  ];
  run("pandoc", [...prepared.inputs, "--to=html5", ...common, `--template=${TEMPLATE}`, "--variable", `kicker=${m.title}`, "--metadata", `date=${datePtBr()}`, "--output", html], { cwd: prepared.directory });
  run("weasyprint", [html, paths.pdf, "--base-url", SCRIPT_DIR, "--stylesheet", PDF_STYLE, "--stylesheet", footerCss]);
  run("pandoc", [...prepared.inputs, "--to=epub3", ...common, `--css=${EPUB_STYLE}`, `--epub-cover-image=${cover}`, ...FONT_FILES.flatMap((font) => [`--epub-embed-font=${font}`]), "--output", paths.epub], { cwd: prepared.directory });
  const manifest = {
    schema_version: 1,
    version: value,
    edition: `v${value}`,
    bin: m.bin,
    title: m.title,
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
  if (process.argv.length > (onlyCheck ? 3 : 2)) fail("usage: bun run .ebook/build-ebook.mjs [--check]");
  const m = manifest();
  const value = version();
  const pagePaths = await pages();
  const sources = [...(await filesIn(DOCS_ROOT)).filter((p) => p.endsWith(".md") || p.endsWith(".txt")), VERSION_FILE, PDF_STYLE, EPUB_STYLE, TEMPLATE, METADATA, LOGO, PACKAGE_JSON, SCRIPT].sort();
  if (onlyCheck) await check(value, sources, m);
  else await build(value, sources, pagePaths, m);
}

main().catch((error) => { console.error(`Error: ${error.message}`); process.exitCode = 1; });
