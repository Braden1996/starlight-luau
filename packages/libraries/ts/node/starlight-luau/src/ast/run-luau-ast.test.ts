import { describe, expect, test } from "bun:test";

import { withLuauFile } from "../testing/parse-snippet.ts";
import { nodeArrayField, nodeType } from "./json-node.ts";
import { LuauAstError, readAstRoot } from "./run-luau-ast.ts";

describe("readAstRoot", () => {
  test("returns the root block of a parsed file", () => {
    const root = withLuauFile("local x = 1\nreturn x\n", (file) => readAstRoot("luau-ast", file));
    expect(nodeType(root)).toBe("AstStatBlock");
    expect(nodeArrayField(root, "body").map(nodeType)).toEqual(["AstStatLocal", "AstStatReturn"]);
  });

  test("wraps a missing executable in a LuauAstError naming the file", () => {
    expect(() => readAstRoot("luau-ast-does-not-exist", "x.luau")).toThrow(LuauAstError);
    expect(() => readAstRoot("luau-ast-does-not-exist", "x.luau")).toThrow("x.luau");
  });
});
