import type {
  FunctionParameter,
  FunctionType,
  GenericPackParameter,
  GenericParameter,
  LuauType,
  PropertyAccess,
  TableIndexer,
  TableProperty,
  TypeArgument,
  TypePack,
  TypeReference,
} from "../model/luau-type.ts";
import { isTypePack } from "../model/luau-type.ts";
import { unreachable } from "../model/unreachable.ts";
import type { Doc, TokenStyle } from "./doc.ts";
import { concat, group, ifBreak, indent, join, line, softline, text } from "./doc.ts";

export interface LinkTarget {
  readonly style: TokenStyle;
  readonly href: string | undefined;
}

export type ReferenceLinker = (reference: TypeReference) => LinkTarget;

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/u;

const comma: readonly Doc[] = [text(","), line];

export function quoteString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n")}"`;
}

export function bracketed(open: string, items: readonly Doc[], close: string): Doc {
  if (items.length === 0) {
    return text(`${open}${close}`);
  }
  return group(text(open), indent(softline, join(comma, items)), softline, text(close));
}

function accessDoc(access: PropertyAccess): Doc {
  return access === "read-write" ? concat() : text(`${access} `, "keyword");
}

function propertyNameDoc(name: string): Doc {
  return IDENTIFIER.test(name)
    ? text(name, "property")
    : concat(text("["), text(quoteString(name), "string"), text("]"));
}

function propertyDoc(property: TableProperty, link: ReferenceLinker): Doc {
  return concat(
    accessDoc(property.access),
    propertyNameDoc(property.name),
    text(": "),
    typeDoc(property.type, link),
  );
}

function indexerDoc(indexer: TableIndexer, link: ReferenceLinker): Doc {
  return concat(
    accessDoc(indexer.access),
    text("["),
    typeDoc(indexer.key, link),
    text("]: "),
    typeDoc(indexer.value, link),
  );
}

function tableDoc(
  properties: readonly TableProperty[],
  indexer: TableIndexer | undefined,
  link: ReferenceLinker,
): Doc {
  const items = [
    ...properties.map((property) => propertyDoc(property, link)),
    ...(indexer === undefined ? [] : [indexerDoc(indexer, link)]),
  ];
  if (items.length === 0) {
    return text("{}");
  }
  return group(text("{"), indent(line, join(comma, items), ifBreak(",")), line, text("}"));
}

function argumentDoc(argument: TypeArgument, link: ReferenceLinker): Doc {
  return isTypePack(argument) ? packArgumentDoc(argument, link) : typeDoc(argument, link);
}

function referenceDoc(reference: TypeReference, link: ReferenceLinker): Doc {
  const target = link(reference);
  const prefix = reference.prefix === undefined ? concat() : text(`${reference.prefix}.`, "plain");
  const name = text(reference.name, target.style, target.href);
  if (reference.arguments.length === 0) {
    return concat(prefix, name);
  }
  const argumentDocs = reference.arguments.map((argument) => argumentDoc(argument, link));
  return concat(prefix, name, bracketed("<", argumentDocs, ">"));
}

function memberDocs(members: readonly LuauType[], separator: string, link: ReferenceLinker): Doc {
  const parts = members.map((member, index) => {
    if (member.kind === "optional") {
      return text("?");
    }
    const lead = index === 0 ? concat() : concat(line, text(`${separator} `));
    return concat(lead, typeDoc(member, link));
  });
  return concat(...parts);
}

export function unionDoc(members: readonly LuauType[], link: ReferenceLinker): Doc {
  return memberDocs(members, "|", link);
}

export function genericsDoc(
  generics: readonly GenericParameter[],
  packs: readonly GenericPackParameter[],
  link: ReferenceLinker,
): Doc {
  const items = [
    ...generics.map((generic) =>
      generic.defaultType === undefined
        ? text(generic.name, "generic")
        : concat(text(generic.name, "generic"), text(" = "), typeDoc(generic.defaultType, link)),
    ),
    ...packs.map((pack) =>
      pack.defaultPack === undefined
        ? text(`${pack.name}...`, "generic")
        : concat(
            text(`${pack.name}...`, "generic"),
            text(" = "),
            packArgumentDoc(pack.defaultPack, link),
          ),
    ),
  ];
  return items.length === 0 ? concat() : bracketed("<", items, ">");
}

export function tailDoc(pack: TypePack, link: ReferenceLinker): Doc {
  switch (pack.kind) {
    case "variadic":
      return concat(text("..."), typeDoc(pack.element, link));
    case "generic-pack":
      return text(`${pack.name}...`, "generic");
    case "list":
      return packArgumentDoc(pack, link);
    default:
      return unreachable(pack);
  }
}

function listItems(pack: TypePack, link: ReferenceLinker): readonly Doc[] {
  if (pack.kind !== "list") {
    return [tailDoc(pack, link)];
  }
  const types = pack.types.map((type) => typeDoc(type, link));
  return pack.tail === undefined ? types : [...types, tailDoc(pack.tail, link)];
}

export function packArgumentDoc(pack: TypePack, link: ReferenceLinker): Doc {
  return pack.kind === "list" ? bracketed("(", listItems(pack, link), ")") : tailDoc(pack, link);
}

export function returnsDoc(pack: TypePack, link: ReferenceLinker): Doc {
  if (pack.kind === "list" && pack.tail === undefined && pack.types.length === 1) {
    const [only] = pack.types;
    if (only !== undefined && only.kind !== "function") {
      return typeDoc(only, link);
    }
  }
  return pack.kind === "list" ? bracketed("(", listItems(pack, link), ")") : tailDoc(pack, link);
}

function parameterDoc(parameter: FunctionParameter, link: ReferenceLinker): Doc {
  const type = typeDoc(parameter.type, link);
  return parameter.name === undefined
    ? type
    : concat(text(parameter.name, "parameter"), text(": "), type);
}

function functionTypeDoc(type: FunctionType, link: ReferenceLinker): Doc {
  const parameters = [
    ...type.parameters.map((parameter) => parameterDoc(parameter, link)),
    ...(type.variadic === undefined ? [] : [tailDoc(type.variadic, link)]),
  ];
  return concat(
    genericsDoc(type.generics, type.genericPacks, link),
    bracketed("(", parameters, ")"),
    text(" -> "),
    returnsDoc(type.returns, link),
  );
}

export function typeDoc(type: LuauType, link: ReferenceLinker): Doc {
  switch (type.kind) {
    case "reference":
      return referenceDoc(type, link);
    case "string-singleton":
      return text(quoteString(type.value), "string");
    case "boolean-singleton":
      return text(String(type.value), "literal");
    case "table":
      return tableDoc(type.properties, type.indexer, link);
    case "array":
      return concat(text("{ "), typeDoc(type.element, link), text(" }"));
    case "function":
      return functionTypeDoc(type, link);
    case "union":
      return group(unionDoc(type.members, link));
    case "intersection":
      return group(memberDocs(type.members, "&", link));
    case "optional":
      return text("?");
    case "typeof":
      return text(type.expression.replaceAll(/\s+/gu, " "), "plain");
    case "group":
      return concat(text("("), typeDoc(type.inner, link), text(")"));
    default:
      return unreachable(type);
  }
}
