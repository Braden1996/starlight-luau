import { describe, expect, test } from "bun:test";

import { ApiIndex, scopeOfType } from "../link/api-index.ts";
import type { TypeAliasEntry } from "../model/module-api.ts";
import { moduleNamed, parseModules } from "../testing/parse-modules.ts";
import { aliasOf } from "../testing/parse-snippet.ts";
import { taggedUnionOf } from "./tagged-union.ts";

const modules = parseModules({
  "Other.luau": 'export type Remote = { read kind: "Remote", read url: string }\nreturn {}\n',
  "Main.luau": `
local Other = require("./Other")
export type Ok<T> = { read kind: "Ok", read value: T }
export type Err<E> = { read kind: "Err", read error: E }
export type Result<T, E> = Ok<T> | Err<E>
export type Source = { read kind: "Local", read path: string } | Other.Remote
export type ByType = { type: "a", kind: string } | { type: "b", kind: string }
export type Duplicate = { read kind: "A" } | { read kind: "A" }
export type Mixed = Ok<number> | string
export type Maybe = Ok<number>?
export type Plain = number | string
return {}
`,
});
const main = moduleNamed(modules, "Main");
const index = new ApiIndex(modules);

function unionOf(name: string): ReturnType<typeof taggedUnionOf> {
  const alias: TypeAliasEntry = aliasOf(main, name);
  return taggedUnionOf(alias, scopeOfType(main, alias), index);
}

function tagsOf(name: string): readonly string[] | undefined {
  return unionOf(name)?.variants.map((variant) => variant.tag);
}

describe("taggedUnionOf", () => {
  test("finds the discriminant through generic aliases", () => {
    expect(unionOf("Result")?.discriminant).toBe("kind");
    expect(tagsOf("Result")).toEqual(["Ok", "Err"]);
  });

  test("mixes inline tables and aliases from required modules", () => {
    expect(tagsOf("Source")).toEqual(["Local", "Remote"]);
  });

  test("picks the first field whose singletons tell every variant apart", () => {
    expect(unionOf("ByType")?.discriminant).toBe("type");
  });

  test("rejects duplicate tags, non-table members, optionals and plain unions", () => {
    expect(unionOf("Duplicate")).toBeUndefined();
    expect(unionOf("Mixed")).toBeUndefined();
    expect(unionOf("Maybe")).toBeUndefined();
    expect(unionOf("Plain")).toBeUndefined();
    expect(unionOf("Ok")).toBeUndefined();
  });
});
