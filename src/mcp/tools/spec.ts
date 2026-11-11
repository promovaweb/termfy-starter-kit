/**
 * Read-only MCP access to the CLISPEC contract.
 *
 * - `spec`: the embedded `CLISPEC.md`, the macro view of the binary
 *   (identity, delivered surface, spec index and sections).
 * - `specs`: the specs that evolve the binary. Without `id`, lists them
 *   (from `specs/` when the server runs in the project, otherwise from the
 *   index); with `id`, returns one spec with its changes, tasks and tests.
 */
import { z } from "zod";
import { AppError } from "../../app/errors.ts";
import { describeSpec, listSpecs } from "../../cli/commands/spec.ts";
import { findSpec, loadProject, loadSpec } from "../../spec/index.ts";
import type { Registrar } from "../server.ts";

function failure(e: unknown) {
  if (!(e instanceof AppError)) throw e;
  return { isError: true, content: [{ type: "text" as const, text: e.message }] };
}

function success(data: Record<string, unknown>) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }], structuredContent: data };
}

/** Registers the spec and specs tools without parsing until called. */
export function registerSpecTools({ server, catalog }: Registrar): void {
  const specDescription = "Read the binary contract (CLISPEC.md) before operating it or proposing changes. Returns identity, delivered surface, spec index and sections without writing.";
  catalog.tools.push({ name: "spec", description: specDescription });
  server.registerTool("spec", {
    title: "Binary specification", description: specDescription, inputSchema: {},
  }, async () => {
    try {
      const { frontmatter, sections } = loadSpec();
      return success({ frontmatter, sections });
    } catch (e) {
      return failure(e);
    }
  });

  const specsDescription = "List the specs that evolve the binary, or read one by id with its changes, tasks, tests and progress. Read only.";
  catalog.tools.push({ name: "specs", description: specsDescription });
  server.registerTool("specs", {
    title: "Binary specs", description: specsDescription,
    inputSchema: { id: z.string().optional().describe("Spec ID, such as 0002. Omit to list every spec.") },
  }, async ({ id }) => {
    try {
      if (!id) return success(listSpecs());
      const project = loadProject(undefined, { required: true })!;
      return success(describeSpec(findSpec(project.specs, id)));
    } catch (e) {
      return failure(e);
    }
  });
}
