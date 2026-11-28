import { describe, expect, test } from "bun:test";

import { parseSnippet } from "../testing/parse-snippet.ts";

const MODULE = `--!strict
local Other = require("./Other")
local helper = require("./helper")

export type Box<T> = { read value: T }
type Private = number

type function unwrap(box: type): type
	return box:readproperty(types.singleton("value"))
end

export type function Unwrap(box: type): type
	return unwrap(box)
end

local Module = {}

local function hidden() end

function Module.box<T>(value: T): Box<T>
	return { value = value }
end

function Module.long(
	first: number,
	second: (number) -> ()
): ()
end

function Module.untyped(a, ...) end

function Module.typedRest(...: string): ...number
	return 1
end

function Module:method(x: number) end

local Shadow = {}
function Shadow.ignored() end

return Module
`;

describe("decodeModule", () => {
  const module = parseSnippet(MODULE);

  test("lists the returned table's functions in source order, with lines", () => {
    expect(module.functions.map((entry) => [entry.name, entry.line])).toEqual([
      ["box", 20],
      ["long", 24],
      ["untyped", 30],
      ["typedRest", 32],
      ["method", 36],
    ]);
  });

  test("reads generics, parameters and returns", () => {
    expect(module.functions[0]).toMatchObject({
      generics: [{ name: "T" }],
      parameters: [{ name: "value", type: { kind: "reference", name: "T" } }],
      variadic: { kind: "none" },
      returns: { kind: "list", types: [{ kind: "reference", name: "Box" }] },
    });
  });

  test("keeps multi-line signatures whole", () => {
    expect(module.functions[1]?.parameters.map((parameter) => parameter.name)).toEqual(["first", "second"]);
    expect(module.functions[1]?.parameters[1]?.type).toMatchObject({ kind: "function" });
  });

  test("records missing annotations as absent", () => {
    expect(module.functions[2]).toMatchObject({
      parameters: [{ name: "a", type: undefined }],
      variadic: { kind: "untyped" },
      returns: undefined,
    });
  });

  test("reads typed varargs and variadic returns", () => {
    expect(module.functions[3]).toMatchObject({
      variadic: { kind: "typed", pack: { kind: "variadic" } },
      returns: { kind: "variadic" },
    });
  });

  test("marks methods", () => {
    expect(module.functions.map((entry) => entry.isMethod)).toEqual([false, false, false, false, true]);
  });

  test("reads aliases and type functions with their export flags", () => {
    expect(module.types.map((entry) => [entry.kind, entry.name, entry.exported])).toEqual([
      ["alias", "Box", true],
      ["alias", "Private", false],
      ["type-function", "unwrap", false],
      ["type-function", "Unwrap", true],
    ]);
  });

  test("keeps a type function's parameters and source", () => {
    const exported = module.types[3];
    expect(exported).toMatchObject({ parameters: ["box"], line: 12 });
    expect(exported?.kind === "type-function" ? exported.implementation : "").toBe(
      "export type function Unwrap(box: type): type\n\treturn unwrap(box)\nend",
    );
  });

  test("maps required locals to their paths", () => {
    expect([...module.requires]).toEqual([
      ["Other", "./Other"],
      ["helper", "./helper"],
    ]);
  });

  test("a module that does not return a local has no functions", () => {
    expect(parseSnippet("local M = {}\nfunction M.f() end\nreturn { f = M.f }\n").functions).toEqual([]);
  });
});
