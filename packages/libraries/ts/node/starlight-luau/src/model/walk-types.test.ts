import { describe, expect, test } from "bun:test";

import { aliasOf, parseSnippet, typeOf } from "../testing/parse-snippet.ts";
import { referencesIn, typesOfEntry, typesOfFunction } from "./walk-types.ts";

function names(declaration: string): readonly string[] {
  return referencesIn([typeOf(declaration)])
    .map((reference) => reference.name)
    .toSorted();
}

describe("referencesIn", () => {
  test("finds references nested in every kind of type", () => {
    expect(names("type T = A<B> | ({ read c: C, [D]: E } & { F }) | (G?)")).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
    ]);
  });

  test("looks inside function parameters, variadics and returns", () => {
    expect(names("type T = <U>(a: A, ...B) -> (C, ...D)")).toEqual(["A", "B", "C", "D"]);
  });

  test("ignores singletons, typeof and generic packs", () => {
    expect(names('type T = "x" | true | typeof(y) | (P...) -> ()')).toEqual([]);
  });
});

describe("typesOfFunction and typesOfEntry", () => {
  const module = parseSnippet(`
export type Box<T = Default> = { read value: T }
type function f(t: type): type return t end
local M = {}
function M.go<U>(a: A, b, ...: R): Ret return nil :: any end
return M
`);

  test("collect a function's annotations", () => {
    const entry = module.functions[0];
    const found = entry === undefined ? [] : referencesIn(typesOfFunction(entry));
    expect(found.map((reference) => reference.name).toSorted()).toEqual(["A", "R", "Ret"]);
  });

  test("collect an alias's value and defaults; a type function has none", () => {
    const found = referencesIn(typesOfEntry(aliasOf(module, "Box")));
    expect(found.map((reference) => reference.name).toSorted()).toEqual(["Default", "T"]);
    const typeFunction = module.types.find((entry) => entry.kind === "type-function");
    expect(typeFunction === undefined ? undefined : typesOfEntry(typeFunction)).toEqual([]);
  });
});
