/**
 * TUI assembly.
 *
 * Screen layout:
 *
 *   ┌ header: title, version and description ────────────────────────────┐
 *   │ tabs: " 1 ⌂ Overview "  " 2 ℹ About "  (click or press the number)  │
 *   │ active tab content (flexGrow)                                      │
 *   └ key bar: screen actions, help, quit (click runs) · status message ─┘
 *
 * Every command has a key and a mouse path. Keys: Left/Right, [ ], Tab and
 * Shift+Tab switch tabs; 1..9 jump to the numbered tab; ? toggles the help
 * box; q, Esc or Ctrl+C quit (Esc closes the help first). Mouse: a click on
 * a tab opens it, the wheel over the tab bar moves between tabs, a click on
 * a key bar item or on a help row runs that command. Screen actions come
 * from `Screen.actions` and use the same dispatch for both paths.
 * The renderer is destroyed on every exit path to hand the terminal back.
 */
import {
  BoxRenderable,
  TextRenderable,
  TextAttributes,
  createCliRenderer,
  type CliRenderer,
  type KeyEvent,
  type MouseEvent,
  type Renderable,
} from "@opentui/core";
import { manifest } from "../app/manifest.ts";
import { readSettings, getPath } from "../config/settings.ts";
import { glyphs, currentTheme, resolveTheme, type Theme } from "./theme.ts";
import { currentIcons, withIcon, type IconSet } from "./icons.ts";
import { screens } from "./screens/index.ts";
import type { NotifyTone, ScreenAction, ScreenContext, Screen } from "./screen.ts";

export interface TuiOptions {
  initialTab?: string;
  /** Icon set; defaults to `tui.icons` and terminal detection. */
  icons?: IconSet;
}

/** Milliseconds a `notify` message stays in the key bar. */
const NOTIFY_MS = 4000;

function defaultInitialTab(): string {
  try {
    const value = getPath(readSettings(), "tui.initialTab");
    if (typeof value === "string") return value;
  } catch {
    // Without settings, use the first tab.
  }
  return screens[0]?.id ?? "overview";
}

/** Reads `tui.mouse`. Any failure keeps the mouse on. */
export function mouseEnabled(): boolean {
  try {
    return getPath(readSettings(), "tui.mouse") !== false;
  } catch {
    return true;
  }
}

/** Label of an action key: explicit label or the first key name. */
function keyLabel(action: ScreenAction): string {
  return action.label ?? action.keys[0] ?? "";
}

/**
 * Opens the TUI on a real terminal and returns only when the user quits.
 * With the `terminal` theme, the palette query runs before mounting so the
 * first frame already uses the slots chosen for the terminal colors.
 */
export async function startTui(options: TuiOptions = {}): Promise<void> {
  const renderer = await createCliRenderer({
    exitOnCtrlC: true,
    backgroundColor: currentTheme().background,
    targetFps: 30,
    useMouse: mouseEnabled(),
  });
  const theme = await resolveTheme(renderer);
  await mountTui(renderer, options, theme);
}

/**
 * Mounts the interface on an existing renderer and returns when it is
 * destroyed. Separated from `startTui` so tests can use the renderer from
 * `@opentui/core/testing` and capture frames without a real terminal.
 */
