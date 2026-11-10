/** Tests key rotation, environment replacement and unchanged files on rejection. */
import { afterEach, beforeEach, expect, test } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { getCredential, rotateMasterKey, setCredential } from "../src/config/credentials.ts";
import { decrypt } from "../src/config/crypto.ts";
import { HOME_VARIABLE, MASTER_KEY_VARIABLE, paths } from "../src/config/paths.ts";
import { ExitCode } from "../src/app/exit-codes.ts";

let dir: string;
let home: string | undefined;
let envKey: string | undefined;
beforeEach(() => {
  home = process.env[HOME_VARIABLE]; envKey = process.env[MASTER_KEY_VARIABLE];
  dir = mkdtempSync(join(tmpdir(), "rotate-")); process.env[HOME_VARIABLE] = dir; delete process.env[MASTER_KEY_VARIABLE];
});
afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
  if (home === undefined) delete process.env[HOME_VARIABLE]; else process.env[HOME_VARIABLE] = home;
  if (envKey === undefined) delete process.env[MASTER_KEY_VARIABLE]; else process.env[MASTER_KEY_VARIABLE] = envKey;
});
test("random rotation preserves credentials and rejects the previous key", () => {
  setCredential("test.token", "secret-value");
  const oldKey = readFileSync(paths.masterKey(), "utf8").trim();
  expect(rotateMasterKey()).toEqual({ rotated: true, source: "file" });
  expect(getCredential("test.token")).toBe("secret-value");
  expect(readFileSync(paths.masterKey(), "utf8").trim()).not.toBe(oldKey);
  expect(statSync(paths.masterKey()).mode & 0o777).toBe(0o600);
  expect(statSync(paths.credentials()).mode & 0o777).toBe(0o600);
  expect(() => decrypt(JSON.parse(readFileSync(paths.credentials(), "utf8")), Buffer.from(oldKey, "hex"))).toThrow();
});
test("from-env opens with the disk key and replaces it with the environment key", () => {
  setCredential("test.token", "secret-value");
  process.env[MASTER_KEY_VARIABLE] = "12".repeat(32);
  rotateMasterKey(true);
  expect(getCredential("test.token")).toBe("secret-value");
  expect(readFileSync(paths.masterKey(), "utf8").trim()).toBe("12".repeat(32));
  delete process.env[MASTER_KEY_VARIABLE];
  expect(getCredential("test.token")).toBe("secret-value");
});
test("invalid or absent new key leaves both files untouched", () => {
  setCredential("test.token", "secret-value");
  const key = readFileSync(paths.masterKey(), "utf8");
  const vault = readFileSync(paths.credentials(), "utf8");
  for (const value of [undefined, "invalid"]) {
    if (value) process.env[MASTER_KEY_VARIABLE] = value; else delete process.env[MASTER_KEY_VARIABLE];
    expect(() => rotateMasterKey(true)).toThrow();
    expect(readFileSync(paths.masterKey(), "utf8")).toBe(key);
    expect(readFileSync(paths.credentials(), "utf8")).toBe(vault);
  }
});
test("missing vault or current key returns CREDENTIALS", () => {
  expect(() => rotateMasterKey()).toThrow(expect.objectContaining({ code: ExitCode.CREDENTIALS }));
  setCredential("test.token", "secret-value"); unlinkSync(paths.masterKey());
  expect(() => rotateMasterKey()).toThrow(expect.objectContaining({ code: ExitCode.CREDENTIALS }));
});
test("a current environment key can rotate to a random disk key", () => {
  process.env[MASTER_KEY_VARIABLE] = "34".repeat(32);
  setCredential("test.token", "secret-value");
  rotateMasterKey();
  expect(getCredential("test.token")).toBe("secret-value");
});
