import { expect, test } from "bun:test";
import { systemLabel } from "../src/tui/system-label.ts";

test("the header uses the distribution name and falls back on minimal systems", () => {
  expect(systemLabel("linux", () => 'NAME=Debian\nPRETTY_NAME="Debian GNU/Linux 13 (trixie)"')).toBe("Debian GNU/Linux 13 (trixie)");
  expect(systemLabel("linux", path => path.startsWith("/usr/") ? "NAME=Alpine" : "")).toBe("Alpine");
  expect(systemLabel("linux", () => { throw new Error("missing"); })).toBe("Linux");
  expect(systemLabel("darwin")).toBe("macOS");
  expect(systemLabel("win32")).toBe("Windows");
});
