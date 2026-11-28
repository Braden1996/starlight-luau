import { describe, expect, test } from "bun:test";

import type { TypeReference } from "../model/luau-type.ts";
import { unreachable } from "../model/unreachable.ts";
import { moduleNamed, parseModules } from "../testing/parse-modules.ts";
import type { Resolution } from "./api-index.ts";
import { ApiIndex } from "./api-index.ts";

const modules = parseModules({
  "Shape.luau": `
export type Shape = { read kind: "Circle" }
type Hidden = number
return {}
`,
  "Store.luau": `
local Shape = require("./Shape")
local Missing = require("./Missing")
local Nested = require("./nested")

export type Item<T> = { read shape: Shape.Shape, read payload: T, read extra: Extra }
type Extra = { read more: Deeper }
type Deeper = number
type Unused = string
type function compute(t: type): type return t end
export type Computed<T> = compute<T>

local Store = {}
function Store.get(id: Key): Item<string> return nil :: any end
type Key = string
return Store
`,
  "nested/init.luau": "export type Leaf = number\nreturn {}\n",
});
const index = new ApiIndex(modules);
const store = moduleNamed(modules, "Store");

function reference(name: string, prefix?: string): TypeReference {
  return { kind: "reference", prefix, name, arguments: [] };
}

function describeResolution(resolution: Resolution): string {
  switch (resolution.kind) {
    case "entry":
      return `${resolution.module.name}.${resolution.entry.name}`;
    case "generic":
    case "builtin":
      return `${resolution.kind}:${resolution.name}`;
    case "unresolved":
      return "unresolved";
    default:
      return unreachable(resolution);
  }
}

function resolve(name: string, prefix?: string, generics: readonly string[] = []): string {
  return describeResolution(index.resolve(reference(name, prefix), { module: store, generics: new Set(generics) }));
}

describe("ApiIndex", () => {
  test("documents exported types and the private types they or the functions reach", () => {
    expect(index.documentedTypes(store).map((entry) => entry.name)).toEqual([
      "Item",
      "Extra",
      "Deeper",
      "compute",
      "Computed",
      "Key",
    ]);
  });

  test("resolves local names to documented entries", () => {
    expect(resolve("Item")).toBe("Store.Item");
    expect(resolve("compute")).toBe("Store.compute");
    expect(resolve("Unused")).toBe("unresolved");
  });

  test("prefers generics in scope over types of the same name", () => {
    expect(resolve("Item", undefined, ["Item"])).toBe("generic:Item");
  });

  test("recognises builtins", () => {
    expect(resolve("number")).toBe("builtin:number");
    expect(resolve("unknown")).toBe("builtin:unknown");
  });

  test("follows required modules by relative path, including init files", () => {
    expect(resolve("Shape", "Shape")).toBe("Shape.Shape");
    expect(resolve("Leaf", "Nested")).toBe("init.Leaf");
    expect(index.requiredModule(store, "Nested")?.file).toBe("nested/init.luau");
  });

  test("leaves unexported or unknown cross-module names unresolved", () => {
    expect(resolve("Hidden", "Shape")).toBe("unresolved");
    expect(resolve("Thing", "Missing")).toBe("unresolved");
    expect(resolve("Thing", "NotRequired")).toBe("unresolved");
  });
});
