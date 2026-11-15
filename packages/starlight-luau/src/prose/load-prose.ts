import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type { ModuleApi } from "../model/module-api.ts";

export interface ModuleProse {
  readonly module: string | undefined;
  readonly functions: ReadonlyMap<string, string>;
  readonly types: ReadonlyMap<string, string>;
}

const FRONTMATTER = /^---\r?\n[\s\S]*?\r?\n---\r?\n/u;
const EMPTY_PROSE: ModuleProse = { module: undefined, functions: new Map(), types: new Map() };

export function stripFrontmatter(markdown: string): string {
  return markdown.replace(FRONTMATTER, "").trim();
}

function readMarkdown(path: string): string | undefined {
  return existsSync(path) ? stripFrontmatter(readFileSync(path, "utf8")) : undefined;
}

function readMarkdownDirectory(directory: string): ReadonlyMap<string, string> {
  if (!existsSync(directory)) {
    return new Map();
  }
  const files = readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .toSorted((first, second) => (first.name < second.name ? -1 : 1));
  return new Map(
    files.map((entry) => [
      entry.name.slice(0, -".md".length),
      stripFrontmatter(readFileSync(join(directory, entry.name), "utf8")),
    ]),
  );
}

export function loadProse(directory: string | undefined, moduleName: string): ModuleProse {
  if (directory === undefined) {
    return EMPTY_PROSE;
  }
  const moduleDirectory = join(directory, moduleName);
  return {
    module: readMarkdown(join(directory, `${moduleName}.md`)),
    functions: readMarkdownDirectory(moduleDirectory),
    types: readMarkdownDirectory(join(moduleDirectory, "types")),
  };
}

export function unmatchedProse(prose: ModuleProse, api: ModuleApi): readonly string[] {
  const functionNames = new Set(api.functions.map((entry) => entry.name));
  const typeNames = new Set(api.types.map((entry) => entry.name));
  return [
    ...[...prose.functions.keys()]
      .filter((name) => !functionNames.has(name))
      .map((name) => `${api.name}/${name}.md`),
    ...[...prose.types.keys()]
      .filter((name) => !typeNames.has(name))
      .map((name) => `${api.name}/types/${name}.md`),
  ];
}
