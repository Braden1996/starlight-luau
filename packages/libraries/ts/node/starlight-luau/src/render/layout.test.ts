import { describe, expect, test } from "bun:test";

import type { Doc } from "./doc.ts";
import { concat, group, ifBreak, indent, join, line, softline, text } from "./doc.ts";
import { layout, layoutAsText } from "./layout.ts";

function list(items: readonly string[]): Doc {
  return group(
    text("{"),
    indent(
      line,
      join(
        [text(","), line],
        items.map((item) => text(item)),
      ),
      ifBreak(","),
    ),
    line,
    text("}"),
  );
}

describe("layout", () => {
  test("keeps a group flat when it fits", () => {
    expect(layoutAsText(list(["a", "b"]), 20)).toBe("{ a, b }");
  });

  test("breaks a group that does not fit, indenting and adding the if-break text", () => {
    expect(layoutAsText(list(["alpha", "beta"]), 10)).toBe("{\n  alpha,\n  beta,\n}");
  });

  test("counts the text after a group when deciding whether it fits", () => {
    const doc = concat(group(text("("), indent(softline, text("abc")), softline, text(")")), text(": long"));
    expect(layoutAsText(doc, 8)).toBe("(\n  abc\n): long");
    expect(layoutAsText(doc, 11)).toBe("(abc): long");
  });

  test("breaks outer groups before inner ones", () => {
    const doc = list(["x", "y"]);
    const outer = group(text("f("), indent(softline, doc, text(","), line, text("zzzzzz")), softline, text(")"));
    expect(layoutAsText(outer, 14)).toBe("f(\n  { x, y },\n  zzzzzz\n)");
  });

  test("keeps token styles and links, and records the indent depth per line", () => {
    const lines = layout(group(text("a", "type", "/x"), indent(line, text("b", "keyword"))), 1);
    expect(lines).toEqual([
      { depth: 0, tokens: [{ text: "a", style: "type", href: "/x" }] },
      { depth: 1, tokens: [{ text: "b", style: "keyword", href: undefined }] },
    ]);
  });

  test("join puts the separator between items only", () => {
    expect(layoutAsText(join([text(" | ")], [text("A"), text("B"), text("C")]), 80)).toBe("A | B | C");
    expect(layoutAsText(join([text(",")], []), 80)).toBe("");
  });
});