export async function mountTui(renderer: CliRenderer, options: TuiOptions = {}, theme: Theme = currentTheme()): Promise<void> {
  const icons = options.icons ?? currentIcons();
  const closed = new Promise<void>((resolve) => renderer.once("destroy", () => resolve()));
  const quit = () => {
    if (!renderer.isDestroyed) renderer.destroy();
  };

  const app = new BoxRenderable(renderer, {
    width: "100%",
    height: "100%",
    flexDirection: "column",
    backgroundColor: theme.background,
  });

  // Header: brand, description, platform.
  const header = new BoxRenderable(renderer, {
    height: 1,
    flexDirection: "row",
    paddingLeft: 1,
    paddingRight: 1,
    gap: 2,
  });
  const brand = new BoxRenderable(renderer, { flexDirection: "row", flexShrink: 0 });
  brand.add(new TextRenderable(renderer, { content: `${glyphs.block} `, fg: theme.accent, selectable: false }));
  brand.add(new TextRenderable(renderer, { content: manifest.title, fg: theme.textStrong, attributes: TextAttributes.BOLD }));
  brand.add(new TextRenderable(renderer, { content: ` v${manifest.version}`, fg: theme.textDim }));
  header.add(brand);
  header.add(
    new TextRenderable(renderer, {
      content: `${glyphs.separator}  ${manifest.description}`,
      fg: theme.textDim,
      wrapMode: "none",
      flexGrow: 1,
      flexShrink: 1,
      minWidth: 0,
      height: 1,
    }),
  );
  header.add(
    new TextRenderable(renderer, {
      content: `${process.platform}-${process.arch} ${glyphs.bullet} Bun ${Bun.version}`,
      fg: theme.textDim,
      flexShrink: 0,
      wrapMode: "none",
    }),
  );
  app.add(header);

  // Tab bar: one clickable item per screen, numbered for the 1..9 keys.
  const tabBar = new BoxRenderable(renderer, {
    height: 1,
    flexDirection: "row",
    paddingLeft: 1,
    gap: 1,
    onMouseScroll: (event: MouseEvent) => {
      const direction = event.scroll?.direction;
      if (direction === "up" || direction === "left") step(-1);
      else if (direction === "down" || direction === "right") step(1);
    },
  });
  const tabItems = screens.map((screen, index) => {
    const number = index < 9 ? `${index + 1} ` : "";
    const label = new TextRenderable(renderer, {
      content: ` ${number}${withIcon(icons, screen.icon ?? "list", screen.title)} `,
      fg: theme.textDim,
      wrapMode: "none",
      selectable: false,
    });
    const item = new BoxRenderable(renderer, {
      flexShrink: 0,
      onMouseDown: (event: MouseEvent) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        show(index);
      },
      onMouseOver: () => {
        hovered = index;
        paintTabs();
      },
      onMouseOut: () => {
        if (hovered === index) hovered = -1;
        paintTabs();
      },
    });
    item.add(label);
    tabBar.add(item);
    return { item, label };
  });
  app.add(tabBar);

  const rule = new BoxRenderable(renderer, { height: 1, paddingLeft: 1, paddingRight: 1 });
  rule.add(new TextRenderable(renderer, { content: "─".repeat(400), fg: theme.border, wrapMode: "none", height: 1, selectable: false }));
  app.add(rule);

  const content = new BoxRenderable(renderer, { flexGrow: 1, flexDirection: "column", paddingLeft: 1, paddingRight: 1 });
  app.add(content);

  // Key bar: clickable actions on the left, status message on the right.
  const bar = new BoxRenderable(renderer, {
    height: 1,
    flexDirection: "row",
    backgroundColor: theme.barBackground,
    paddingLeft: 1,
    paddingRight: 1,
  });
  let barItems = new BoxRenderable(renderer, { flexDirection: "row", gap: 2, flexGrow: 1 });
  const status = new TextRenderable(renderer, { content: "", fg: theme.textDim, wrapMode: "none", flexShrink: 0, selectable: false });
  bar.add(barItems);
  bar.add(status);
  app.add(bar);
  renderer.root.add(app);

  const mounted = new Map<string, Renderable>();
  let activeIndex = -1;
  let hovered = -1;
  let helpBox: BoxRenderable | undefined;
  let notifyTimer: ReturnType<typeof setTimeout> | undefined;

  const active = (): Screen | undefined => screens[activeIndex];

  const toneColor = (tone: NotifyTone) =>
    tone === "ok" ? theme.ok : tone === "warn" ? theme.warn : tone === "error" ? theme.error : theme.text;

  const context: ScreenContext = {
    renderer,
    theme,
    icons,
    goTo: (id) => {
      const index = screens.findIndex((s) => s.id === id);
      if (index >= 0) show(index);
    },
    refresh: () => {
      const screen = active();
      if (!screen) return;
      const previous = mounted.get(screen.id);
      screen.onLeave?.(context);
      if (previous) previous.destroyRecursively();
      const node = screen.mount(context);
      mounted.set(screen.id, node);
      content.add(node);
      screen.onEnter?.(context);
    },
    notify: (message, tone = "info") => {
      const icon = tone === "ok" ? icons.ok : tone === "warn" ? icons.warn : tone === "error" ? icons.error : "";
      status.content = icon ? `${icon} ${message}` : message;
      status.fg = toneColor(tone);
      clearTimeout(notifyTimer);
      notifyTimer = setTimeout(() => {
        if (!renderer.isDestroyed) status.content = "";
      }, NOTIFY_MS);
    },
    quit,
  };

  /** Global commands, shown after the screen actions. */
  const globalActions: ScreenAction[] = [
    { keys: ["right", "]", "tab"], label: "←/→", description: "tab", icon: "tabs", run: () => step(1) },
    { keys: ["?"], description: "help", icon: "help", run: () => toggleHelp() },
    { keys: ["q", "escape"], description: "quit", icon: "quit", run: () => quit() },
  ];

  /** Every action of the active screen, legacy key hints included as display-only entries. */
  const screenActions = (): ScreenAction[] => {
    const screen = active();
    if (!screen) return [];
    const hints: ScreenAction[] = (screen.keys ?? []).map((hint) => ({
      keys: [],
      label: hint.key,
      description: hint.action,
      run: () => undefined,
    }));
    return [...(screen.actions ?? []), ...hints];
  };

  const paintTabs = () => {
    tabItems.forEach(({ item, label }, index) => {
      const selected = index === activeIndex;
      label.fg = selected ? theme.accent : index === hovered ? theme.text : theme.textDim;
      label.attributes = selected ? TextAttributes.BOLD | TextAttributes.UNDERLINE : TextAttributes.NONE;
      item.backgroundColor = selected ? theme.surfaceHigh : theme.background;
    });
  };

  const barItem = (action: ScreenAction) => {
    const item = new BoxRenderable(renderer, {
      flexDirection: "row",
      flexShrink: 0,
      onMouseDown: (event: MouseEvent) => {
        if (event.button !== 0) return;
        event.stopPropagation();
        action.run(context);
      },
    });
    const text = new TextRenderable(renderer, { content: ` ${action.description}`, fg: theme.barText, selectable: false });
    item.add(new TextRenderable(renderer, { content: ` ${keyLabel(action)} `, fg: theme.keyText, bg: theme.keyBackground, selectable: false }));
    item.add(text);
    item.onMouseOver = () => { text.fg = theme.text; };
    item.onMouseOut = () => { text.fg = theme.barText; };
    return item;
  };

  const refreshBar = () => {
    barItems.destroyRecursively();
    bar.remove(status);
    barItems = new BoxRenderable(renderer, { flexDirection: "row", gap: 2, flexGrow: 1, flexShrink: 1, minWidth: 0 });
    for (const action of [...screenActions(), ...globalActions]) barItems.add(barItem(action));
    bar.add(barItems);
    bar.add(status);
  };

  const show = (index: number) => {
    const screen = screens[index];
    if (!screen || index === activeIndex) return;
    const previous = active();
    if (previous) {
      previous.onLeave?.(context);
      const node = mounted.get(previous.id);
      if (node) {
        // Detached cached content must not keep receiving keyboard input.
        const focused = renderer.currentFocusedRenderable;
        for (let parent: Renderable | null = focused; parent; parent = parent.parent) {
          if (parent === node) { focused?.blur(); break; }
        }
        content.remove(node);
      }
    }
    activeIndex = index;
    let node = mounted.get(screen.id);
    if (!node) {
      node = screen.mount(context);
      mounted.set(screen.id, node);
    }
    content.add(node);
    screen.onEnter?.(context);
    paintTabs();
    refreshBar();
    if (helpBox) {
      closeHelp();
      openHelp();
    }
  };

  const step = (delta: number) => {
    if (!screens.length) return;
    show((activeIndex + delta + screens.length) % screens.length);
  };

  const closeHelp = () => {
    if (!helpBox) return;
    helpBox.destroyRecursively();
    helpBox = undefined;
  };

  const openHelp = () => {
    const screen = active();
    helpBox = new BoxRenderable(renderer, {
      position: "absolute",
      right: 2,
      top: 3,
      width: 56,
      flexDirection: "column",
      borderStyle: "rounded",
      borderColor: theme.borderActive,
      backgroundColor: theme.surfaceHigh,
      title: ` ${withIcon(icons, "keyboard", "Keys")} `,
      titleColor: theme.accent,
      paddingLeft: 1,
      paddingRight: 1,
      zIndex: 10,
    });
    const box = helpBox;
    const row = (key: string, description: string, run?: () => void, iconName?: ScreenAction["icon"]) => {
      const line = new BoxRenderable(renderer, {
        flexDirection: "row",
        height: 1,
        onMouseDown: run
          ? (event: MouseEvent) => {
              if (event.button !== 0) return;
              event.stopPropagation();
              closeHelp();
              run();
            }
          : undefined,
      });
      line.add(new TextRenderable(renderer, { content: key.padEnd(16), fg: theme.accent, selectable: false }));
      line.add(new TextRenderable(renderer, { content: iconName ? withIcon(icons, iconName, description) : description, fg: theme.text, selectable: false }));
      box.add(line);
    };
    const section = (title: string) =>
      box.add(new TextRenderable(renderer, { content: title, fg: theme.textDim, attributes: TextAttributes.BOLD, selectable: false }));

    const own = screenActions();
    if (screen && own.length) {
      section(withIcon(icons, screen.icon ?? "list", screen.title));
      for (const action of own) row(keyLabel(action), action.description, action.keys.length ? () => action.run(context) : undefined, action.icon);
    }
    section("Global");
    row("←  →  [  ]", "previous / next tab", () => step(1), "tabs");
    row("Tab  Shift+Tab", "next / previous tab");
    row(`1 … ${Math.min(9, screens.length)}`, "go to the tab with that number");
    row("?", "show or hide this help");
    row("Esc", "close this help", undefined, "close");
    row("q  Ctrl+C", "quit", () => quit(), "quit");
    section("Mouse");
    row("click", "open a tab, run a key or a row");
    row("wheel", "scroll a list or switch tabs");
    renderer.root.add(box);
  };

  const toggleHelp = () => {
    if (helpBox) closeHelp();
    else openHelp();
  };

  const onKey = (key: KeyEvent) => {
    const name = key.name;
    // Modified letters must not invoke unmodified screen actions.
    if (key.ctrl && name === "c") { key.preventDefault(); return quit(); }
    if (key.ctrl || key.meta) return;
    if (helpBox && (name === "escape" || name === "?")) {
      key.preventDefault();
      closeHelp();
      return;
    }
    if (active()?.onKey?.(name, context)) { key.preventDefault(); return; }
    const own = active()?.actions?.find((action) => action.keys.includes(name));
    if (own) {
      key.preventDefault();
      own.run(context);
      return;
    }
    if (name === "tab" && key.shift) { key.preventDefault(); return step(-1); }
    if (name === "left" || name === "[") { key.preventDefault(); return step(-1); }
    if (/^[1-9]$/.test(name)) {
      key.preventDefault();
      const index = Number(name) - 1;
      if (index < screens.length) show(index);
      return;
    }
    const global = globalActions.find((action) => action.keys.includes(name));
    if (global) { key.preventDefault(); global.run(context); }
  };
  renderer.keyInput.on("keypress", onKey);
  renderer.once("destroy", () => {
    renderer.keyInput.off("keypress", onKey);
    clearTimeout(notifyTimer);
    active()?.onLeave?.(context);
    // Hidden tabs are detached from the root, so the renderer cannot own their cleanup.
    for (const node of mounted.values()) node.destroyRecursively();
    mounted.clear();
  });

  const initial = options.initialTab ?? defaultInitialTab();
  show(Math.max(0, screens.findIndex((s) => s.id === initial)));

  await closed;
}
