import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { LuauType } from "../model/luau-type.ts";
import type { ModuleApi, TypeAliasEntry } from "../model/module-api.ts";
import { parseModuleFile } from "../parse/parse-module-file.ts";

export function withLuauFile<T>(source: string, use: (file: string) => T): T {
  const directory = mkdtempSync(join(tmpdir(), "starlight-luau-"));
  try {
    const file = join(directory, "Module.luau");
    writeFileSync(file, source);
    return use(file);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function parseSnippet(source: string): ModuleApi {
  return withLuauFile(
    source,
    (path) => parseModuleFile("luau-ast", { name: "Module", path, file: "Module.luau" }).api,
  );
}

export function aliasOf(module: ModuleApi, name: string): TypeAliasEntry {
  const entry = module.types.find((candidate) => candidate.name === name);
  if (entry?.kind !== "alias") {
    throw new Error(`no type alias ${name}`);
  }
  return entry;
}

export function typeOf(declaration: string): LuauType {
  return aliasOf(parseSnippet(`${declaration}\nreturn nil\n`), "T").value;
}
