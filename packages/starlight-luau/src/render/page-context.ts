import type { ApiIndex } from "../link/api-index.ts";
import type { Doc } from "./doc.ts";
import { escapeHtml, tokenHtml } from "./html.ts";
import { layout } from "./layout.ts";
import { link, paragraph } from "./markdown.ts";
import type { Routes } from "./routes.ts";

export type SourceLink = (file: string, line: number) => string;

export interface PageContext {
  readonly index: ApiIndex;
  readonly routes: Routes;
  readonly printWidth: number;
  readonly sourceLink: SourceLink | undefined;
}

export function inlineHtml(doc: Doc): string {
  const tokens = layout(doc, Number.POSITIVE_INFINITY).flatMap((laidOut) => laidOut.tokens);
  return `<code class="sl-luau-inline">${tokens.map(tokenHtml).join("")}</code>`;
}

export function sourceParagraph(
  context: PageContext,
  file: string,
  line: number,
): string | undefined {
  if (context.sourceLink === undefined) {
    return undefined;
  }
  const label = `Source: ${escapeHtml(file)}, line ${String(line)}`;
  return paragraph(link(context.sourceLink(file, line), label), "sl-luau-source");
}
