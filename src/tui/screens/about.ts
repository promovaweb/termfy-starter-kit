/**
 * About tab: binary identity, version, paths and credits.
 * Uses the same data as the `about` command, so the two surfaces never tell
 * different stories.
 *
 * Action: `c` copies the repository URL (or the site when there is no
 * repository) to the clipboard through OSC 52, by key, key bar or button.
 */
import { BoxRenderable, TextRenderable } from "@opentui/core";
import { aboutData } from "../../cli/commands/about.ts";
import { spacer, list, panel, dim, keyValueTable, heading, button } from "../components.ts";
import type { Screen, ScreenContext } from "../screen.ts";

function copyLink(ctx: ScreenContext): void {
  const d = aboutData();
  const url = d.repository || d.site;
  if (!url) {
    ctx.notify("No repository or site in package.json", "warn");
    return;
  }
  let copied = false;
  try {
    copied = ctx.renderer.copyToClipboardOSC52(url);
  } catch {
    // Clipboard writes may be unavailable in this renderer or terminal phase.
  }
  if (copied) ctx.notify(`Copied ${url}`, "ok");
  else ctx.notify("This terminal does not accept clipboard writes (OSC 52)", "warn");
}

export const aboutScreen: Screen = {
  id: "about",
  title: "About",
  icon: "about",
  description: "Binary, version, license and credits",
  actions: [{ keys: ["c"], description: "copy link", icon: "copy", run: copyLink }],
  mount: (ctx) => {
    const { renderer, theme, icons } = ctx;
    const d = aboutData();
    const rootBox = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const top = new BoxRenderable(renderer, { flexDirection: "row", flexShrink: 0 });

    const binary = panel(renderer, theme, { title: "Binary", icon: { icons, name: "terminal" }, flexGrow: 1, active: true });
    binary.add(new TextRenderable(renderer, { content: `${d.title}  v${d.version}`, fg: theme.accent }));
    binary.add(dim(renderer, theme, d.description));
    binary.add(spacer(renderer));
    binary.add(
      keyValueTable(renderer, theme, [
        ["Executable", d.executable],
        ["Runtime", d.runtime],
        ["Platform", d.platform],
        ["PID", String(d.pid)],
        ["Data", d.dataDir],
      ]),
    );
    top.add(binary);

    const project = panel(renderer, theme, { title: "Project", icon: { icons, name: "link" }, width: 58 });
    project.add(
      keyValueTable(renderer, theme, [
        ["Author", d.author || "-", theme.textStrong],
        ["License", d.license],
        ["Site", d.site || "-", theme.accentSecondary],
        ["Repository", d.repository || "-", theme.accentSecondary],
      ]),
    );
    project.add(spacer(renderer));
    project.add(button(renderer, theme, { key: "c", label: "copy link", icon: { icons, name: "copy" }, onPress: () => copyLink(ctx) }));
    top.add(project);
    rootBox.add(top);

    const bottom = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1 });

    const creditsPanel = panel(renderer, theme, { title: "Credits", icon: { icons, name: "user" }, flexGrow: 1 });
    const nameWidth = Math.max(...d.credits.map((c) => c.name.length));
    for (const c of d.credits) {
      creditsPanel.add(keyValueTable(renderer, theme, [[c.name.padEnd(nameWidth), c.role, theme.text]]));
      creditsPanel.add(dim(renderer, theme, `${" ".repeat(nameWidth + 2)}${c.url}`));
    }
    bottom.add(creditsPanel);

    const standards = panel(renderer, theme, { title: "Standards", icon: { icons, name: "code" }, width: 58 });
    standards.add(heading(renderer, theme, "Interface"));
    standards.add(list(renderer, theme, ["OpenCLI 0.1 for the CLI description", "MCP 2025-11-25 over stdio", "Fixed exit codes (0 success)"]));
    standards.add(spacer(renderer));
    standards.add(heading(renderer, theme, "Data"));
    standards.add(list(renderer, theme, ["settings.json in plain text", "credentials.json with AES-256-GCM", "master.key with mode 0600"]));
    bottom.add(standards);
    rootBox.add(bottom);

    return rootBox;
  },
};
