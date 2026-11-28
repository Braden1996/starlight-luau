import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import type { ModuleApi } from "../model/module-api.ts";
import { parseModuleFile } from "../parse/parse-module-file.ts";

export type SnippetFiles = Readonly<Record<string, string>>;

function moduleNameOf(file: string): string {
  return file.replace(/^.*\//u, "").replace(/\.luau$/u, "");
}

export function parseModules(files: SnippetFiles): readonly ModuleApi[] {
  const directory = mkdtempSync(join(tmpdir(), "starlight-luau-"));
  try {
    return Object.entries(files).map(([file, source]) => {
      const path = join(directory, file);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, source);
      return parseModuleFile("luau-ast", { name: moduleNameOf(file), path, file }).api;
    });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

export function moduleNamed(modules: readonly ModuleApi[], name: string): ModuleApi {
  const found = modules.find((module) => module.name === name);
  if (found === undefined) {
    throw new Error(`no module ${name}`);
  }
  return found;
}
