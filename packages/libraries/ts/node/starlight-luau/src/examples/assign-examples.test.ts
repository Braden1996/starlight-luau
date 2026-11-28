import { describe, expect, test } from "bun:test";

import { examplesForFunction, wordsOf } from "./assign-examples.ts";
import type { TestExample } from "./extract-tests.ts";

function example(name: string, mentions: readonly string[]): TestExample {
  return { name, line: 1, code: "", mentions: new Set(mentions) };
}

const functions = new Set(["map", "mapErr", "ok", "err", "match"]);
const examples = [
  example("map and mapErr touch one side", ["map", "mapErr", "ok", "err"]),
  example("ok and err build tagged tables", ["ok", "err"]),
  example("handlers run exactly once", ["match"]),
];

function namesFor(functionName: string): readonly string[] {
  return examplesForFunction(functionName, examples, functions).map((found) => found.name);
}

describe("wordsOf", () => {
  test("splits a test name into identifier words", () => {
    expect([...wordsOf("map/mapErr: Ok(1) -> 2")]).toEqual(["map", "mapErr", "Ok"]);
  });
});

describe("examplesForFunction", () => {
  test("uses the functions a test's name mentions", () => {
    expect(namesFor("map")).toEqual(["map and mapErr touch one side"]);
    expect(namesFor("mapErr")).toEqual(["map and mapErr touch one side"]);
  });

  test("does not list a test under a helper its body only uses", () => {
    expect(namesFor("ok")).toEqual(["ok and err build tagged tables"]);
  });

  test("falls back to what the body mentions when the name mentions no function", () => {
    expect(namesFor("match")).toEqual(["handlers run exactly once"]);
  });

  test("is case-sensitive, like Luau names", () => {
    expect(examplesForFunction("Map", examples, new Set(["Map"]))).toEqual([]);
  });
});
