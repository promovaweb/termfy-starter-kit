/** Mounts the TUI on the OpenTUI test renderer and checks tabs by frame. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createTestRenderer, type TestRendererSetup } from "@opentui/core/testing";
import { HOME_VARIABLE } from "../src/config/paths.ts";
import { manifest } from "../src/app/manifest.ts";
import { mountTui } from "../src/tui/index.ts";
import { listSpecs } from "../src/cli/commands/spec.ts";

let dir: string;
let setup: TestRendererSetup;
let closed: Promise<void>;

beforeAll(async () => {
  dir = mkdtempSync(join(tmpdir(), "termfy-tui-"));
  process.env[HOME_VARIABLE] = dir;
  setup = await createTestRenderer({ width: 120, height: 32 });
  closed = mountTui(setup.renderer, {});
  await setup.renderOnce();
});

afterAll(async () => {
  await closed.catch(() => undefined);
  rmSync(dir, { recursive: true, force: true });
  delete process.env[HOME_VARIABLE];
});

describe("tui", () => {
  test("opens on the Overview tab with header, panels and key bar", async () => {
    const frame = setup.captureCharFrame();
    expect(frame).toContain(manifest.title);
    expect(frame).toContain(`v${manifest.version}`);
    expect(frame).toContain("Overview");
    expect(frame).toContain("About");
    expect(frame).toContain("Environment");
    expect(frame).toContain("Settings in effect");
    expect(frame).toContain("quit");
  });

  test("key 2 goes to Specs with the spec list and the selected spec", async () => {
    setup.mockInput.pressKey("2");
    await setup.renderOnce();
    let frame = setup.captureCharFrame();
    expect(frame).toContain("CLISPEC.md");
    const { specs } = listSpecs();
    if (!specs.length) { expect(frame).toContain("No specs yet"); return; }
    expect(frame).toContain(`${specs[0]!.id} ${specs[0]!.title}`.slice(0, 30));
    if (specs.length < 2) return;
    setup.mockInput.pressArrow("down");
    await setup.renderOnce();
    frame = setup.captureCharFrame();
    expect(frame).toContain(`${specs[1]!.id} ${specs[1]!.title}`.slice(0, 30));
  });

  test("key 3 goes to About and ? opens the help", async () => {
    setup.mockInput.pressKey("3");
    await setup.renderOnce();
    let frame = setup.captureCharFrame();
    expect(frame).toContain("Credits");
    expect(frame).toContain("OpenTUI");
    setup.mockInput.pressKey("?");
    await setup.renderOnce();
    frame = setup.captureCharFrame();
    expect(frame).toContain("Keys");
    setup.mockInput.pressKey("?");
    await setup.renderOnce();
  });

  test("q destroys the renderer", async () => {
    setup.mockInput.pressKey("q");
    await closed;
    expect(setup.renderer.isDestroyed).toBe(true);
  });
});
