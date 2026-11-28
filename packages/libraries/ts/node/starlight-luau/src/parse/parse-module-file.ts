import { readFileSync } from "node:fs";

import { readAstRoot } from "../ast/run-luau-ast.ts";
import type { ModuleApi } from "../model/module-api.ts";
import { DecodeContext } from "./decode-context.ts";
import { decodeModule } from "./decode-module.ts";

export interface ModuleFile {
  readonly name: string;
  readonly path: string;
  readonly file: string;
}

export interface ParsedModule {
  readonly api: ModuleApi;
  readonly context: DecodeContext;
}

export function parseModuleFile(luauAst: string, module: ModuleFile): ParsedModule {
  const context = new DecodeContext(readFileSync(module.path, "utf8"));
  const root = readAstRoot(luauAst, module.path);
  return { api: decodeModule({ name: module.name, file: module.file, root, context }), context };
}
