import { displayName } from "./function-section.ts";
import { escapeHtml } from "./html.ts";
import { blocks, frontmatter, link } from "./markdown.ts";
import type { ModulePageInput } from "./module-page.ts";
import { moduleDescription } from "./module-page.ts";
import type { PageContext } from "./page-context.ts";

function countLabel(count: number, noun: string): string {
  return `${String(count)} ${noun}${count === 1 ? "" : "s"}`;
}

function moduleRow(input: ModulePageInput, context: PageContext): string {
  const name = link(
    context.routes.modulePage(input.module),
    `<code>${escapeHtml(displayName(input.module))}</code>`,
  );
  const counts = [
    countLabel(input.module.functions.length, "function"),
    countLabel(context.index.documentedTypes(input.module).length, "type"),
  ].join(", ");
  return `<tr><td>${name}</td><td>${counts}</td><td>${escapeHtml(moduleDescription(input))}</td></tr>`;
}

export function renderIndexPage(
  title: string,
  inputs: readonly ModulePageInput[],
  context: PageContext,
): string {
  const header = frontmatter({
    title,
    description: `The ${String(inputs.length)} documented Luau modules.`,
    editUrl: false,
    sidebar: { order: 0, label: "Overview" },
  });
  const table = [
    '<table class="sl-luau-modules">',
    "<thead><tr><th>Module</th><th>Contents</th><th>Summary</th></tr></thead>",
    `<tbody>${inputs.map((input) => moduleRow(input, context)).join("")}</tbody>`,
    "</table>",
  ].join("\n");
  return `${blocks(header, table)}\n`;
}
