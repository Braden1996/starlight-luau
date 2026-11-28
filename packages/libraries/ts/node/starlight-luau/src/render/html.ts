import type { Doc, StyledToken } from "./doc.ts";
import type { LaidOutLine } from "./layout.ts";
import { INDENT_WIDTH, layout } from "./layout.ts";

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function tokenHtml(token: StyledToken): string {
  const content = escapeHtml(token.text);
  if (token.style === "plain") {
    return content;
  }
  const className = `luau-${token.style}`;
  return token.href === undefined
    ? `<span class="${className}">${content}</span>`
    : `<a class="${className}" href="${escapeHtml(token.href)}">${content}</a>`;
}

function lineHtml(laidOut: LaidOutLine): string {
  return " ".repeat(laidOut.depth * INDENT_WIDTH) + laidOut.tokens.map(tokenHtml).join("");
}

export function codeBlockHtml(doc: Doc, width: number): string {
  const body = layout(doc, width).map(lineHtml).join("\n");
  return `<pre class="sl-luau-signature"><code>${body}</code></pre>`;
}
