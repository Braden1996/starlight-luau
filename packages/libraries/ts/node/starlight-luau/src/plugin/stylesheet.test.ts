import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const STYLESHEET = join(dirname(fileURLToPath(import.meta.url)), "..", "styles", "luau.css");

describe("luau.css", () => {
  const css = readFileSync(STYLESHEET, "utf8");

  test("orders its layer after Starlight's, so a theme or site stylesheet can override every rule", () => {
    expect(css).toStartWith("@layer starlight, starlight-luau;");
  });

  test("keeps every rule inside the starlight-luau layer", () => {
    const afterOrder = css.slice(css.indexOf(";") + 1).trimStart();
    expect(afterOrder).toStartWith("@layer starlight-luau {");
    expect(afterOrder.trimEnd()).toEndWith("}");
  });
});
