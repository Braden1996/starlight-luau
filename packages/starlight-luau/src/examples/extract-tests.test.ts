import { describe, expect, test } from "bun:test";

import { readAstRoot } from "../ast/run-luau-ast.ts";
import { DecodeContext } from "../parse/decode-context.ts";
import { withLuauFile } from "../testing/parse-snippet.ts";
import type { TestExample } from "./extract-tests.ts";
import { extractTests } from "./extract-tests.ts";

const SPEC = `--!strict
local Result = require("./Result")

return function(t)
	t.test("map applies f to an Ok value", function()
		local doubled = Result.map(Result.ok(2), function(n: number): number
			return n * 2
		end)
		t.equal(doubled, Result.ok(4))
	end)

	t.test("unwrapOr passes callbacks around", function()
		t.equal(Result.unwrapOr(Result.err("e"), 0), 0)
		local f = Result.isOk
		t.equal(f(Result.ok(1)), true)
	end)

	it("is found as a bare global", function() end)

	t.test(dynamicName, function() end)
	t.helper("not a test", function() end)
	local _: { [string]: number } = {}
	Other.map(1)
end
`;

function extract(source: string): readonly TestExample[] {
  return withLuauFile(source, (file) =>
    extractTests(readAstRoot("luau-ast", file), new DecodeContext(source), {
      moduleName: "Result",
      testFunctions: new Set(["test", "it"]),
    }),
  );
}

describe("extractTests", () => {
  const tests = extract(SPEC);

  test("finds test calls with a literal name and a function body", () => {
    expect(tests.map((example) => [example.name, example.line])).toEqual([
      ["map applies f to an Ok value", 5],
      ["unwrapOr passes callbacks around", 12],
      ["is found as a bare global", 18],
    ]);
  });

  test("records every module member the body mentions, called or not", () => {
    expect([...(tests[0]?.mentions ?? [])].toSorted()).toEqual(["map", "ok"]);
    expect([...(tests[1]?.mentions ?? [])].toSorted()).toEqual(["err", "isOk", "ok", "unwrapOr"]);
  });

  test("keeps the body as dedented code", () => {
    expect(tests[0]?.code).toBe(
      [
        "local doubled = Result.map(Result.ok(2), function(n: number): number",
        "  return n * 2",
        "end)",
        "t.equal(doubled, Result.ok(4))",
      ].join("\n"),
    );
    expect(tests[2]?.code).toBe("");
  });
});
