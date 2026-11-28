import { describe, expect, test } from "bun:test";

import { parseSourceRange } from "./source-range.ts";
import { SourceText } from "./source-text.ts";

describe("SourceText", () => {
  test("slices a range on one line", () => {
    const source = new SourceText("local x = 1\nlocal yes = true\n");
    expect(source.slice(parseSourceRange("1,6 - 1,9"))).toBe("yes");
  });

  test("slices across lines and normalises CRLF", () => {
    const source = new SourceText("a(\r\n  b\r\n)");
    expect(source.slice(parseSourceRange("0,1 - 2,1"))).toBe("(\n  b\n)");
  });

  test("treats columns as UTF-8 byte offsets, as luau-ast reports them", () => {
    const source = new SourceText('local s = "héllo" -- x');
    expect(source.slice(parseSourceRange("0,22 - 0,23"))).toBe("x");
  });

  test("rejects a line past the end", () => {
    expect(() => new SourceText("x").offsetOf({ line: 3, column: 0 })).toThrow("line 3");
  });
});
