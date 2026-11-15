import type { Resolution } from "../link/api-index.ts";
import { ApiIndex, scopeOfFunction, scopeOfType } from "../link/api-index.ts";
import type { TypeReference } from "../model/luau-type.ts";
import type { FunctionEntry, ModuleApi, TypeEntry } from "../model/module-api.ts";
import { referencesIn, typesOfFunction } from "../model/walk-types.ts";

export interface EntryResolution {
  readonly module: ModuleApi;
  readonly entry: TypeEntry;
}

export interface GenericReaders {
  readonly generic: string;
  readonly readers: readonly EntryResolution[];
}

function isComputedByTypeFunction(target: EntryResolution, index: ApiIndex): boolean {
  if (target.entry.kind === "type-function") {
    return true;
  }
  const value = target.entry.value;
  if (value.kind !== "reference") {
    return false;
  }
  const inner = index.resolve(value, scopeOfType(target.module, target.entry));
  return inner.kind === "entry" && inner.entry.kind === "type-function";
}

function readsGeneric(reference: TypeReference, generic: string): boolean {
  return reference.arguments.some(
    (argument) =>
      argument.kind === "reference" && argument.prefix === undefined && argument.name === generic,
  );
}

function asEntry(resolution: Resolution): EntryResolution | undefined {
  return resolution.kind === "entry"
    ? { module: resolution.module, entry: resolution.entry }
    : undefined;
}

function uniqueEntries(entries: readonly EntryResolution[]): readonly EntryResolution[] {
  return entries.filter(
    (entry, position) => entries.findIndex((other) => other.entry === entry.entry) === position,
  );
}

export function typeFunctionReaders(
  module: ModuleApi,
  entry: FunctionEntry,
  index: ApiIndex,
): readonly GenericReaders[] {
  const scope = scopeOfFunction(module, entry);
  const references = referencesIn(typesOfFunction(entry));
  return entry.generics.flatMap(({ name }) => {
    const readers = references
      .filter((reference) => readsGeneric(reference, name))
      .flatMap((reference) => asEntry(index.resolve(reference, scope)) ?? [])
      .filter((target) => isComputedByTypeFunction(target, index));
    return readers.length === 0 ? [] : [{ generic: name, readers: uniqueEntries(readers) }];
  });
}
