import { describe, expect, test } from "bun:test";

import { TokenIndex } from "./token-index.ts";

describe("TokenIndex", () => {
  const source = "export type function Z -- c\n(t)";
  const index = new TokenIndex(source);

  test("finds the token just before an offset, skipping whitespace and comments", () => {
    expect(index.tokenBefore(source.indexOf("("))?.text).toBe("Z");
  });

  test("lists earlier tokens nearest first", () => {
    const names = index.tokensBefore(source.indexOf("Z"), 3).map((token) => token.text);
    expect(names).toEqual(["function", "type", "export"]);
  });

  test("returns nothing before the first token", () => {
    expect(index.tokenBefore(0)).toBeUndefined();
    const names = index.tokensBefore(source.indexOf("type"), 5).map((token) => token.text);
    expect(names).toEqual(["export"]);
  });
});
