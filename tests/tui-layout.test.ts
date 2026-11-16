/** Visual regressions for bounded panels, complete key hints and responsive screens. */
import { expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestRenderer } from "@opentui/core/testing";
import { ScrollBoxRenderable, type Renderable } from "@opentui/core";
import { HOME_VARIABLE, MASTER_KEY_VARIABLE } from "../src/config/paths.ts";
import { setCredential } from "../src/config/credentials.ts";
import { mountTui } from "../src/tui/index.ts";
import { iconSets } from "../src/tui/icons.ts";
import { terminalTheme } from "../src/tui/theme.ts";
import { normalizeMarkdown } from "../src/tui/screens/docs.ts";

const sizes = [[60, 16], [64, 20], [80, 24], [100, 30], [130, 32], [200, 60]] as const;
const tabs = ["overview", "settings", "credentials", "docs", "about"];

/** Finds actual scroll viewports so assertions include their native visibility. */
function scrollPanels(node: Renderable): ScrollBoxRenderable[] {
  return [
    ...(node instanceof ScrollBoxRenderable ? [node] : []),
    ...node.getChildren().flatMap(scrollPanels),
  ];
}
for (const [width, height] of sizes) {
  for (const tab of tabs) {
    test(`${tab} fits ${width}×${height} with a populated vault`, async () => {
      const directory = mkdtempSync(join(tmpdir(), "termfy-layout-"));
      const previousHome = process.env[HOME_VARIABLE];
      const previousKey = process.env[MASTER_KEY_VARIABLE];
      process.env[HOME_VARIABLE] = directory;
      delete process.env[MASTER_KEY_VARIABLE];
      const setup = await createTestRenderer({ width, height });
      let closed: Promise<void> | undefined;
      try {
        setCredential("github.token", "visual-test-secret");
        closed = mountTui(setup.renderer, { initialTab: tab, icons: iconSets.unicode, motion: false }, terminalTheme());
        if (tab === "docs") {
          for (let attempt = 0; attempt < 50; attempt++) {
            await setup.renderOnce();
            if (setup.captureCharFrame().includes("Convenções")) break;
            await Bun.sleep(10);
          }
          expect(setup.captureCharFrame()).toContain("Convenções");
        }
        await setup.renderOnce();
        await setup.renderOnce();
        const frame = setup.captureCharFrame();
        const lines = frame.trimEnd().split("\n");
        const bar = lines.at(-1)!;
        expect(bar).toContain("help");
        expect(bar).toContain("quit");
        expect(bar).toContain("commands");
        expect(bar).not.toMatch(/\bq\s+q\b/);
        for (const line of lines) {
          expect(Bun.stringWidth(line)).toBeLessThanOrEqual(width);
          if (/^\s*╰/.test(line)) expect(line).toMatch(/^[\s╰╯─]+$/);
        }
        expect(frame).not.toContain("visual-test-secret");
        if (tab === "overview" || tab === "credentials") {
          expect(frame).toContain("1 credential");
          expect(frame).not.toContain("1 credentials");
        }
        if (tab === "settings") {
          expect(frame).toContain("output.colors");
          expect(frame).not.toContain("Accepted: boolean");
        }
        if (tab === "credentials") {
          expect(frame).toContain("github.token");
          if (width >= 80) expect(frame).toContain("credentials.json");
        }
        if (tab === "docs") expect(frame).toContain("cli");
        if (tab === "about") {
          const panels = scrollPanels(setup.renderer.root);
          if (width < 80) {
            expect(panels).toHaveLength(1);
            expect(panels.filter(panel => panel.verticalScrollBar.visible).length).toBeLessThanOrEqual(1);
            let sections = frame;
            const panel = panels[0]!;
            for (let attempt = 0; attempt < 20; attempt++) {
              const previous = panel.scrollTop;
              panel.scrollBy(3);
              await setup.renderOnce();
              sections += setup.captureCharFrame();
              if (panel.scrollTop === previous) break;
            }
            for (const title of ["Binary", "Project", "Credits", "Standards"]) expect(sections).toContain(title);
            expect(sections).toContain("master.key with mode 0600");
          } else {
            expect(frame).toContain("Credits");
            if (width < 120) expect(panels).toHaveLength(2);
          }
        }
        if (tab === "overview" && width === 80 && height === 24) {
          expect(bar).toContain("1 credential · settings: defaults");
          expect(bar).not.toContain("…");
          // Assert buttons in the content area, independently of status hints.
          const content = lines.slice(3, -1).join("\n");
          expect(content).toMatch(/\bc\s+.*copy MCP config/);
          expect(content).toMatch(/\br\s+.*reload/);
          expect(scrollPanels(setup.renderer.root).filter(panel => panel.verticalScrollBar.visible)).toHaveLength(0);
        }
        if (tab === "overview" && width === 200) {
          const borders = lines.filter(line => /^\s*╰/.test(line));
          expect(borders).toHaveLength(2);
          expect(lines.findIndex(line => line === borders[1])).toBeLessThan(30);
          const first = borders[0]!.trim();
          const split = first.indexOf("╯") + 1;
          expect(split / Bun.stringWidth(first)).toBeGreaterThan(0.4);
          expect(split / Bun.stringWidth(first)).toBeLessThan(0.65);
        }
      } finally {
        setup.renderer.destroy();
        await closed;
        if (previousHome === undefined) delete process.env[HOME_VARIABLE];
        else process.env[HOME_VARIABLE] = previousHome;
        if (previousKey === undefined) delete process.env[MASTER_KEY_VARIABLE];
        else process.env[MASTER_KEY_VARIABLE] = previousKey;
        rmSync(directory, { recursive: true, force: true });
      }
    });
  }
}

test("Markdown joins prose and list continuations without changing literal blocks", () => {
  const source = "A paragraph\ncontinued.\n\n- First item\n  continued.\n- Second item\n\n# Heading\n\n| A | B |\n| - | - |\n\n```ts\nconst value = 1;\n  literal();\n```\n\n    indented\n    code";
  expect(normalizeMarkdown(source)).toBe("A paragraph continued.\n\n- First item continued.\n- Second item\n\n# Heading\n\n| A | B |\n| - | - |\n\n```ts\nconst value = 1;\n  literal();\n```\n\n    indented\n    code");
});
