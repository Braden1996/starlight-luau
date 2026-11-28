import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { discoverModules, exampleFilesFor, moduleNameOf } from "./discover-modules.ts";

const root = mkdtempSync(join(tmpdir(), "starlight-luau-discover-"));
for (const file of ["Result.luau", "Result.spec.luau", "net/Http.luau", "net/init.luau", "notes.md", "legacy.lua"]) {
  mkdirSync(join(root, file, ".."), { recursive: true });
  writeFileSync(join(root, file), "return {}\n");
}

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

const defaults = {
  sourceRoot: root,
  include: ["**/*.luau", "**/*.lua"],
  exclude: ["**/*.spec.luau"],
  modules: undefined,
};

describe("moduleNameOf", () => {
  test("drops the extension and folds init files into their folder", () => {
    expect(moduleNameOf("Result.luau")).toBe("Result");
    expect(moduleNameOf("net/init.luau")).toBe("net");
    expect(moduleNameOf("legacy.lua")).toBe("legacy");
  });
});

describe("discoverModules", () => {
  test("finds included Luau files, minus excluded ones, in sorted order with posix paths", () => {
    expect(discoverModules(defaults).modules.map((module) => [module.name, module.file])).toEqual([
      ["Result", "Result.luau"],
      ["legacy", "legacy.lua"],
      ["net/Http", "net/Http.luau"],
      ["net", "net/init.luau"],
    ]);
  });

  test("keeps only the listed modules, in the listed order, and reports missing names", () => {
    const discovery = discoverModules({ ...defaults, modules: ["net/Http", "Missing", "Result"] });
    expect(discovery.modules.map((module) => module.name)).toEqual(["net/Http", "Result"]);
    expect(discovery.missing).toEqual(["Missing"]);
  });
});

describe("exampleFilesFor", () => {
  test("fills {dir} and {name} and keeps files that exist", () => {
    const [result] = discoverModules(defaults).modules;
    const files =
      result === undefined ? [] : exampleFilesFor(root, result, ["{dir}/{name}.spec.luau", "{dir}/{name}.test.luau"]);
    expect(files).toEqual([join(root, "./Result.spec.luau")]);
  });
});
