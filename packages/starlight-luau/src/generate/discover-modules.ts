import { existsSync, globSync } from "node:fs";
import { join, posix } from "node:path";

import type { ModuleFile } from "../parse/parse-module-file.ts";

export interface DiscoveryOptions {
  readonly sourceRoot: string;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly modules: readonly string[] | undefined;
}

export interface Discovery {
  readonly modules: readonly ModuleFile[];
  readonly missing: readonly string[];
}

const LUAU_EXTENSION = /\.luau?$/u;

function toPosix(path: string): string {
  return path.replaceAll("\\", "/");
}

export function moduleNameOf(file: string): string {
  const withoutExtension = file.replace(LUAU_EXTENSION, "");
  return withoutExtension.endsWith("/init")
    ? withoutExtension.slice(0, -"/init".length)
    : withoutExtension;
}

function selected(found: readonly ModuleFile[], names: readonly string[] | undefined): Discovery {
  if (names === undefined) {
    return { modules: found, missing: [] };
  }
  const byName = new Map(found.map((module) => [module.name, module]));
  return {
    modules: names.flatMap((name) => byName.get(name) ?? []),
    missing: names.filter((name) => !byName.has(name)),
  };
}

export function discoverModules(options: DiscoveryOptions): Discovery {
  const files = globSync([...options.include], {
    cwd: options.sourceRoot,
    exclude: [...options.exclude],
  })
    .map(toPosix)
    .filter((file) => LUAU_EXTENSION.test(file))
    .toSorted();
  const found = files.map((file) => ({
    name: moduleNameOf(file),
    file,
    path: join(options.sourceRoot, file),
  }));
  return selected(found, options.modules);
}

export function exampleFilesFor(
  sourceRoot: string,
  module: ModuleFile,
  patterns: readonly string[],
): readonly string[] {
  const directory = posix.dirname(module.file);
  const name = module.name.split("/").at(-1) ?? module.name;
  return patterns
    .map((pattern) =>
      join(sourceRoot, pattern.replaceAll("{dir}", directory).replaceAll("{name}", name)),
    )
    .filter((path) => existsSync(path));
}
