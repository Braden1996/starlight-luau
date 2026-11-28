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
      status: undefined,
      luauAst: "luau-ast",
      printWidth: 80,
      sidebar: true,
    });
  });

  test("turns examples off, or overrides parts of them", () => {
    expect(resolveOptions({ source: "src", examples: false }).examples).toBeUndefined();
    expect(resolveOptions({ source: "src", examples: { testFunctions: ["case"] } }).examples).toEqual({
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

describe("status options", () => {
  const levels = {
    modelled: { label: "Modelled", tone: "success", description: "Behaves like the game." },
    guessed: { label: "Guessed" },
  } as const;

  test("keep the levels in order, defaulting the tone", () => {
    expect(resolveOptions({ source: "src", status: { file: "status.json", levels } }).status).toEqual({
      file: "status.json",
      levels: [
        {
          id: "modelled",
          label: "Modelled",
          tone: "success",
          description: "Behaves like the game.",
        },
        { id: "guessed", label: "Guessed", tone: "default", description: undefined },
      ],
      unlisted: undefined,
    });
  });

  test("reject no levels, an unknown unlisted level, an empty label and an unknown tone", () => {
    const status = { file: "status.json", levels };
    expect(() => resolveOptions({ source: "src", status: { ...status, levels: {} } })).toThrow("at least one level");
    expect(() => resolveOptions({ source: "src", status: { ...status, unlisted: "faked" } })).toThrow(
      "`status.unlisted`",
    );
    expect(() =>
      resolveOptions({
        source: "src",
        status: { ...status, levels: { modelled: { label: " " } } },
      }),
    ).toThrow("non-empty");
    expect(() => resolveOptions({ source: "src", status: { ...status, file: "" } })).toThrow("`status.file`");
    const odd = { label: "Odd" };
    Object.assign(odd, { tone: "purple" });
    expect(() => resolveOptions({ source: "src", status: { file: "status.json", levels: { odd } } })).toThrow(
      'tone "purple"',
    );
  });
});

describe("sourceLinkFromTemplate", () => {
  test("fills {file} and {line}", () => {
    const link = sourceLinkFromTemplate("https://example.test/blob/main/src/{file}#L{line}");
    expect(link?.("Result.luau", 21)).toBe("https://example.test/blob/main/src/Result.luau#L21");
    expect(sourceLinkFromTemplate(undefined)).toBeUndefined();
  });
});
