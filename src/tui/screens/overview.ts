/**
 * Overview tab: the environment at a glance.
 *
 * Shows runtime, data directory, settings.json and vault state, and the
 * first suggested actions. It is the default initial tab and the natural
 * place for derived projects to show their own indicators.
 *
 * Wide uses fixed-width State and Next steps panels; medium uses proportional
 * widths. Compact stacks Environment and Settings and hides secondary panels.
 * Watches settings.json, credentials.json and master.key for external updates.
 *
 * Actions: `r` reloads the panels from disk; `c` copies the MCP client
 * configuration to the clipboard (OSC 52). Both also run from the key bar
 * and from the buttons in the "Next steps" panel.
 */
import { BoxRenderable } from "@opentui/core";
import { manifest } from "../../app/manifest.ts";
import { paths, exists } from "../../config/paths.ts";
import { vaultStatus } from "../../config/credentials.ts";
import { flatten, readSettings } from "../../config/settings.ts";
import {
  spacer,
  list,
  panel,
  dim,
  keyValueTable,
  heading,
  button,
} from "../components.ts";
import { glyphs } from "../theme.ts";
import type { Screen, ScreenAction, ScreenContext } from "../screen.ts";

/** MCP client configuration suggested to agents. */
export function mcpClientConfig(): string {
  return `{ "command": "${manifest.bin}", "args": ["mcp"] }`;
}

/** Copies the public MCP command configuration through OSC 52. */
function copyMcpConfig(ctx: ScreenContext): void {
  let copied = false;
  try {
    copied = ctx.renderer.copyToClipboardOSC52(mcpClientConfig());
  } catch (error) {
    ctx.notify(
      error instanceof Error
        ? `OSC 52: ${error.message}`
        : "Clipboard unavailable (OSC 52)",
      "error",
    );
    return;
  }
  if (copied) ctx.notify("MCP config copied", "ok");
  else ctx.notify("This terminal does not accept clipboard writes (OSC 52)", "warn");
}

/** Refreshes data from disk and reports completion as a toast. */
function reload(ctx: ScreenContext): void {
  ctx.refresh();
  ctx.notify("Reloaded", "ok");
}

const actions: ScreenAction[] = [
  { keys: ["r"], description: "reload", icon: "refresh", run: reload },
  { keys: ["c"], description: "copy MCP config", icon: "copy", run: copyMcpConfig },
];

export const overviewScreen: Screen = {
  id: "overview",
  title: "Overview",
  icon: "overview",
  description: "Environment, configuration and vault at a glance",
  actions,
  watch: () => [paths.settings(), paths.credentials(), paths.masterKey()],
  mount(ctx) {
    const { renderer, theme, icons } = ctx;
    const rootBox = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const topRow = new BoxRenderable(renderer, {
      flexDirection: ctx.layout() === "compact" ? "column" : "row",
      flexShrink: 0,
    });

    const environment = panel(renderer, theme, {
      title: "Environment",
      icon: { icons, name: "terminal" },
      flexGrow: 1,
      active: true,
    });
    environment.add(
      keyValueTable(renderer, theme, [
        ["Binary", `${manifest.bin} v${manifest.version}`, theme.textStrong],
        ["Runtime", `Bun ${Bun.version}`],
        ["Platform", `${process.platform}-${process.arch}`],
        ["Terminal", `${renderer.width}×${renderer.height}  ${process.env.TERM ?? ""}`],
        ["Data", paths.base()],
      ]),
    );
    topRow.add(environment);

    const vault = vaultStatus();
    const hasSettings = exists(paths.settings());
    ctx.status(`settings: ${hasSettings ? "saved" : "defaults"} · vault: ${vault.count}`);
    const state = panel(renderer, theme, {
      title: "State",
      icon: { icons, name: "state" },
      width: ctx.layout() === "wide" ? 46 : "45%",
    });
    state.add(
      keyValueTable(renderer, theme, [
        [
          "settings.json",
          hasSettings ? `${glyphs.ok} saved` : `${glyphs.bullet} defaults`,
          hasSettings ? theme.ok : theme.textDim,
        ],
        [
          "credentials.json",
          vault.exists
            ? `${glyphs.ok} ${vault.count} credential(s)`
            : `${glyphs.bullet} empty`,
          vault.exists ? theme.ok : theme.textDim,
        ],
        [
          "master key",
          vault.masterKeySource === "none" ? "not created" : vault.masterKeySource,
          vault.masterKeySource === "env" ? theme.accentSecondary : theme.text,
        ],
        ["MCP", `${manifest.bin} mcp`, theme.text],
      ]),
    );
    if (ctx.layout() !== "compact") topRow.add(state);
    rootBox.add(topRow);

    const bottomRow = new BoxRenderable(renderer, {
      flexDirection: ctx.layout() === "compact" ? "column" : "row",
      flexGrow: 1,
    });

    const config = panel(renderer, theme, {
      title: "Settings in effect",
      icon: { icons, name: "settings" },
      flexGrow: 1,
    });
    let pairs: Array<[string, string]>;
    try {
      pairs = flatten(readSettings()).map(([k, v]) => [k, JSON.stringify(v)]);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      ctx.notify(message, "error");
      pairs = [["error", message]];
    }
    config.add(
      keyValueTable(
        renderer,
        theme,
        pairs.map(([k, v]) => [k, v, theme.text]),
      ),
    );
    bottomRow.add(config);

    const next = panel(renderer, theme, {
      title: "Next steps",
      icon: { icons, name: "docs" },
      width: ctx.layout() === "wide" ? 46 : "45%",
    });
    next.add(heading(renderer, theme, "In the terminal"));
    next.add(
      list(
        renderer,
        theme,
        [
          `${manifest.bin} --help`,
          `${manifest.bin} credentials set <name>`,
          `${manifest.bin} config set tui.theme day`,
          `${manifest.bin} --skill`,
        ],
        glyphs.arrow,
      ),
    );
    next.add(spacer(renderer));
    next.add(heading(renderer, theme, "For agents"));
    next.add(dim(renderer, theme, `MCP client: ${mcpClientConfig()}`));
    next.add(spacer(renderer));
    next.add(
      button(renderer, theme, {
        key: "c",
        label: "copy MCP config",
        icon: { icons, name: "copy" },
        onPress: () => copyMcpConfig(ctx),
      }),
    );
    next.add(
      button(renderer, theme, {
        key: "r",
        label: "reload",
        icon: { icons, name: "refresh" },
        onPress: () => reload(ctx),
      }),
    );
    if (ctx.layout() !== "compact") bottomRow.add(next);
    rootBox.add(bottomRow);

    return rootBox;
  },
};
