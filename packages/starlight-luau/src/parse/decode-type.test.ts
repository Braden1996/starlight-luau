import { describe, expect, test } from "bun:test";

import type { TypeArgument, TypeReference } from "../model/luau-type.ts";
import { aliasOf, parseSnippet, typeOf } from "../testing/parse-snippet.ts";

function reference(name: string, ...args: readonly TypeArgument[]): TypeReference {
  return { kind: "reference", prefix: undefined, name, arguments: args };
}

const number = reference("number");
const string = reference("string");

describe("decodeType", () => {
  test("references, with generic arguments and module prefixes", () => {
    expect(typeOf("type T = Map<string, number>")).toEqual(reference("Map", string, number));
    expect(typeOf("local M = require('./M')\ntype T = M.Thing")).toEqual({
      kind: "reference",
      prefix: "M",
      name: "Thing",
      arguments: [],
    });
  });

  test("string and boolean singletons", () => {
    expect(typeOf('type T = "Ok"')).toEqual({ kind: "string-singleton", value: "Ok" });
    expect(typeOf("type T = false")).toEqual({ kind: "boolean-singleton", value: false });
  });

  test("unions keep their members in order, and ? is an optional marker", () => {
    expect(typeOf("type T = string | number?")).toEqual({
      kind: "union",
      members: [string, number, { kind: "optional" }],
    });
  });

  test("intersections", () => {
    expect(typeOf("type T = number & string")).toEqual({
      kind: "intersection",
      members: [number, string],
    });
  });

  test("read, write and plain properties", () => {
    const table = typeOf(
      "type T = { read a: number, write b: string, c: number, read read: number }",
    );
    expect(table).toEqual({
      kind: "table",
      properties: [
        { name: "a", access: "read", type: number },
        { name: "b", access: "write", type: string },
        { name: "c", access: "read-write", type: number },
        { name: "read", access: "read", type: number },
      ],
      indexer: undefined,
    });
  });

  test("a property named read is not a modifier", () => {
    const table = typeOf("type T = { read: number }");
    expect(table).toMatchObject({ properties: [{ name: "read", access: "read-write" }] });
  });

  test("comments between the modifier and the name do not hide it", () => {
    const table = typeOf("type T = { read --[[ note ]] a: number }");
    expect(table).toMatchObject({ properties: [{ name: "a", access: "read" }] });
  });

  test("indexers, with access, beside properties", () => {
    expect(typeOf("type T = { n: number, read [string]: boolean }")).toMatchObject({
      kind: "table",
      indexer: { access: "read", key: string, value: reference("boolean") },
    });
  });

  test("array shorthand becomes an array, an explicit number indexer does not", () => {
    expect(typeOf("type T = { string }")).toEqual({ kind: "array", element: string });
    expect(typeOf("type T = { [number]: string }")).toMatchObject({ kind: "table" });
  });

  test("function types with named, unnamed and variadic parameters", () => {
    expect(typeOf("type T = (a: number, string, ...boolean) -> ()")).toEqual({
      kind: "function",
      generics: [],
      genericPacks: [],
      parameters: [
        { name: "a", type: number },
        { name: undefined, type: string },
      ],
      variadic: { kind: "variadic", element: reference("boolean") },
      returns: { kind: "list", types: [], tail: undefined },
    });
  });

  test("generic function types and generic packs", () => {
    expect(typeOf("type T = <U, V...>(U, V...) -> (U, V...)")).toEqual({
      kind: "function",
      generics: [{ name: "U", defaultType: undefined }],
      genericPacks: [{ name: "V", defaultPack: undefined }],
      parameters: [{ name: undefined, type: reference("U") }],
      variadic: { kind: "generic-pack", name: "V" },
      returns: { kind: "list", types: [reference("U")], tail: { kind: "generic-pack", name: "V" } },
    });
  });

  test("variadic returns", () => {
    expect(typeOf("type T = () -> ...string")).toMatchObject({
      returns: { kind: "variadic", element: string },
    });
  });

  test("type pack arguments to references", () => {
    expect(typeOf("type F<A...> = (A...) -> ()\ntype T = F<(number, string)>")).toEqual(
      reference("F", { kind: "list", types: [number, string], tail: undefined }),
    );
  });

  test("typeof keeps its expression text", () => {
    expect(typeOf("type T = typeof(setmetatable({}, {}))")).toEqual({
      kind: "typeof",
      expression: "typeof(setmetatable({}, {}))",
    });
  });

  test("parentheses are kept as a group", () => {
    expect(typeOf("type T = (number | string)?")).toEqual({
      kind: "union",
      members: [
        { kind: "group", inner: { kind: "union", members: [number, string] } },
        { kind: "optional" },
      ],
    });
  });

  test("generic defaults on aliases", () => {
    const module = parseSnippet(
      "export type Box<T = string, U... = ...number> = { read value: T }\nreturn nil",
    );
    expect(aliasOf(module, "Box").generics).toEqual([{ name: "T", defaultType: string }]);
    expect(aliasOf(module, "Box").genericPacks).toEqual([
      { name: "U", defaultPack: { kind: "variadic", element: number } },
    ]);
  });
});
