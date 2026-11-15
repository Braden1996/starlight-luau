import type { LuauType, TypeArgument, TypePack, TypeReference } from "./luau-type.ts";
import { isTypePack } from "./luau-type.ts";
import type { FunctionEntry, TypeEntry } from "./module-api.ts";
import { unreachable } from "./unreachable.ts";

function childrenOfPack(pack: TypePack): readonly TypeArgument[] {
  switch (pack.kind) {
    case "list":
      return pack.tail === undefined ? pack.types : [...pack.types, pack.tail];
    case "variadic":
      return [pack.element];
    case "generic-pack":
      return [];
    default:
      return unreachable(pack);
  }
}

function childrenOfType(type: LuauType): readonly TypeArgument[] {
  switch (type.kind) {
    case "reference":
      return type.arguments;
    case "table":
      return [
        ...type.properties.map((property) => property.type),
        ...(type.indexer === undefined ? [] : [type.indexer.key, type.indexer.value]),
      ];
    case "array":
      return [type.element];
    case "function":
      return [
        ...type.generics.flatMap((generic) => generic.defaultType ?? []),
        ...type.parameters.map((parameter) => parameter.type),
        ...(type.variadic === undefined ? [] : [type.variadic]),
        type.returns,
      ];
    case "union":
    case "intersection":
      return type.members;
    case "group":
      return [type.inner];
    case "string-singleton":
    case "boolean-singleton":
    case "optional":
    case "typeof":
      return [];
    default:
      return unreachable(type);
  }
}

function childrenOf(argument: TypeArgument): readonly TypeArgument[] {
  return isTypePack(argument) ? childrenOfPack(argument) : childrenOfType(argument);
}

export function referencesIn(roots: readonly TypeArgument[]): readonly TypeReference[] {
  const found: TypeReference[] = [];
  const pending = roots.toReversed();
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    if (next.kind === "reference") {
      found.push(next);
    }
    pending.push(...childrenOf(next).toReversed());
  }
  return found;
}

export function typesOfFunction(entry: FunctionEntry): readonly TypeArgument[] {
  return [
    ...entry.generics.flatMap((generic) => generic.defaultType ?? []),
    ...entry.parameters.flatMap((parameter) => parameter.type ?? []),
    ...(entry.variadic.kind === "typed" ? [entry.variadic.pack] : []),
    ...(entry.returns === undefined ? [] : [entry.returns]),
  ];
}

export function typesOfEntry(entry: TypeEntry): readonly TypeArgument[] {
  if (entry.kind === "type-function") {
    return [];
  }
  return [
    ...entry.generics.flatMap((generic) => generic.defaultType ?? []),
    ...entry.genericPacks.flatMap((generic) => generic.defaultPack ?? []),
    entry.value,
  ];
}
