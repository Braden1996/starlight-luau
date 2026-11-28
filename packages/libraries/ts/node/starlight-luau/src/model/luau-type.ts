export type PropertyAccess = "read" | "write" | "read-write";

export interface GenericParameter {
  readonly name: string;
  readonly defaultType: LuauType | undefined;
}

export interface GenericPackParameter {
  readonly name: string;
  readonly defaultPack: TypePack | undefined;
}

export interface TypeReference {
  readonly kind: "reference";
  readonly prefix: string | undefined;
  readonly name: string;
  readonly arguments: readonly TypeArgument[];
}

export interface StringSingleton {
  readonly kind: "string-singleton";
  readonly value: string;
}

export interface BooleanSingleton {
  readonly kind: "boolean-singleton";
  readonly value: boolean;
}

export interface TableProperty {
  readonly name: string;
  readonly access: PropertyAccess;
  readonly type: LuauType;
}

export interface TableIndexer {
  readonly access: PropertyAccess;
  readonly key: LuauType;
  readonly value: LuauType;
}

export interface TableType {
  readonly kind: "table";
  readonly properties: readonly TableProperty[];
  readonly indexer: TableIndexer | undefined;
}

export interface ArrayType {
  readonly kind: "array";
  readonly element: LuauType;
}

export interface FunctionParameter {
  readonly name: string | undefined;
  readonly type: LuauType;
}

export interface FunctionType {
  readonly kind: "function";
  readonly generics: readonly GenericParameter[];
  readonly genericPacks: readonly GenericPackParameter[];
  readonly parameters: readonly FunctionParameter[];
  readonly variadic: TypePack | undefined;
  readonly returns: TypePack;
}

export interface UnionType {
  readonly kind: "union";
  readonly members: readonly LuauType[];
}

export interface IntersectionType {
  readonly kind: "intersection";
  readonly members: readonly LuauType[];
}

export interface OptionalMarker {
  readonly kind: "optional";
}

export interface TypeofType {
  readonly kind: "typeof";
  readonly expression: string;
}

export interface GroupType {
  readonly kind: "group";
  readonly inner: LuauType;
}

export type LuauType =
  | TypeReference
  | StringSingleton
  | BooleanSingleton
  | TableType
  | ArrayType
  | FunctionType
  | UnionType
  | IntersectionType
  | OptionalMarker
  | TypeofType
  | GroupType;

export interface TypeList {
  readonly kind: "list";
  readonly types: readonly LuauType[];
  readonly tail: TypePack | undefined;
}

export interface VariadicPack {
  readonly kind: "variadic";
  readonly element: LuauType;
}

export interface GenericPack {
  readonly kind: "generic-pack";
  readonly name: string;
}

export type TypePack = TypeList | VariadicPack | GenericPack;

export type TypeArgument = LuauType | TypePack;

const PACK_KINDS: ReadonlySet<string> = new Set(["list", "variadic", "generic-pack"]);

export function isTypePack(argument: TypeArgument): argument is TypePack {
  return PACK_KINDS.has(argument.kind);
}
