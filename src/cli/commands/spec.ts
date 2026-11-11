/**
 * CLI access to the CLISPEC contract: the embedded `CLISPEC.md` (macro view
 * and delivered surface) and the spec files under `specs/` (one per
 * evolution of the binary).
 *
 * Read commands (`show`, `list`, `progress`, `check`) use the embedded
 * CLISPEC and, when the working directory is the project, the spec files on
 * disk. Write commands (`new`, `close`, `sync --write`, `migrate --write`)
 * need the project on disk and change only `CLISPEC.md` and `specs/`.
 */
import { manifest } from "../../app/manifest.ts";
import { ExitCode } from "../../app/exit-codes.ts";
import { changeCounts } from "../../spec/delta.ts";
import { findSpec, loadProject, loadSpec, type LoadedSpec } from "../../spec/index.ts";
import { OPEN_STATUSES } from "../../spec/schema.ts";
import { blocks, section, table } from "../format.ts";
import type { Command, Context, OptionDefinition } from "../registry.ts";

const FILE_OPTION: OptionDefinition = { name: "--file", argument: { name: "path" }, description: "CLISPEC.md to read and write; specs/ sits next to it.", default: "CLISPEC.md" };
const WRITE_CODES = [ExitCode.CONFIG, ExitCode.PERMISSION];

function fileOf(ctx: Context): string {
  return typeof ctx.options.file === "string" ? ctx.options.file : "CLISPEC.md";
}

function summarize(markdown: string, limit = 320): string {
  const text = markdown.replace(/```[^]*?```|~~~[^]*?~~~|<!--[^]*?-->/g, "")
    .replace(/^\s*[-*+]\s+/gm, "").replace(/\s+/g, " ").trim();
  if (!text) return "Not specified.";
  if (text.length <= limit) return text;
  const excerpt = text.slice(0, limit - 3);
  const boundary = excerpt.lastIndexOf(" ");
  return `${boundary > 0 ? excerpt.slice(0, boundary) : excerpt}...`;
}

const percent = (value: number) => `${Number(value.toFixed(2))}%`;

/** Public view of one spec file, shared by show, list and the MCP tool. */
export function describeSpec({ file, slug, spec }: LoadedSpec) {
  return { file, slug, frontmatter: spec.frontmatter, sections: spec.sections, tasks: spec.tasks, tests: spec.tests, progress: spec.progress };
}

/** Lists specs from disk when available, otherwise from the embedded index. */
export function listSpecs() {
  const project = loadProject();
  if (project) {
    return {
      source: "files" as const,
      specs: project.specs.map(({ spec, slug }) => ({
        id: spec.frontmatter.id, slug, title: spec.frontmatter.title, status: spec.frontmatter.status,
        progress: spec.progress, changes: changeCounts(spec.frontmatter.changes),
      })),
    };
  }
  return { source: "index" as const, specs: loadSpec().frontmatter.specs };
}

