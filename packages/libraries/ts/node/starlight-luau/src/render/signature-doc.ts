import type {
  EntryParameter,
  EntryVariadic,
  FunctionEntry,
  TypeAliasEntry,
  TypeFunctionEntry,
} from "../model/module-api.ts";
import { unreachable } from "../model/unreachable.ts";
import type { Doc } from "./doc.ts";
import { concat, group, ifBreak, indent, keepTogether, line, text } from "./doc.ts";
import type { ReferenceLinker } from "./type-doc.ts";
import { bracketed, genericsDoc, returnsDoc, tailDoc, typeDoc, unionDoc } from "./type-doc.ts";

function entryParameterDoc(parameter: EntryParameter, link: ReferenceLinker): Doc {
  const name = text(parameter.name, "parameter");
  return parameter.type === undefined ? name : concat(name, text(": "), typeDoc(parameter.type, link));
}

function variadicDocs(variadic: EntryVariadic, link: ReferenceLinker): readonly Doc[] {
  switch (variadic.kind) {
    case "none":
      return [];
    case "untyped":
      return [text("...")];
    case "typed": {
      const pack = variadic.pack;
      const annotation = pack.kind === "variadic" ? typeDoc(pack.element, link) : tailDoc(pack, link);
      return [concat(text("..."), text(": "), annotation)];
    }
    default:
      return unreachable(variadic);
  }
}

export function functionSignatureDoc(moduleName: string, entry: FunctionEntry, link: ReferenceLinker): Doc {
  const parameters = [
    ...entry.parameters.map((parameter) => entryParameterDoc(parameter, link)),
    ...variadicDocs(entry.variadic, link),
  ];
  const returns =
    entry.returns === undefined ? concat() : concat(text(": "), keepTogether(returnsDoc(entry.returns, link)));
  return concat(
    text("function", "keyword"),
    text(" "),
    text(`${moduleName}${entry.isMethod ? ":" : "."}`, "plain"),
    text(entry.name, "plain"),
    genericsDoc(entry.generics, entry.genericPacks, link),
    bracketed("(", parameters, ")"),
    returns,
  );
}

function aliasValueDoc(entry: TypeAliasEntry, link: ReferenceLinker): Doc {
  if (entry.value.kind === "union") {
    return indent(line, ifBreak("| "), unionDoc(entry.value.members, link));
  }
  return concat(text(" "), typeDoc(entry.value, link));
}

export function aliasSignatureDoc(entry: TypeAliasEntry, link: ReferenceLinker): Doc {
  return group(
    text(entry.exported ? "export type" : "type", "keyword"),
    text(" "),
    text(entry.name, "plain"),
    genericsDoc(entry.generics, entry.genericPacks, link),
    text(" ="),
    aliasValueDoc(entry, link),
  );
}

export function typeFunctionSignatureDoc(entry: TypeFunctionEntry): Doc {
  const parameters = entry.parameters.map((name) =>
    concat(text(name, "parameter"), text(": "), text("type", "builtin")),
  );
  return concat(
    text(entry.exported ? "export type function" : "type function", "keyword"),
    text(" "),
    text(entry.name, "plain"),
    bracketed("(", parameters, ")"),
    text(": "),
    text("type", "builtin"),
  );
}
