/** CLI access to the embedded specification, consistency checks and checklist progress. */
import { manifest } from "../../app/manifest.ts";
import { ExitCode } from "../../app/exit-codes.ts";
import { loadSpec } from "../../spec/index.ts";
import { blocks, section, table } from "../format.ts";
import type { Command } from "../registry.ts";

function summarize(markdown: string, limit = 320): string {
  const text = markdown.replace(/```[^]*?```|~~~[^]*?~~~/g, "")
    .replace(/^\s*[-*+]\s+/gm, "").replace(/\s+/g, " ").trim();
  if (!text) return "Not specified.";
  if (text.length <= limit) return text;
  const excerpt = text.slice(0, limit - 3);
  const boundary = excerpt.lastIndexOf(" ");
  return `${boundary > 0 ? excerpt.slice(0, boundary) : excerpt}...`;
}

const show: Command = {
  name: "show",
  description: "Show the embedded spec front matter, sections and progress.",
  examples: [`${manifest.bin} spec show`, `${manifest.bin} spec show --json`],
  exitCodes: [ExitCode.CONFIG],
  run: () => {
    const { frontmatter, sections, progress } = loadSpec();
    return {
      data: { frontmatter, sections, progress },
      text: () => blocks(
        section(`${frontmatter.title} (${frontmatter.bin})`),
        frontmatter.description,
        table([
          ["Status", frontmatter.status],
          ["Commands", String(frontmatter.commands.length)],
          ["Screens", String(frontmatter.screens.length)],
          ["Tools", String(frontmatter.mcp.tools.length)],
          ["Settings", String(frontmatter.settings.length)],
          ["Credentials", String(frontmatter.credentials.length)],
          ["Checklist", `${progress.done}/${progress.total} (${Number(progress.percent.toFixed(2))}%)`],
        ]),
        section("Purpose"), summarize(sections.Purpose),
        section("Out of scope"), summarize(sections["Out of scope"]),
        "Use spec show --json for the full contract.",
      ),
    };
  },
};

const check: Command = {
  name: "check",
  description: "Validate the embedded spec against the executable registries.",
  options: [{ name: "--strict", description: "Fail on warnings as well as errors. Disabled by default." }],
  examples: [`${manifest.bin} spec check`, `${manifest.bin} spec check --strict --json`],
  exitCodes: [ExitCode.CONFIG],
  run: async (ctx) => {
    // Lazy loading avoids the registry -> command -> checker -> registry cycle.
    const { checkSpec } = await import("../../spec/check.ts");
    const result = checkSpec(loadSpec(), { strict: ctx.options.strict === true });
    return {
      data: result,
      text: () => [result.ok ? "✓ Spec matches the code." : "✗ Spec check failed.",
        ...result.errors.map((message) => `Error: ${message}`),
        ...result.warnings.map((message) => `Warning: ${message}`)].join("\n"),
      code: result.ok ? ExitCode.SUCCESS : ExitCode.CONFIG,
    };
  },
};

const progress: Command = {
  name: "progress",
  description: "Show completed checklist items, total items and percentage.",
  examples: [`${manifest.bin} spec progress`, `${manifest.bin} spec progress --json`],
  exitCodes: [ExitCode.CONFIG],
  run: () => {
    const { progress } = loadSpec();
    return { data: progress, text: () => table([
      ["Done", String(progress.done)], ["Total", String(progress.total)], ["Percent", `${progress.percent}%`],
    ]) };
  },
};

export const specCommand: Command = {
  name: "spec",
  description: "Read and check the embedded CLISPEC.md contract.",
  subcommands: [show, check, progress],
  exitCodes: [ExitCode.CONFIG],
};