const show: Command = {
  name: "show",
  description: "Show CLISPEC.md, or one spec of specs/ when an ID is given.",
  arguments: [{ name: "id", description: "Spec ID, such as 2 or 0002. Without it, shows CLISPEC.md." }],
  examples: [`${manifest.bin} spec show`, `${manifest.bin} spec show 0002 --json`],
  exitCodes: [ExitCode.CONFIG],
  run: (ctx) => {
    const id = ctx.args[0];
    if (id) {
      const loaded = findSpec(loadProject(undefined, { required: true })!.specs, id);
      const data = describeSpec(loaded);
      const { frontmatter, progress } = data;
      const counts = changeCounts(frontmatter.changes);
      const pendingItems = [...data.tasks, ...data.tests].filter((item) => !item.done);
      return {
        data,
        text: () => blocks(
          section(`${frontmatter.id} ${frontmatter.title}`),
          table([
            ["Status", frontmatter.status],
            ["Changes", `+${counts.add} ~${counts.update} -${counts.remove}`],
            ["Tasks", String(data.tasks.length)],
            ["Tests", String(data.tests.length)],
            ["Progress", `${progress.done}/${progress.total} (${percent(progress.percent)})`],
          ]),
          section("Goal"), summarize(data.sections.Goal),
          section("Behavior"), summarize(data.sections.Behavior),
          section("Design"), summarize(data.sections.Design),
          pendingItems.length ? section("Pending") : undefined,
          pendingItems.length ? pendingItems.map((item) => `  - ${item.text} {#${item.id}}`).join("\n") : undefined,
          `Use spec show ${frontmatter.id} --json for the full spec.`,
        ),
      };
    }
    const { frontmatter, sections } = loadSpec();
    const open = frontmatter.specs.filter((entry) => OPEN_STATUSES.includes(entry.status)).length;
    return {
      data: { frontmatter, sections },
      text: () => blocks(
        section(`${frontmatter.title} (${frontmatter.bin})`),
        frontmatter.description,
        table([
          ["Commands", String(frontmatter.commands.length)],
          ["Screens", String(frontmatter.screens.length)],
          ["Tools", String(frontmatter.mcp.tools.length)],
          ["Settings", String(frontmatter.settings.length)],
          ["Credentials", String(frontmatter.credentials.length)],
          ["Specs", `${frontmatter.specs.length} (${open} open)`],
        ]),
        section("Purpose"), summarize(sections.Purpose),
        section("Out of scope"), summarize(sections["Out of scope"]),
        "Use spec show --json for the full contract and spec list for the specs.",
      ),
    };
  },
};

const list: Command = {
  name: "list",
  description: "List the specs with status, progress and change counts.",
  examples: [`${manifest.bin} spec list`, `${manifest.bin} spec list --json`],
  exitCodes: [ExitCode.CONFIG],
  run: () => {
    const data = listSpecs();
    return {
      data,
      text: () => {
        if (!data.specs.length) return "No specs yet. Create one with spec new <slug>.";
        const rows: Array<[string, string]> = data.source === "files"
          ? data.specs.map((entry) => [entry.id, `${entry.status.padEnd(11)} ${`${entry.progress.done}/${entry.progress.total}`.padEnd(7)} ${`+${entry.changes.add} ~${entry.changes.update} -${entry.changes.remove}`.padEnd(10)} ${entry.title}`])
          : data.specs.map((entry) => [entry.id, `${entry.status.padEnd(11)} ${entry.title}`]);
        return blocks(table(rows), data.source === "index" ? "From the CLISPEC.md index; run inside the project for progress." : undefined);
      },
    };
  },
};

const check: Command = {
  name: "check",
  description: "Validate CLISPEC.md against the executable registries and the specs against CLISPEC.md.",
  options: [{ name: "--strict", description: "Fail on warnings as well as errors. Disabled by default." }],
  examples: [`${manifest.bin} spec check`, `${manifest.bin} spec check --strict --json`],
  exitCodes: [ExitCode.CONFIG],
  run: async (ctx) => {
    // Lazy loading avoids the registry -> command -> checker -> registry cycle.
    const { checkSpec } = await import("../../spec/check.ts");
    const project = loadProject();
    const { actualTables } = await import("../../spec/storage.ts");
    const tables = await actualTables();
    const result = checkSpec(loadSpec(), { strict: ctx.options.strict === true, ...(project ? { specs: project.specs } : {}), ...(tables ? { tables } : {}) });
    return {
      data: result,
      text: () => [result.ok ? "✓ Spec matches the code." : "✗ Spec check failed.",
        ...result.errors.map((message) => `Error: ${message}`),
        ...result.warnings.map((message) => `Warning: ${message}`),
        ...result.pending.map((message) => `Pending: ${message}`)].join("\n"),
      code: result.ok ? ExitCode.SUCCESS : ExitCode.CONFIG,
    };
  },
};

