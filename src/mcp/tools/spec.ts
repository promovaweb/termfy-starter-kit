/** Read-only MCP access to the embedded binary specification. */
import { AppError } from "../../app/errors.ts";
import { loadSpec } from "../../spec/index.ts";
import type { Registrar } from "../server.ts";

/** Registers the spec tool and its discovery metadata without parsing until called. */
export function registerSpecTools({ server, catalog }: Registrar): void {
  const description = "Read the binary contract before operating it or proposing changes. Returns front matter, sections and progress without writing.";
  catalog.tools.push({ name: "spec", description });
  server.registerTool("spec", {
    title: "Binary specification", description, inputSchema: {},
  }, async () => {
    try {
      const { frontmatter, sections, progress } = loadSpec();
      const data = { frontmatter, sections, progress };
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }], structuredContent: data };
    } catch (e) {
      if (!(e instanceof AppError)) throw e;
      return { isError: true, content: [{ type: "text", text: e.message }] };
    }
  });
}
