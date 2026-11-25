import { readFileSync } from "node:fs";

/** Uses the distribution's display name; containers may omit os-release. */
export function systemLabel(platform = process.platform, read = (file: string) => readFileSync(file, "utf8")): string {
  if (platform === "darwin") return "macOS";
  if (platform === "win32") return "Windows";
  if (platform !== "linux") return platform;

  for (const path of ["/etc/os-release", "/usr/lib/os-release"]) {
    try {
      const release = read(path);
      for (const field of ["PRETTY_NAME", "NAME"]) {
        const raw = release.match(new RegExp(`^${field}=(.*)$`, "m"))?.[1]?.trim();
        const value = raw?.replace(/^(["'])(.*)\1$/, "$2").replace(/\\(["\\$`])/g, "$1").trim();
        if (value) return value;
      }
    } catch {
      // Try the vendor file if the local release information is unavailable.
    }
  }
  return "Linux";
}
