import type { TestExample } from "../examples/extract-tests.ts";
import type { ModuleApi } from "../model/module-api.ts";
import type { ModuleProse } from "../prose/load-prose.ts";
import { displayName, functionSection } from "./function-section.ts";
import { blocks, firstParagraph, frontmatter, heading } from "./markdown.ts";
import type { PageContext } from "./page-context.ts";
import { typeSection } from "./type-section.ts";

export interface ModulePageInput {
  readonly module: ModuleApi;
  readonly prose: ModuleProse;
  readonly examples: readonly TestExample[];
  readonly order: number;
}

export function moduleDescription(input: ModulePageInput): string {
  return firstParagraph(input.prose.module) ?? `API reference for the ${displayName(input.module)} module.`;
}

function typesBlock(input: ModulePageInput, context: PageContext): string | undefined {
  const types = context.index.documentedTypes(input.module);
  if (types.length === 0) {
    return undefined;
  }
  return blocks(
    heading(2, "Types"),
    ...types.map((entry) => typeSection(input.module, entry, input.prose.types.get(entry.name), context)),
  );
}

function functionsBlock(input: ModulePageInput, context: PageContext): string | undefined {
  const { functions } = input.module;
  if (functions.length === 0) {
    return undefined;
  }
  return blocks(
    heading(2, "Functions"),
    ...functions.map((entry) =>
      functionSection(input.module, entry, input.prose.functions.get(entry.name), input.examples, context),
    ),
  );
}

export function renderModulePage(input: ModulePageInput, context: PageContext): string {
  const header = frontmatter({
    title: displayName(input.module),
    description: moduleDescription(input),
    editUrl: false,
    sidebar: { order: input.order },
  });
  return `${blocks(header, input.prose.module, typesBlock(input, context), functionsBlock(input, context))}\n`;
}
