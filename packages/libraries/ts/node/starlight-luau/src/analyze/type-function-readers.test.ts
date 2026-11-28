import { describe, expect, test } from "bun:test";

import { ApiIndex } from "../link/api-index.ts";
import { moduleNamed, parseModules } from "../testing/parse-modules.ts";
import { typeFunctionReaders } from "./type-function-readers.ts";

const modules = parseModules({
  "Result.luau": `
type function payload(r: type, field: type): type return r end
export type OkOf<R> = payload<R, "value">
export type ErrOf<R> = payload<R, "error">
export type function Direct(r: type): type return r end
export type Box<T> = { read value: T }
local Result = {}
function Result.map<R, U>(result: R, f: (value: OkOf<R>) -> U): Box<ErrOf<R>>
	return nil :: any
end
function Result.direct<R>(result: R): Direct<R> return nil :: any end
function Result.plain<T>(value: T): Box<T> return nil :: any end
return Result
`,
});
const result = moduleNamed(modules, "Result");
const index = new ApiIndex(modules);

function readersOf(name: string): ReadonlyArray<readonly [string, readonly string[]]> {
  const entry = result.functions.find((candidate) => candidate.name === name);
  if (entry === undefined) {
    throw new Error(`no function ${name}`);
  }
  return typeFunctionReaders(result, entry, index).map(
    (item) => [item.generic, item.readers.map((reader) => reader.entry.name)] as const,
  );
}

describe("typeFunctionReaders", () => {
  test("lists the type-function aliases that read each whole-type generic", () => {
    expect(readersOf("map")).toEqual([["R", ["OkOf", "ErrOf"]]]);
  });

  test("counts exported type functions applied directly", () => {
    expect(readersOf("direct")).toEqual([["R", ["Direct"]]]);
  });

  test("ignores generics only used by ordinary aliases", () => {
    expect(readersOf("plain")).toEqual([]);
  });
});
