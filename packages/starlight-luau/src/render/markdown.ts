import { escapeHtml } from "./html.ts";

export type FrontmatterValue =
  | string
  | number
  | boolean
  | { readonly [key: string]: FrontmatterValue };

function yamlLines(key: string, value: FrontmatterValue, depth: number): readonly string[] {
  const prefix = `${"  ".repeat(depth)}${key}:`;
  if (typeof value === "object") {
    return [
      prefix,
      ...Object.entries(value).flatMap(([child, nested]) => yamlLines(child, nested, depth + 1)),
    ];
  }
  return [`${prefix} ${typeof value === "string" ? JSON.stringify(value) : String(value)}`];
}

export function frontmatter(fields: Readonly<Record<string, FrontmatterValue>>): string {
  const lines = Object.entries(fields).flatMap(([key, value]) => yamlLines(key, value, 0));
  return ["---", ...lines, "---"].join("\n");
}

export function heading(level: 2 | 3 | 4, title: string): string {
  return `${"#".repeat(level)} ${title}`;
}

export function anchoredHeading(level: 2 | 3 | 4, id: string, name: string): string {
  const anchor = `<a id="${escapeHtml(id)}" class="sl-luau-anchor"></a>`;
  return `${anchor}\n\n${heading(level, `\`${name}\``)}`;
}

function longestBacktickRun(code: string): number {
  return Math.max(0, ...(code.match(/`+/gu) ?? []).map((run) => run.length));
}

export function codeFence(code: string, language: string): string {
  const fence = "`".repeat(Math.max(3, longestBacktickRun(code) + 1));
  return `${fence}${language}\n${code}\n${fence}`;
}

export function details(summary: string, body: string): string {
  return `<details>\n<summary>${escapeHtml(summary)}</summary>\n\n${body}\n\n</details>`;
}

export function paragraph(html: string, className?: string): string {
  return className === undefined ? `<p>${html}</p>` : `<p class="${className}">${html}</p>`;
}

export function link(href: string | undefined, html: string): string {
  return href === undefined ? html : `<a href="${escapeHtml(href)}">${html}</a>`;
}

export function inlineCode(text: string): string {
  return `<code>${escapeHtml(text)}</code>`;
}

export function blocks(...parts: ReadonlyArray<string | undefined>): string {
  return parts.filter((part) => part !== undefined && part !== "").join("\n\n");
}

export function firstParagraph(markdown: string | undefined): string | undefined {
  const found = markdown
    ?.split(/\n\s*\n/u)
    .map((part) => part.trim())
    .find((part) => part !== "" && !part.startsWith("#"));
  return found?.replaceAll(/\s*\n\s*/gu, " ");
}
