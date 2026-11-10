/** Loads the specification embedded at build time, independently of the working directory. */
import spec from "../../CLISPEC.md" with { type: "text" };
import { parseSpec, type ParsedSpec } from "./parse.ts";

/** Returns a freshly parsed copy of the embedded specification. */
export function loadSpec(): ParsedSpec {
  return parseSpec(spec);
}
