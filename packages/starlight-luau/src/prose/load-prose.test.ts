import { afterAll, describe, expect, test } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { ModuleApi } from "../model/module-api.ts";
import { loadProse, stripFrontmatter, unmatchedProse } from "./load-prose.ts";

const directory = mkdtempSync(join(tmpdir(), "starlight-luau-prose-"));
mkdirSync(join(directory, "Result", "types"), { recursive: true });
writeFileSync(join(directory, "Result.md"), "---\ntitle: ignored\n---\nModule prose.\n");
writeFileSync(join(directory, "Result", "map.md"), "Maps the value.\n");
writeFileSync(join(directory, "Result", "gone.md"), "Renamed away.\n");
writeFileSync(join(directory, "Result", "notes.txt"), "Not Markdown.\n");
writeFileSync(join(directory, "Result", "types", "Ok.md"), "The success variant.\n");

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

const api: ModuleApi = {
  name: "Result",
  file: "Result.luau",
  requires: new Map(),
  functions: [
    {
      kind: "function",
      name: "map",
      isMethod: false,
      line: 1,
      generics: [],
      genericPacks: [],
      parameters: [],
      variadic: { kind: "none" },
      returns: undefined,
    },
  ],
  types: [],
};

describe("loadProse", () => {
  const prose = loadProse(directory, "Result");

  test("reads the module page, function and type files, without frontmatter", () => {
    expect(prose.module).toBe("Module prose.");
    expect([...prose.functions]).toEqual([
      ["gone", "Renamed away."],
      ["map", "Maps the value."],
    ]);
    expect([...prose.types]).toEqual([["Ok", "The success variant."]]);
  });

  test("returns nothing for a module without prose or no prose directory", () => {
    expect(loadProse(directory, "Maybe")).toEqual({
      module: undefined,
      functions: new Map(),
      types: new Map(),
    });
    expect(loadProse(undefined, "Result").module).toBeUndefined();
  });

  test("names prose files that match no entry", () => {
    expect(unmatchedProse(prose, api)).toEqual(["Result/gone.md", "Result/types/Ok.md"]);
  });
});

describe("stripFrontmatter", () => {
  test("leaves text without frontmatter alone apart from trimming", () => {
    expect(stripFrontmatter("\nBody --- text\n")).toBe("Body --- text");
  });
});
