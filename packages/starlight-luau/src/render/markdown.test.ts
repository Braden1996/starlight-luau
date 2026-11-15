import { describe, expect, test } from "bun:test";

import {
  anchoredHeading,
  blocks,
  codeFence,
  details,
  firstParagraph,
  frontmatter,
  heading,
  inlineCode,
  link,
  paragraph,
} from "./markdown.ts";

describe("frontmatter", () => {
  test("writes quoted strings, plain scalars and nested maps", () => {
    expect(frontmatter({ title: 'A "B"', editUrl: false, sidebar: { order: 2, label: "x" } })).toBe(
      '---\ntitle: "A \\"B\\""\neditUrl: false\nsidebar:\n  order: 2\n  label: "x"\n---',
    );
  });
});

describe("heading and anchoredHeading", () => {
  test("write Markdown headings, so the table of contents lists them", () => {
    expect(heading(2, "Types")).toBe("## Types");
  });

  test("put a stable anchor before a code-named heading", () => {
    expect(anchoredHeading(3, "type-Ok", "Ok")).toBe(
      '<a id="type-Ok" class="sl-luau-anchor"></a>\n\n### `Ok`',
    );
  });
});

describe("codeFence", () => {
  test("uses a fence longer than any backtick run in the code", () => {
    expect(codeFence("x", "luau")).toBe("```luau\nx\n```");
    expect(codeFence("a ```` b", "luau")).toBe("`````luau\na ```` b\n`````");
  });
});

describe("details, paragraph, link and inlineCode", () => {
  test("escape their text", () => {
    expect(details("a < b", "body")).toBe(
      "<details>\n<summary>a &lt; b</summary>\n\nbody\n\n</details>",
    );
    expect(paragraph("x", "note")).toBe('<p class="note">x</p>');
    expect(paragraph("x")).toBe("<p>x</p>");
    expect(link("/a?b=1&c", "x")).toBe('<a href="/a?b=1&amp;c">x</a>');
    expect(link(undefined, "x")).toBe("x");
    expect(inlineCode("Box<T>")).toBe("<code>Box&lt;T&gt;</code>");
  });
});

describe("blocks", () => {
  test("joins non-empty parts with blank lines", () => {
    expect(blocks("a", undefined, "", "b")).toBe("a\n\nb");
  });
});

describe("firstParagraph", () => {
  test("skips headings and joins wrapped lines", () => {
    expect(firstParagraph("# Title\n\nFirst line\nwraps here.\n\nSecond.")).toBe(
      "First line wraps here.",
    );
    expect(firstParagraph(undefined)).toBeUndefined();
    expect(firstParagraph("# Only a heading")).toBeUndefined();
  });
});
