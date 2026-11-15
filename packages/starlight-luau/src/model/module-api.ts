import type { GenericPackParameter, GenericParameter, LuauType, TypePack } from "./luau-type.ts";

export interface EntryParameter {
  readonly name: string;
  readonly type: LuauType | undefined;
}

export type EntryVariadic =
  | { readonly kind: "none" }
  | { readonly kind: "untyped" }
  | { readonly kind: "typed"; readonly pack: TypePack };

export interface FunctionEntry {
  readonly kind: "function";
  readonly name: string;
  readonly isMethod: boolean;
  readonly line: number;
  readonly generics: readonly GenericParameter[];
  readonly genericPacks: readonly GenericPackParameter[];
  readonly parameters: readonly EntryParameter[];
  readonly variadic: EntryVariadic;
  readonly returns: TypePack | undefined;
}

export interface TypeAliasEntry {
  readonly kind: "alias";
  readonly name: string;
  readonly exported: boolean;
  readonly line: number;
  readonly generics: readonly GenericParameter[];
  readonly genericPacks: readonly GenericPackParameter[];
  readonly value: LuauType;
}

export interface TypeFunctionEntry {
  readonly kind: "type-function";
  readonly name: string;
  readonly exported: boolean;
  readonly line: number;
  readonly parameters: readonly string[];
  readonly implementation: string;
}

export type TypeEntry = TypeAliasEntry | TypeFunctionEntry;

export interface ModuleApi {
  readonly name: string;
  readonly file: string;
  readonly functions: readonly FunctionEntry[];
  readonly types: readonly TypeEntry[];
  readonly requires: ReadonlyMap<string, string>;
}