const progress: Command = {
  name: "progress",
  description: "Show completed tasks and tests of one spec, or of every open spec.",
  arguments: [{ name: "id", description: "Spec ID. Without it, sums the open specs." }],
  examples: [`${manifest.bin} spec progress`, `${manifest.bin} spec progress 0002 --json`],
  exitCodes: [ExitCode.CONFIG],
  run: (ctx) => {
    const id = ctx.args[0];
    const specs = loadProject()?.specs ?? [];
    if (id) {
      const { spec } = findSpec(loadProject(undefined, { required: true })!.specs, id);
      const value = { id: spec.frontmatter.id, status: spec.frontmatter.status, ...spec.progress };
      return { data: value, text: () => table([["Done", String(value.done)], ["Total", String(value.total)], ["Percent", percent(value.percent)]]) };
    }
    const open = specs.filter(({ spec }) => OPEN_STATUSES.includes(spec.frontmatter.status))
      .map(({ spec }) => ({ id: spec.frontmatter.id, title: spec.frontmatter.title, status: spec.frontmatter.status, ...spec.progress }));
    const done = open.reduce((sum, entry) => sum + entry.done, 0);
    const total = open.reduce((sum, entry) => sum + entry.total, 0);
    const data = { open: open.length, done, total, percent: total ? done / total * 100 : 0, specs: open };
    return {
      data,
      text: () => blocks(
        table([["Open specs", String(data.open)], ["Done", String(done)], ["Total", String(total)], ["Percent", percent(data.percent)]]),
        open.length ? table(open.map((entry): [string, string] => [entry.id, `${entry.status.padEnd(11)} ${`${entry.done}/${entry.total}`.padEnd(7)} ${entry.title}`])) : undefined,
      ),
    };
  },
};

const create: Command = {
  name: "new",
  description: "Create specs/NNNN-<slug>.md as a draft and add it to the CLISPEC.md index.",
  arguments: [{ name: "slug", description: "Kebab-case name of the change, such as orders-export.", required: true }],
  options: [{ name: "--title", argument: { name: "text" }, description: "Spec title. Defaults to the slug in words." }, FILE_OPTION],
  examples: [`${manifest.bin} spec new orders-export --title "Export orders to CSV"`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { createSpec } = await import("../../spec/files.ts");
    const result = createSpec({ slug: ctx.args[0] as string, file: fileOf(ctx), ...(typeof ctx.options.title === "string" ? { title: ctx.options.title } : {}) });
    return { data: result, text: () => `Created spec ${result.id} (${result.title}) at ${result.file}.` };
  },
};

const close: Command = {
  name: "close",
  description: "Apply a finished spec to CLISPEC.md and mark it done.",
  longDescription:
    "Requires every task and test of the spec checked, applies its changes (add, update,\n" +
    "remove) to the CLISPEC.md surface, sets status done and closedAt, and updates the index.\n" +
    "Also requires Goal, Behavior and Design and adds a dated line to the CLISPEC.md Notes.\n" +
    "Refuses, without writing, when the changes conflict with CLISPEC.md or when the result\n" +
    "fails spec check against the code and, when the binary has a database, the migrations.",
  arguments: [{ name: "id", description: "Spec ID, such as 2 or 0002.", required: true }],
  options: [FILE_OPTION],
  examples: [`${manifest.bin} spec close 0002`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { closeSpec } = await import("../../spec/files.ts");
    const { actualTables } = await import("../../spec/storage.ts");
    const tables = await actualTables();
    const result = closeSpec({ id: ctx.args[0] as string, file: fileOf(ctx), ...(tables ? { tables } : {}) });
    return { data: result, text: () => [`Spec ${result.id} closed into CLISPEC.md.`, ...result.check.warnings.map((message) => `Warning: ${message}`)].join("\n") };
  },
};

