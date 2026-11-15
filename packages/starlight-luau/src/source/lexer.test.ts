import { describe, expect, test } from "bun:test";

import { tokenize } from "./lexer.ts";

function texts(source: string): readonly string[] {
  return tokenize(source).map((token) => token.text);
}

describe("tokenize", () => {
  test("splits names, numbers and symbols", () => {
    expect(texts("local x = 0x1F + 2.5e3")).toEqual(["local", "x", "=", "0x1F", "+", "2.5e3"]);
  });

  test("keeps multi-character symbols whole", () => {
    expect(texts("f(...) -> a :: b ~= c .. d //= 2")).toEqual([
      "f",
      "(",
      "...",
      ")",
      "->",
      "a",
      "::",
      "b",
      "~=",
      "c",
      "..",
      "d",
      "//=",
      "2",
    ]);
  });

  test("skips line and long comments", () => {
    expect(texts("a -- note\nb --[==[ long ]] still ]==] c")).toEqual(["a", "b", "c"]);
  });

  test("reads quoted, long and interpolated strings as one token", () => {
    const source = String.raw`"a\"b" 'c' [[d]] [=[e]]f]=] ` + "`g {h} \\` i`";
    expect(texts(source)).toEqual([
      String.raw`"a\"b"`,
      "'c'",
      "[[d]]",
      "[=[e]]f]=]",
      "`g {h} \\` i`",
    ]);
  });

  test("does not mistake an indexer bracket for a long string", () => {
    expect(texts("{ [string]: number }")).toEqual(["{", "[", "string", "]", ":", "number", "}"]);
  });

  test("records offsets into the source", () => {
    expect(tokenize("  read x")).toEqual([
      { kind: "name", text: "read", start: 2, end: 6 },
      { kind: "name", text: "x", start: 7, end: 8 },
    ]);
  });

  test("ends an unterminated string at the end of its line", () => {
    expect(texts('"open\nnext')).toEqual(['"open', "next"]);
  });
});
