/**
 * Contract of a TUI screen (tab).
 *
 * Each screen lives in `screens/<id>.ts`, exports a `Screen` object (or a
 * factory when it keeps state) and is registered in `screens/index.ts`. The
 * screen receives the renderer, the theme and the icons on mount and returns
 * the root renderable of its content.
 *
 * Every interaction has a keyboard shortcut and a mouse path. A screen
 * declares its commands in `actions`: the shell shows each one in the key
 * bar and in the help box, runs it from its keys and runs it on a click on
 * the bar item. Clickable elements inside the content (list rows, buttons)
 * call the same function an action calls, so both paths stay identical.
 * `onEnter` and `onLeave` start and stop timers or subscriptions. The stub in
 * `template/screen/` shows the skeleton.
 */
import type { CliRenderer, Renderable } from "@opentui/core";
import type { Theme } from "./theme.ts";
import type { IconName, IconSet } from "./icons.ts";

/** Tone of a status message shown by `notify`. */
export type NotifyTone = "info" | "ok" | "warn" | "error";

export interface ScreenContext {
  renderer: CliRenderer;
  theme: Theme;
  icons: IconSet;
  /** Switches the active tab by id. */
  goTo: (id: string) => void;
  /** Rebuilds the active screen from scratch (calls `mount` again). */
  refresh: () => void;
  /** Shows a short message at the right of the key bar for a few seconds. */
  notify: (message: string, tone?: NotifyTone) => void;
  /** Closes the TUI. */
  quit: () => void;
}

/** A command reachable by keyboard and mouse. */
export interface ScreenAction {
  /** Key names that run the action, as `KeyEvent.name` (`"r"`, `"return"`, `"f5"`). */
  keys: readonly string[];
  /** Key label in the bar and in the help. Defaults to the first key. */
  label?: string;
  /** Short verb shown next to the key (`"refresh"`). */
  description: string;
  /** Icon shown in the help box. */
  icon?: IconName;
  /** Runs the action. */
  run: (ctx: ScreenContext) => void;
}

/** Key hint without behavior, kept for screens written before `actions`. */
export interface KeyHint {
  key: string;
  action: string;
}

export interface Screen {
  /** Stable identifier, used by `tui.initialTab` and `--tab`. */
  id: string;
  /** Short tab title. */
  title: string;
  /** Icon shown in the tab. */
  icon?: IconName;
  /** Line describing the tab, shown in the help box. */
  description: string;
  /** Commands of the screen, shown in the key bar and run by key or click. */
  actions?: readonly ScreenAction[];
  /** Hints for keys handled in `onKey`. Prefer `actions` in new screens. */
  keys?: readonly KeyHint[];
  /** Builds the content. Called on first display and on `refresh`. */
  mount: (ctx: ScreenContext) => Renderable;
  /** Called when the tab is shown. */
  onEnter?: (ctx: ScreenContext) => void;
  /** Called when the tab is hidden. */
  onLeave?: (ctx: ScreenContext) => void;
  /** Keys handled by the screen itself, before `actions`. Returns `true` when consumed. */
  onKey?: (name: string, ctx: ScreenContext) => boolean;
}