const sync: Command = {
  name: "sync",
  description: "List code entries missing from CLISPEC.md and, with --write, append them as a draft.",
  longDescription:
    "Compares CLISPEC.md (from --file, or the embedded copy when the file is absent) with the\n" +
    "registry, screens, MCP catalog and settings schema, and builds the entries the code has and\n" +
    "the spec lacks, leaving out those an open spec already adds. With --write, rewrites the front\n" +
    "matter with those entries appended and the spec index refreshed from specs/, keeping the\n" +
    "Markdown body. With --spec, the entries go to the changes.add of that open spec instead, so\n" +
    "spec close brings them in and the adoption stays in the history. Review the draft: tool\n" +
    "effects default to read and descriptions come from the code.",
  options: [
    { name: "--write", description: "Write the missing entries (to CLISPEC.md, or to the spec given by --spec)." },
    { name: "--spec", argument: { name: "id" }, description: "Open spec that receives the entries in changes.add instead of CLISPEC.md." },
    FILE_OPTION,
  ],
  examples: [`${manifest.bin} spec sync`, `${manifest.bin} spec sync --write`, `${manifest.bin} spec sync --write --spec 0004`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { addToSpec, computeSync, mergedFrontmatter } = await import("../../spec/sync.ts");
    const { writeFrontmatter } = await import("../../spec/files.ts");
    const file = fileOf(ctx);
    const write = ctx.options.write === true;
    const specId = typeof ctx.options.spec === "string" ? ctx.options.spec : undefined;
    const project = loadProject(file, { required: write || specId !== undefined });
    const clispec = project?.clispec ?? loadSpec();
    const additions = computeSync(clispec, project?.specs);
    const target = specId && project ? findSpec(project.specs, specId) : undefined;
    if (write && project) {
      if (target) {
        const next = addToSpec(target, additions);
        writeFrontmatter(target.file, next);
        const index = project.specs.map((entry) => entry === target ? { ...entry, spec: { ...entry.spec, frontmatter: next } } : entry);
        writeFrontmatter(project.file, mergedFrontmatter(clispec, { ...additions, commands: [], screens: [], tools: [], resources: [], prompts: [], settings: [], total: 0 }, new Date(), index));
      } else writeFrontmatter(project.file, mergedFrontmatter(clispec, additions, new Date(), project.specs));
    }
    const destination = target ? target.file : file;
    const summary: Array<[string, string]> = [
      ["Commands", String(additions.commands.length)], ["Screens", String(additions.screens.length)],
      ["Tools", String(additions.tools.length)], ["Resources", String(additions.resources.length)],
      ["Prompts", String(additions.prompts.length)], ["Settings", String(additions.settings.length)],
    ];
    return {
      data: { file: destination, written: write, ...additions },
      text: () => blocks(
        section(additions.total ? `${additions.total} entries missing from the spec` : "Spec already covers the code"),
        table(summary),
        additions.commands.length ? additions.commands.map((c) => `  + command ${c.path}`).join("\n") : undefined,
        write ? `Front matter of ${destination} rewritten.` : additions.total ? `Run with --write to append them to ${destination}.` : undefined,
      ),
    };
  },
};

const migrate: Command = {
  name: "migrate",
  description: "Convert a schemaVersion 1.0.0 CLISPEC.md to 2.0.0, moving its checklist into specs/.",
  options: [{ name: "--write", description: "Write the converted files. Without it, only reports the plan." }, FILE_OPTION],
  examples: [`${manifest.bin} spec migrate`, `${manifest.bin} spec migrate --write`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { migrateClispec } = await import("../../spec/files.ts");
    const write = ctx.options.write === true;
    const result = migrateClispec({ file: fileOf(ctx), write });
    return {
      data: result,
      text: () => {
        if (!result.needed) return `${result.file} already uses schemaVersion 2.0.0.`;
        const target = result.spec ? `checklist (${result.spec.items} items) moves to ${result.spec.file}` : "no checklist items to move";
        return write ? `Migrated ${result.file}; ${target}.` : `Plan: convert ${result.file} to 2.0.0; ${target}. Run with --write to apply.`;
      },
    };
  },
};

