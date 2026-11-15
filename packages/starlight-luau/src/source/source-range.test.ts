import { describe, expect, test } from "bun:test";

import { isEmptyRange, parseSourceRange } from "./source-range.ts";

describe("parseSourceRange", () => {
  test("reads zero-based line and column pairs", () => {
    expect(parseSourceRange("21,27 - 21,31")).toEqual({
      start: { line: 21, column: 27 },
      end: { line: 21, column: 31 },
    });
  });

  test("spans several lines", () => {
    expect(parseSourceRange("34,0 - 47,3").end).toEqual({ line: 47, column: 3 });
  });

  test("rejects text that is not a location", () => {
    expect(() => parseSourceRange("21,27")).toThrow('malformed luau-ast location "21,27"');
    expect(() => parseSourceRange("a,b - 1,2")).toThrow("malformed");
    expect(() => parseSourceRange("1,2,3 - 1,2")).toThrow("malformed");
  });
});

describe("isEmptyRange", () => {
  test("is true only when start and end coincide", () => {
    expect(isEmptyRange(parseSourceRange("0,58 - 0,58"))).toBe(true);
    expect(isEmptyRange(parseSourceRange("0,58 - 0,59"))).toBe(false);
  });
});
