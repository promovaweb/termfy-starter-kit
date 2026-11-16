/**
 * Screen stub with a scrollable selection list, keyboard and mouse.
 * Copy to src/tui/screens/<id>.ts, adjust the imports and register
 * `createExampleScreen()` in src/tui/screens/index.ts.
 *
 * Every command is an action: the shell runs it by key, shows it in the key
 * bar and in the help box, and runs it on a click. List rows are clickable
 * (click selects) and the wheel scrolls the list. The factory keeps the list
 * and the status line per instance, so two mounts of the TUI (or two tests)
 * never share selection or renderables.
 */
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { listPanel } from "../../src/tui/components.ts";
import type { Screen, ScreenAction } from "../../src/tui/screen.ts";

export function createExampleScreen(entries: string[] = ["First item", "Second item", "Third item"]): Screen {
  let items: ReturnType<typeof listPanel> | undefined;
  const actions: ScreenAction[] = [
    { keys: ["up", "k"], label: "↑/k", description: "up", run: () => items?.move(-1) },
    { keys: ["down", "j"], label: "↓/j", description: "down", run: () => items?.move(1) },
    { keys: ["return", "enter"], label: "Enter", description: "select", icon: "select", run: () => items?.select(items.selected()) },
    { keys: ["r"], description: "reset", icon: "refresh", run: () => items?.move(-items.selected()) },
  ];
  return {
    id: "example",
    title: "Example",
    icon: "list",
    description: "Select an item with the keyboard or the mouse",
    actions,
    mount: ({ renderer, theme, icons }) => {
      const root = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });
      const status = new TextRenderable(renderer, { content: "Choose an item", height: 1, flexShrink: 0, fg: theme.textDim });
      items = listPanel(renderer, theme, {
        title: `${icons.list ? `${icons.list} ` : ""}Items`,
        items: entries,
        onSelect: (index) => { status.content = `Selected item ${index + 1}`; },
      });
      root.add(items.box);
      root.add(status);
      return root;
    },
  };
}
