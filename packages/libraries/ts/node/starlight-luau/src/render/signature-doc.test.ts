import { describe, expect, test } from "bun:test";

import type { FunctionEntry, TypeEntry } from "../model/module-api.ts";
import { aliasOf, parseSnippet } from "../testing/parse-snippet.ts";
import { layoutAsText } from "./layout.ts";
import { aliasSignatureDoc, functionSignatureDoc, typeFunctionSignatureDoc } from "./signature-doc.ts";
import type { LinkTarget } from "./type-doc.ts";

function plain(): LinkTarget {
  return { style: "type", href: undefined };
}

const module = parseSnippet(`
export type Ok<T> = { read kind: "Ok", read value: T }
export type Result<T, E> = Ok<T> | Err<E>
type Box<T = string> = { read value: T }
type function payload(result: type, field: type): type return result end
local M = {}
function M.map<R, U>(result: R, f: (value: OkOf<R>) -> U): Result<U, ErrOf<R>> return nil :: any end
function M.each<T, A...>(
	inventory: Inventory<T>,
	visit: Visitor<T, A...>,
	...: A...
): (number, boolean)
	return 0, true
end
function M.untyped(a, ...) end
function M.rest(...: string): ...number return 1 end
function M:method(x: number) end
return M
`);

function functionNamed(name: string): FunctionEntry {
  const entry = module.functions.find((candidate) => candidate.name === name);
  if (entry === undefined) {
    throw new Error(`no function ${name}`);
  }
  return entry;
}

function signature(name: string, width = 120): string {
  return layoutAsText(functionSignatureDoc("M", functionNamed(name), plain), width);
}

describe("functionSignatureDoc", () => {
  test("prints generics, typed parameters and returns on one line when they fit", () => {
    expect(signature("map")).toBe("function M.map<R, U>(result: R, f: (value: OkOf<R>) -> U): Result<U, ErrOf<R>>");
  });

  test("puts parameters one per line, without a trailing comma, when they do not fit", () => {
    expect(signature("each", 60)).toBe(
      "function M.each<T, A...>(\n  inventory: Inventory<T>,\n  visit: Visitor<T, A...>,\n  ...: A...\n): (number, boolean)",
    );
  });

  test("breaks the parameters, not the return type, when only the return type overflows", () => {
    expect(signature("map", 70)).toBe(
      "function M.map<R, U>(\n  result: R,\n  f: (value: OkOf<R>) -> U\n): Result<U, ErrOf<R>>",
    );
  });

  test("prints untyped parameters and varargs bare, and omits a missing return", () => {
    expect(signature("untyped")).toBe("function M.untyped(a, ...)");
  });

  test("prints typed varargs and variadic returns", () => {
    expect(signature("rest")).toBe("function M.rest(...: string): ...number");
  });

  test("uses a colon for methods", () => {
    expect(signature("method")).toBe("function M:method(x: number)");
  });
});

describe("aliasSignatureDoc", () => {
  test("prints exported aliases with their generics", () => {
    expect(layoutAsText(aliasSignatureDoc(aliasOf(module, "Ok"), plain), 80)).toBe(
      'export type Ok<T> = { read kind: "Ok", read value: T }',
    );
  });

  test("prints generic defaults on private aliases", () => {
    expect(layoutAsText(aliasSignatureDoc(aliasOf(module, "Box"), plain), 80)).toBe(
      "type Box<T = string> = { read value: T }",
    );
  });

  test("puts each union member on its own line when the union does not fit", () => {
    expect(layoutAsText(aliasSignatureDoc(aliasOf(module, "Result"), plain), 30)).toBe(
      "export type Result<T, E> =\n  | Ok<T>\n  | Err<E>",
    );
    expect(layoutAsText(aliasSignatureDoc(aliasOf(module, "Result"), plain), 80)).toBe(
      "export type Result<T, E> = Ok<T> | Err<E>",
    );
  });
});

describe("typeFunctionSignatureDoc", () => {
  test("prints the header with type-typed parameters", () => {
    const entry: TypeEntry | undefined = module.types.find((candidate) => candidate.kind === "type-function");
    expect(entry?.kind === "type-function" ? layoutAsText(typeFunctionSignatureDoc(entry), 80) : "").toBe(
      "type function payload(result: type, field: type): type",
    );
  });
});
