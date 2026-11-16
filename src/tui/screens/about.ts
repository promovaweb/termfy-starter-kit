/**
 * About tab: binary identity, version, paths and credits.
 * Uses the same data as the `about` command, so the two surfaces never tell
 * different stories.
 *
 * Wide shows four panels; medium groups sections into two scroll panels.
 * Compact uses one scroll panel for all four sections. Identity and credits
 * come from the binary manifest, so no files are watched.
 *
 * Action: `c` copies the repository URL (or the site when there is no
 * repository) to the clipboard through OSC 52, by key, key bar or button.
 */
import { BoxRenderable, TextRenderable, ASCIIFontRenderable } from "@opentui/core";
import { aboutData } from "../../cli/commands/about.ts";
import {
  spacer,
  list,
  scrollPanel,
  dim,
  keyValueTable,
  heading,
  button,
  link,
} from "../components.ts";
import type { Screen, ScreenContext } from "../screen.ts";

/** Copies the repository URL, falling back to the project site. */
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
  } catch (error) {
    ctx.notify(
      error instanceof Error
        ? `OSC 52: ${error.message}`
        : "Clipboard unavailable (OSC 52)",
      "error",
    );
    return;
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
  mount(ctx) {
    const { renderer, theme, icons } = ctx;
    const d = aboutData();
    ctx.status(`${d.title} v${d.version}`);
    const rootBox = new BoxRenderable(renderer, { flexDirection: "column", flexGrow: 1 });

    const layout = ctx.layout();
    const top = new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1, flexBasis: 0, minHeight: 0 });
    const bottom = layout === "wide"
      ? new BoxRenderable(renderer, { flexDirection: "row", flexGrow: 1, flexBasis: 0, minHeight: 0 })
      : undefined;
    const primary = layout !== "wide" ? scrollPanel(renderer, theme, {
      title: layout === "compact" ? "About" : "Binary / Project",
      active: true,
    }) : undefined;
    const secondary = layout === "medium" ? scrollPanel(renderer, theme, {
      title: "Credits / Standards",
    }) : primary;
    if (primary) top.add(primary);
    if (layout === "medium" && secondary) top.add(secondary);
    /** Shares a viewport in smaller layouts while keeping each section headed. */
    const section = (title: string, icon: "terminal" | "link" | "user" | "code", group = primary) => {
      if (group) {
        if (group.getChildren().length) group.add(spacer(renderer));
        group.add(heading(renderer, theme, title));
        return group;
      }
      return scrollPanel(renderer, theme, { title, icon: { icons, name: icon }, active: title === "Binary" });
    };
    const binary = section("Binary", "terminal");
    if (ctx.layout() === "wide" && d.title.length * 5 < renderer.width - 64)
      binary.add(
        new ASCIIFontRenderable(renderer, {
          text: d.title,
          font: "tiny",
          color: theme.accent,
        }),
      );
    binary.add(
      new TextRenderable(renderer, {
        content: `${d.title}  v${d.version}`,
        fg: theme.accent,
      }),
    );
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
    if (layout === "wide") top.add(binary);

    const project = section("Project", "link");
    project.add(
      keyValueTable(renderer, theme, [
        ["Author", d.author || "-", theme.textStrong],
        ["License", d.license],
      ]),
    );
    if (d.site) {
      project.add(dim(renderer, theme, "Site"));
      project.add(link(renderer, theme, { url: d.site, notify: ctx.notify }));
    }
    if (d.repository) {
      project.add(dim(renderer, theme, "Repository"));
      project.add(link(renderer, theme, { url: d.repository, notify: ctx.notify }));
    }
    project.add(spacer(renderer));
    project.add(
      button(renderer, theme, {
        key: "c",
        label: "copy link",
        icon: { icons, name: "copy" },
        onPress: () => copyLink(ctx),
      }),
    );
    if (layout === "wide") top.add(project);
    rootBox.add(top);

    const creditsPanel = section("Credits", "user", secondary);
    for (const credit of d.credits) {
      if (ctx.layout() === "compact") {
        creditsPanel.add(link(renderer, theme, { url: credit.url, text: `${credit.name} ${credit.url}`, notify: ctx.notify }));
        continue;
      }
      creditsPanel.add(heading(renderer, theme, credit.name));
      if (ctx.layout() !== "compact") creditsPanel.add(dim(renderer, theme, credit.role));
      creditsPanel.add(link(renderer, theme, { url: credit.url, notify: ctx.notify }));
    }
    bottom?.add(creditsPanel);

    const standards = section("Standards", "code", secondary);
    standards.add(heading(renderer, theme, "Interface"));
    standards.add(
      list(renderer, theme, [
        "OpenCLI 0.1 for the CLI description",
        "MCP 2025-11-25 over stdio",
        "Fixed exit codes (0 success)",
      ]),
    );
    standards.add(spacer(renderer));
    standards.add(heading(renderer, theme, "Data"));
    standards.add(
      list(renderer, theme, [
        "settings.json in plain text",
        "credentials.json with AES-256-GCM",
        "master.key with mode 0600",
      ]),
    );
    if (bottom) {
      bottom.add(standards);
      rootBox.add(bottom);
    }

    return rootBox;
  },
};
