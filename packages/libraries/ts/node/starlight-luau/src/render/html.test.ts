import { describe, expect, test } from "bun:test";

import { concat, group, indent, line, text } from "./doc.ts";
import { codeBlockHtml, escapeHtml } from "./html.ts";

describe("escapeHtml", () => {
  test("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;");
  });
});

describe("codeBlockHtml", () => {
  test("wraps styled tokens in spans, links in anchors and leaves plain text bare", () => {
    const doc = concat(text("type", "keyword"), text(" "), text("Box", "type", "/api/m/#type-Box"), text("<"));
    expect(codeBlockHtml(doc, 80)).toBe(
      '<pre class="sl-luau-signature"><code><span class="luau-keyword">type</span>' +
        ' <a class="luau-type" href="/api/m/#type-Box">Box</a>' +
        "&lt;</code></pre>",
    );
  });

  test("indents broken lines with spaces", () => {
    const doc = group(text("{", "plain"), indent(line, text("a", "plain")), line, text("}", "plain"));
    expect(codeBlockHtml(doc, 1)).toBe('<pre class="sl-luau-signature"><code>{\n  a\n}</code></pre>');
  });
});
