import type { TaggedUnion } from "../analyze/tagged-union.ts";
import { taggedUnionOf } from "../analyze/tagged-union.ts";
import { scopeOfType } from "../link/api-index.ts";
import type {
  ModuleApi,
  TypeAliasEntry,
  TypeEntry,
  TypeFunctionEntry,
} from "../model/module-api.ts";
import { dedent } from "../source/dedent.ts";
import { escapeHtml } from "./html.ts";
import { codeBlockHtml } from "./html.ts";
import { createLinker } from "./linker.ts";
import {
  anchoredHeading,
  blocks,
  codeFence,
  details,
  inlineCode,
  link,
  paragraph,
} from "./markdown.ts";
import type { PageContext } from "./page-context.ts";
import { inlineHtml, sourceParagraph } from "./page-context.ts";
import { entryAnchor } from "./routes.ts";
import { aliasSignatureDoc, typeFunctionSignatureDoc } from "./signature-doc.ts";
import type { ReferenceLinker } from "./type-doc.ts";
import { quoteString, typeDoc } from "./type-doc.ts";

function variantRow(tag: string, memberHtml: string): string {
  return `<tr><td><code class="sl-luau-inline"><span class="luau-string">${escapeHtml(quoteString(tag))}</span></code></td><td>${memberHtml}</td></tr>`;
}

function variantsTable(union: TaggedUnion, linker: ReferenceLinker): string {
  const rows = union.variants.map((variant) =>
    variantRow(variant.tag, inlineHtml(typeDoc(variant.member, linker))),
  );
  return [
    '<table class="sl-luau-variants">',
    `<thead><tr><th>${inlineCode(union.discriminant)}</th><th>Variant</th></tr></thead>`,
    `<tbody>${rows.join("")}</tbody>`,
    "</table>",
  ].join("\n");
}

function computedByNote(
  module: ModuleApi,
  entry: TypeAliasEntry,
  context: PageContext,
): string | undefined {
  if (entry.value.kind !== "reference") {
    return undefined;
  }
  const resolution = context.index.resolve(entry.value, scopeOfType(module, entry));
  if (resolution.kind !== "entry" || resolution.entry.kind !== "type-function") {
    return undefined;
  }
  const href = context.routes.entryHref(resolution.module, resolution.entry);
  return paragraph(
    `Computed by the type function ${link(href, inlineCode(resolution.entry.name))}.`,
  );
}

function internalNote(entry: TypeEntry): string | undefined {
  return entry.exported
    ? undefined
    : paragraph("Not exported. It is listed because the public API refers to it.", "sl-luau-note");
}

function aliasBody(
  module: ModuleApi,
  entry: TypeAliasEntry,
  context: PageContext,
): readonly (string | undefined)[] {
  const linker = createLinker(context.index, context.routes, scopeOfType(module, entry));
  const union = taggedUnionOf(entry, scopeOfType(module, entry), context.index);
  return [
    codeBlockHtml(aliasSignatureDoc(entry, linker), context.printWidth),
    union === undefined ? undefined : variantsTable(union, linker),
    computedByNote(module, entry, context),
  ];
}

function typeFunctionBody(entry: TypeFunctionEntry, context: PageContext): readonly string[] {
  return [
    codeBlockHtml(typeFunctionSignatureDoc(entry), context.printWidth),
    details("Implementation", codeFence(dedent(entry.implementation), "luau")),
  ];
}

export function typeSection(
  module: ModuleApi,
  entry: TypeEntry,
  prose: string | undefined,
  context: PageContext,
): string {
  const body =
    entry.kind === "alias" ? aliasBody(module, entry, context) : typeFunctionBody(entry, context);
  return blocks(
    anchoredHeading(3, entryAnchor(entry), entry.name),
    ...body,
    internalNote(entry),
    prose,
    sourceParagraph(context, module.file, entry.line),
  );
}
