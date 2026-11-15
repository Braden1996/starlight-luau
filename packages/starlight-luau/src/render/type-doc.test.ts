import { describe, expect, test } from "bun:test";

import type { TypeReference } from "../model/luau-type.ts";
import { typeOf } from "../testing/parse-snippet.ts";
import { layout, layoutAsText } from "./layout.ts";
import type { LinkTarget } from "./type-doc.ts";
import { quoteString, typeDoc } from "./type-doc.ts";

function plain(): LinkTarget {
  return { style: "type", href: undefined };
}

function printed(declaration: string, width = 100): string {
  return layoutAsText(typeDoc(typeOf(declaration), plain), width);
}

function roundTrip(type: string): void {
  expect(printed(`type T = ${type}`)).toBe(type);
}

describe("typeDoc prints types the way they are written", () => {
  test.each([
    "number",
    "Map<string, { number }>",
    'Shape.Shape | "none"',
    "string?",
    "(string | number)?",
    "A & B & C",
    "true",
    '{ read kind: "Ok", read value: T }',
    "{ write label: string?, capacity: number }",
    "{ read [string]: number }",
    "{ n: number, [string]: boolean }",
    '{ ["two words"]: number }',
    "{}",
    "(a: number, string, ...boolean) -> ()",
    "<U, V...>(U, V...) -> (U, V...)",
    "() -> ...string",
    "(number) -> (string, number)",
    "() -> (() -> ())",
    "F<(number, string)>",
    "F<...number>",
    "F<P...>",
    "typeof(setmetatable({}, {}))",
  ])("%s", (type) => {
    roundTrip(type);
  });
});

describe("typeDoc layout", () => {
  test("breaks a long table one property per line with a trailing comma", () => {
    expect(printed("type T = { read first: number, read second: string }", 30)).toBe(
      "{\n  read first: number,\n  read second: string,\n}",
    );
  });

  test("breaks long generic argument lists", () => {
    expect(printed("type T = Matcher<VeryLongName, AnotherLongName>", 30)).toBe(
      "Matcher<\n  VeryLongName,\n  AnotherLongName\n>",
    );
  });

  test("breaks a long union before each bar", () => {
    expect(printed("type T = Alpha | Beta | Gamma", 12)).toBe("Alpha\n| Beta\n| Gamma");
  });

  test("collapses whitespace inside typeof", () => {
    expect(printed("type T = typeof(\n\tf(1,\n\t2)\n)")).toBe("typeof( f(1, 2) )");
  });
});

function linkByName(reference: TypeReference): LinkTarget {
  return reference.name === "T"
    ? { style: "generic", href: undefined }
    : { style: "type", href: `#${reference.name}` };
}

describe("typeDoc links", () => {
  test("styles and links each reference through the linker", () => {
    const tokens = layout(typeDoc(typeOf("type T = Box<T>"), linkByName), 80)[0]?.tokens ?? [];
    expect(tokens.map((token) => [token.text, token.style, token.href])).toEqual([
      ["Box", "type", "#Box"],
      ["<", "plain", undefined],
      ["T", "generic", undefined],
      [">", "plain", undefined],
    ]);
  });
});

describe("quoteString", () => {
  test("escapes quotes, backslashes and newlines", () => {
    expect(quoteString('a"b\\c\nd')).toBe('"a\\"b\\\\c\\nd"');
  });
});
