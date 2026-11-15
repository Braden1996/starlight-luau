import type { Scope } from "../link/api-index.ts";
import { ApiIndex, scopeOfType } from "../link/api-index.ts";
import type { LuauType, TableType } from "../model/luau-type.ts";
import type { TypeAliasEntry } from "../model/module-api.ts";

export interface Variant {
  readonly tag: string;
  readonly member: LuauType;
  readonly scope: Scope;
}

export interface TaggedUnion {
  readonly discriminant: string;
  readonly variants: readonly Variant[];
}

interface ResolvedTable {
  readonly table: TableType;
  readonly scope: Scope;
}

const MAX_ALIAS_DEPTH = 8;

function tableOf(
  type: LuauType,
  scope: Scope,
  index: ApiIndex,
  depth: number,
): ResolvedTable | undefined {
  if (depth > MAX_ALIAS_DEPTH) {
    return undefined;
  }
  if (type.kind === "table") {
    return { table: type, scope };
  }
  if (type.kind === "group") {
    return tableOf(type.inner, scope, index, depth + 1);
  }
  if (type.kind !== "reference") {
    return undefined;
  }
  const resolution = index.resolve(type, scope);
  if (resolution.kind !== "entry" || resolution.entry.kind !== "alias") {
    return undefined;
  }
  const aliasScope = scopeOfType(resolution.module, resolution.entry);
  return tableOf(resolution.entry.value, aliasScope, index, depth + 1);
}

function tagOf(table: TableType, field: string): string | undefined {
  const property = table.properties.find((candidate) => candidate.name === field);
  return property?.type.kind === "string-singleton" ? property.type.value : undefined;
}

function hasDistinctTags(tables: readonly TableType[], field: string): boolean {
  const tags = tables.map((table) => tagOf(table, field));
  return tags.every((tag) => tag !== undefined) && new Set(tags).size === tags.length;
}

function discriminantOf(tables: readonly TableType[]): string | undefined {
  const [first] = tables;
  return first?.properties
    .map((property) => property.name)
    .find((field) => hasDistinctTags(tables, field));
}

export function taggedUnionOf(
  alias: TypeAliasEntry,
  scope: Scope,
  index: ApiIndex,
): TaggedUnion | undefined {
  if (alias.value.kind !== "union" || alias.value.members.length < 2) {
    return undefined;
  }
  const members = alias.value.members.flatMap((member) => {
    const resolved = tableOf(member, scope, index, 0);
    return resolved === undefined ? [] : [{ member, table: resolved.table }];
  });
  if (members.length !== alias.value.members.length) {
    return undefined;
  }
  const discriminant = discriminantOf(members.map((member) => member.table));
  if (discriminant === undefined) {
    return undefined;
  }
  return {
    discriminant,
    variants: members.map(({ member, table }) => ({
      tag: tagOf(table, discriminant) ?? "",
      member,
      scope,
    })),
  };
}