const lifecycle = (name: "start" | "block" | "archive", status: "in_progress" | "blocked" | "archived", description: string): Command => ({
  name,
  description,
  arguments: [{ name: "id", description: "Spec ID, such as 2 or 0002.", required: true }],
  options: [...(status === "in_progress" ? [] : [{ name: "--reason", argument: { name: "text" }, description: `Why the spec is ${status}; stored as ${status === "blocked" ? "blockedReason" : "archivedReason"}.` }]), FILE_OPTION],
  examples: [`${manifest.bin} spec ${name} 0002${status === "in_progress" ? "" : ` --reason "Waiting for the API key"`}`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { setStatus } = await import("../../spec/edit.ts");
    const result = setStatus({ id: ctx.args[0] as string, status, file: fileOf(ctx), ...(typeof ctx.options.reason === "string" ? { reason: ctx.options.reason } : {}) });
    return { data: result, text: () => `Spec ${result.id}: ${result.from} → ${result.to}.` };
  },
});

const itemAdd = (section: "Tasks" | "Tests"): Command => ({
  name: "add",
  description: `Append a ${section === "Tasks" ? "task" : "test"} to a spec with a generated {#id}.`,
  arguments: [
    { name: "id", description: "Spec ID, such as 2 or 0002.", required: true },
    { name: "text", description: section === "Tasks" ? "What to deliver, naming the command, tool, screen, setting or table." : "Command to run and the expected result.", required: true, variadic: true },
  ],
  options: [...(section === "Tasks" ? [{ name: "--tag", argument: { name: "skill" }, description: "Skill tag of the task: the skill responsible, such as termfy-cli." }] : []), FILE_OPTION],
  examples: [section === "Tasks" ? `${manifest.bin} spec task add 0002 Implement orders export --tag termfy-cli` : `${manifest.bin} spec test add 0002 "orders export --json returns { file, count }"`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { addItem } = await import("../../spec/edit.ts");
    const [id, ...words] = ctx.args;
    const result = addItem({ id: id as string, section, text: words.join(" "), file: fileOf(ctx), ...(typeof ctx.options.tag === "string" ? { skill: ctx.options.tag } : {}) });
    return { data: result, text: () => `Added {#${result.item}} to ${result.section} of spec ${result.id}.` };
  },
});

const done: Command = {
  name: "done",
  description: "Mark a task or test of a spec as done by its {#id}.",
  arguments: [
    { name: "id", description: "Spec ID, such as 2 or 0002.", required: true },
    { name: "item", description: "Four-character item ID, without {#}.", required: true },
  ],
  options: [{ name: "--undo", description: "Unmark the item instead." }, FILE_OPTION],
  examples: [`${manifest.bin} spec done 0002 a1b2`, `${manifest.bin} spec done 0002 a1b2 --undo`],
  exitCodes: WRITE_CODES,
  run: async (ctx) => {
    const { markItem } = await import("../../spec/edit.ts");
    const result = markItem({ id: ctx.args[0] as string, item: ctx.args[1] as string, done: ctx.options.undo !== true, file: fileOf(ctx) });
    return { data: result, text: () => `Spec ${result.id}: {#${result.item}} ${result.done ? "done" : "pending"}.` };
  },
};

const task: Command = { name: "task", description: "Manage the tasks of a spec.", subcommands: [itemAdd("Tasks")], exitCodes: WRITE_CODES };
const test: Command = { name: "test", description: "Manage the acceptance tests of a spec.", subcommands: [itemAdd("Tests")], exitCodes: WRITE_CODES };

export const specCommand: Command = {
  name: "spec",
  description: "Read and evolve the CLISPEC.md contract and its specs.",
  subcommands: [
    show, list, progress, check, create,
    lifecycle("start", "in_progress", "Move a draft or blocked spec to in_progress."),
    lifecycle("block", "blocked", "Mark an open spec as blocked, with a reason."),
    lifecycle("archive", "archived", "Archive an open spec without applying its changes, with a reason."),
    task, test, done, close, sync, migrate,
  ],
  exitCodes: WRITE_CODES,
};
