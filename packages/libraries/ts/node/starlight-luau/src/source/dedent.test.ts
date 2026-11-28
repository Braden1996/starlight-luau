import { describe, expect, test } from "bun:test";

import { dedent } from "./dedent.ts";

describe("dedent", () => {
  test("removes the common indent and blank edge lines", () => {
    expect(dedent("\n\t\tlocal x = 1\n\t\tif x then\n\t\t\tprint(x)\n\t\tend\n\t")).toBe(
      "local x = 1\nif x then\n  print(x)\nend",
    );
  });

  test("ignores blank lines when measuring the indent and keeps them", () => {
    expect(dedent("    a\n\n      b")).toBe("a\n\n  b");
  });

  test("returns an empty string for blank input", () => {
    expect(dedent(" \n\t\n")).toBe("");
  });

  test("trims trailing spaces", () => {
    expect(dedent("\ta  \n\tb")).toBe("a\nb");
  });
});
