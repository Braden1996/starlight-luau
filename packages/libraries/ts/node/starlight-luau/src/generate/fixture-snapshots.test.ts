import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { EXPECTED, generateFixtures } from "../testing/fixture-generation.ts";

const generation = generateFixtures();

describe("the fixture library", () => {
  test("generates exactly the expected pages", () => {
    expect(generation.pages.map((page) => page.path).toSorted()).toEqual(readdirSync(EXPECTED).toSorted());
  });

  test.each(generation.pages.map((page) => [page.path, page.content] as const))(
    "%s matches fixtures/expected (run `sgt run snapshots` to update)",
    (path, content) => {
      expect(content).toBe(readFileSync(join(EXPECTED, path), "utf8"));
    },
  );

  test("warns about nothing", () => {
    expect(generation.warnings).toEqual([]);
  });

  test("watches the modules and their spec files", () => {
    const names = generation.inputs.map((input) => input.replaceAll("\\", "/").split("/").at(-1));
    expect(names).toEqual(["Shape.luau", "Inventory.luau", "Shape.spec.luau", "Inventory.spec.luau", "status.json"]);
  });
});
