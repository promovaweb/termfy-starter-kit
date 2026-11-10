/**
 * TUI screen stub. Copy to src/tui/screens/<id>.ts, adjust the imports and
 * register it in src/tui/screens/index.ts. If the id can be an initial tab,
 * add it to tui.initialTab (src/config/settings.ts) and to --tab.
 */
import { BoxRenderable } from "@opentui/core";
import { list, panel, dim, keyValueTable, heading } from "../../src/tui/components.ts";
import type { Screen } from "../../src/tui/screen.ts";

export const exampleScreen: Screen = {
  id: "example",
  title: "Example",
  description: "One line about what this tab shows",
  keys: [{ key: "r", action: "reload" }],
  mount: ({ renderer, theme }) => {
    const rootBox = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const row = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const main = panel(renderer, theme, { title: "Main", flexGrow: 1, active: true });
    main.add(heading(renderer, theme, "Values"));
    main.add(
      keyValueTable(renderer, theme, [
        ["Key", "value"],
        ["State", "ok", theme.ok],
      ]),
    );
    row.add(main);

    const side = panel(renderer, theme, { title: "Side", width: 40 });
    side.add(dim(renderer, theme, "Explain the panel in one sentence."));
    side.add(list(renderer, theme, ["item one", "item two"]));
    row.add(side);

    rootBox.add(row);
    return rootBox;
  },
  onKey: (name) => {
    if (name === "r") {
      // Reload data here and update the TextRenderables kept in closure.
      return true;
    }
    return false;
  },
};
