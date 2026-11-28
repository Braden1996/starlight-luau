import { execFileSync } from "node:child_process";

import type { JsonNode } from "./json-node.ts";
import { asNode, nodeField } from "./json-node.ts";

const MAX_OUTPUT_BYTES = 256 * 1024 * 1024;

export class LuauAstError extends Error {
  constructor(file: string, cause: unknown) {
    super(`luau-ast could not parse ${file}`, { cause });
    this.name = "LuauAstError";
  }
}

function runExecutable(executable: string, file: string): string {
  try {
    return execFileSync(executable, [file], {
      encoding: "utf8",
      maxBuffer: MAX_OUTPUT_BYTES,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
  } catch (error) {
    throw new LuauAstError(file, error);
  }
}

function parseJson(output: string, file: string): unknown {
  try {
    return JSON.parse(output);
  } catch (error) {
    throw new LuauAstError(file, error);
  }
}

export function readAstRoot(executable: string, file: string): JsonNode {
  const document = asNode(parseJson(runExecutable(executable, file), file), "luau-ast output");
  return nodeField(document, "root");
}
