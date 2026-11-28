import type { EntryResolution, GenericReaders } from "../analyze/type-function-readers.ts";
import { typeFunctionReaders } from "../analyze/type-function-readers.ts";
import { examplesForFunction } from "../examples/assign-examples.ts";
import type { TestExample } from "../examples/extract-tests.ts";
import { scopeOfFunction } from "../link/api-index.ts";
import type { FunctionEntry, ModuleApi } from "../model/module-api.ts";
import { statusOf } from "../status/api-status.ts";
import { codeBlockHtml } from "./html.ts";
import { createLinker } from "./linker.ts";
import { anchoredHeading, blocks, codeFence, details, heading, inlineCode, link, paragraph } from "./markdown.ts";
import type { PageContext } from "./page-context.ts";
import { sourceParagraph } from "./page-context.ts";
import { entryAnchor } from "./routes.ts";
import { functionSignatureDoc } from "./signature-doc.ts";
import { statusLine } from "./status-badge.ts";

function functionNamesOf(module: ModuleApi): ReadonlySet<string> {
  return new Set(module.functions.map((entry) => entry.name));
}

export function displayName(module: Pick<ModuleApi, "name">): string {
  return module.name.split("/").at(-1) ?? module.name;
}

function listInWords(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join("");
  }
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1) ?? ""}`;
}

function readerLink(reader: EntryResolution, context: PageContext): string {
  return link(context.routes.entryHref(reader.module, reader.entry), inlineCode(reader.entry.name));
}

function readersNote(readers: readonly GenericReaders[], context: PageContext): string | undefined {
  if (readers.length === 0) {
    return undefined;
  }
  const sentences = readers.map(
    ({ generic, readers: entries }) =>
      `${inlineCode(generic)} is inferred as a whole type and read through ${listInWords(entries.map((entry) => readerLink(entry, context)))}.`,
  );
  return paragraph(sentences.join(" "), "sl-luau-generics");
}

function examplesBlock(examples: readonly TestExample[]): string | undefined {
  if (examples.length === 0) {
    return undefined;
  }
  return blocks(
    heading(4, "Examples"),
    ...examples.map((example) => details(example.name, codeFence(example.code, "luau"))),
  );
}

export function functionSection(
  module: ModuleApi,
  entry: FunctionEntry,
  prose: string | undefined,
  examples: readonly TestExample[],
  context: PageContext,
): string {
  const linker = createLinker(context.index, context.routes, scopeOfFunction(module, entry));
  return blocks(
    anchoredHeading(3, entryAnchor(entry), entry.name),
    context.status === undefined ? undefined : statusLine(statusOf(context.status, module, entry.name)),
    codeBlockHtml(functionSignatureDoc(displayName(module), entry, linker), context.printWidth),
    readersNote(typeFunctionReaders(module, entry, context.index), context),
    prose,
    examplesBlock(examplesForFunction(entry.name, examples, functionNamesOf(module))),
    sourceParagraph(context, module.file, entry.line),
  );
}
