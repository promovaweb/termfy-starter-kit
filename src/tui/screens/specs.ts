/**
 * Specs tab: the specs that evolve the binary, with status and progress,
 * and the details of the selected one.
 *
 * Uses the same data as `spec list` and `spec show <id>`: the files of
 * specs/ when the TUI runs in the project, otherwise the index embedded in
 * CLISPEC.md (without progress or pending items).
 */
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { describeSpec, listSpecs } from "../../cli/commands/spec.ts";
import { findSpec, loadProject, loadSpec } from "../../spec/index.ts";
import { dim, heading, keyValueTable, listPanel, panel, spacer } from "../components.ts";
import type { Screen } from "../screen.ts";

/** Plain-text detail lines for one spec, shared with the tests. */
export function specDetail(id: string): string[] {
  const project = loadProject();
  if (!project) {
    const entry = loadSpec().frontmatter.specs.find((item) => item.id === id);
    return entry ? [`${entry.id} ${entry.title}`, `Status: ${entry.status}`, "Run the TUI in the project folder for tasks and tests."] : [];
  }
  const data = describeSpec(findSpec(project.specs, id));
  const pending = [...data.tasks, ...data.tests].filter((item) => !item.done);
  const goal = data.sections.Goal.replace(/<!--[^]*?-->/g, "").replace(/\s+/g, " ").trim();
  return [
    `${data.frontmatter.id} ${data.frontmatter.title}`,
    `Status: ${data.frontmatter.status}  Progress: ${data.progress.done}/${data.progress.total}`,
    "",
    goal ? (goal.length > 240 ? `${goal.slice(0, 237)}...` : goal) : "Goal not written yet.",
    "",
    pending.length ? "Pending:" : "Nothing pending.",
    ...pending.slice(0, 12).map((item) => `  - ${item.text}`),
  ];
}

export const specsScreen: Screen = {
  id: "specs",
  title: "Specs",
  description: "Specs that evolve the binary, with status and progress",
  keys: [{ key: "↑↓", action: "select spec" }],
  mount: ({ renderer, theme }) => {
    const data = listSpecs();
    const clispec = loadSpec().frontmatter;
    const rootBox = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const rows = data.specs.map((entry) => {
      const progress = "progress" in entry ? ` ${String(entry.progress.done).padStart(2)}/${String(entry.progress.total).padEnd(2)}` : "";
      return `${entry.id}  ${entry.status.padEnd(11)}${progress}  ${entry.title}`;
    });
    const detail = panel(renderer, theme, { title: "Spec", flexGrow: 1 });
    const lines = Array.from({ length: 20 }, () => new TextRenderable(renderer, { content: "", fg: theme.text, height: 1, flexShrink: 0 }));
    for (const line of lines) detail.add(line);
    const show = (index: number) => {
      const entry = data.specs[index];
      const content = entry ? specDetail(entry.id) : ["No specs yet. Create one with spec new <slug>."];
      lines.forEach((line, i) => { line.content = content[i] ?? ""; line.fg = i === 0 ? theme.accent : theme.text; });
    };

    const left = new BoxRenderable(renderer, { flexDirection: "column", width: 64 });
    const list = listPanel(renderer, theme, { title: "Specs", items: rows.length ? rows : ["No specs yet."], onSelect: show });
    left.add(list.box);
    const summary = panel(renderer, theme, { title: "CLISPEC.md", height: 10 });
    summary.add(keyValueTable(renderer, theme, [
      ["Commands", String(clispec.commands.length)],
      ["Screens", String(clispec.screens.length)],
      ["Tools", String(clispec.mcp.tools.length)],
      ["Tables", String(clispec.storage.tables.length)],
    ]));
    summary.add(spacer(renderer));
    summary.add(heading(renderer, theme, "Source"));
    summary.add(dim(renderer, theme, data.source === "files" ? "specs/ in this folder" : "index embedded in the binary"));
    left.add(summary);

    rootBox.add(left);
    rootBox.add(detail);
    show(0);
    specsScreen.onKey = (name) => {
      if (!["up", "down", "k", "j"].includes(name)) return false;
      list.move(name === "up" || name === "k" ? -1 : 1);
      show(list.selected());
      return true;
    };
    return rootBox;
  },
};
