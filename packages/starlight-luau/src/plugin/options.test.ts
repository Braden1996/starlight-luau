import { describe, expect, test } from "bun:test";

import { InvalidOptionsError, resolveOptions, sourceLinkFromTemplate } from "./options.ts";

describe("resolveOptions", () => {
  test("fills in the defaults", () => {
    expect(resolveOptions({ source: "../src" })).toEqual({
      source: "../src",
      include: ["**/*.luau"],
      exclude: ["**/*.spec.luau", "**/*.test.luau"],
      modules: undefined,
      output: "api",
      title: "API reference",
      prose: undefined,
      examples: {
        patterns: ["{dir}/{name}.spec.luau", "{dir}/{name}.test.luau"],
        testFunctions: ["test", "it"],
      },
      sourceUrl: undefined,
      luauAst: "luau-ast",
      printWidth: 80,
      sidebar: true,
    });
  });

  test("turns examples off, or overrides parts of them", () => {
    expect(resolveOptions({ source: "src", examples: false }).examples).toBeUndefined();
    expect(
      resolveOptions({ source: "src", examples: { testFunctions: ["case"] } }).examples,
    ).toEqual({
      patterns: ["{dir}/{name}.spec.luau", "{dir}/{name}.test.luau"],
      testFunctions: ["case"],
    });
  });

  test("rejects an empty source, an escaping output and a tiny print width", () => {
    expect(() => resolveOptions({ source: " " })).toThrow(InvalidOptionsError);
    expect(() => resolveOptions({ source: "src", output: "../outside" })).toThrow("`output`");
    expect(() => resolveOptions({ source: "src", output: "/" })).toThrow("`output`");
    expect(() => resolveOptions({ source: "src", printWidth: 5 })).toThrow("`printWidth`");
  });
});

describe("sourceLinkFromTemplate", () => {
  test("fills {file} and {line}", () => {
    const link = sourceLinkFromTemplate("https://example.test/blob/main/src/{file}#L{line}");
    expect(link?.("Result.luau", 21)).toBe("https://example.test/blob/main/src/Result.luau#L21");
    expect(sourceLinkFromTemplate(undefined)).toBeUndefined();
  });
});
