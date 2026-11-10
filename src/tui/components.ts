/**
 * Visual components shared by the screens.
 *
 * `panel` creates a box with a rounded border and a title. `keyValueRow`
 * builds "label  value" with a dimmed label. `list` stacks items with a
 * marker. Everything receives the theme so screens never hard-code colors.
 */
import { BoxRenderable, TextRenderable, TextAttributes, type CliRenderer } from "@opentui/core";
import { glyphs, type Theme } from "./theme.ts";

export function panel(
  renderer: CliRenderer,
  theme: Theme,
  options: { title: string; flexGrow?: number; width?: number | "auto" | `${number}%`; height?: number | "auto" | `${number}%`; active?: boolean },
): BoxRenderable {
  return new BoxRenderable(renderer, {
    flexGrow: options.flexGrow,
    width: options.width,
    height: options.height,
    flexDirection: "column",
    borderStyle: "rounded",
    borderColor: options.active ? theme.borderActive : theme.border,
    title: ` ${options.title} `,
    titleColor: options.active ? theme.accent : theme.textDim,
    backgroundColor: theme.surface,
    paddingLeft: 1,
    paddingRight: 1,
  });
}

export function keyValueRow(
  renderer: CliRenderer,
  theme: Theme,
  key: string,
  value: string,
  keyWidth: number,
  valueColor?: string,
): BoxRenderable {
  const row = new BoxRenderable(renderer, { flexDirection: "row", height: 1 });
  row.add(new TextRenderable(renderer, { content: key.padEnd(keyWidth), fg: theme.textDim, selectable: false }));
  row.add(new TextRenderable(renderer, { content: "  " }));
  row.add(new TextRenderable(renderer, { content: value, fg: valueColor ?? theme.text, wrapMode: "none" }));
  return row;
}

export function keyValueTable(renderer: CliRenderer, theme: Theme, pairs: Array<[string, string, string?]>): BoxRenderable {
  const box = new BoxRenderable(renderer, { flexDirection: "column" });
  const width = Math.max(...pairs.map(([k]) => k.length));
  for (const [k, v, c] of pairs) box.add(keyValueRow(renderer, theme, k, v, width, c));
  return box;
}

export function heading(renderer: CliRenderer, theme: Theme, text: string): TextRenderable {
  return new TextRenderable(renderer, { content: text, fg: theme.textStrong, attributes: TextAttributes.BOLD });
}

export function dim(renderer: CliRenderer, theme: Theme, text: string): TextRenderable {
  return new TextRenderable(renderer, { content: text, fg: theme.textDim });
}

export function list(renderer: CliRenderer, theme: Theme, items: string[], marker = glyphs.bullet): BoxRenderable {
  const box = new BoxRenderable(renderer, { flexDirection: "column" });
  for (const item of items) {
    const row = new BoxRenderable(renderer, { flexDirection: "row" });
    row.add(new TextRenderable(renderer, { content: `${marker} `, fg: theme.accent }));
    row.add(new TextRenderable(renderer, { content: item, fg: theme.text }));
    box.add(row);
  }
  return box;
}

export function spacer(renderer: CliRenderer, height = 1): BoxRenderable {
  return new BoxRenderable(renderer, { height });
}
