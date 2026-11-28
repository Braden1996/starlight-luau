import type { JsonNode } from "../ast/json-node.ts";
import {
  AstShapeError,
  arrayField,
  asNode,
  booleanField,
  locationField,
  nodeArrayField,
  nodeField,
  nodeType,
  optionalNodeField,
  optionalStringField,
  stringField,
} from "../ast/json-node.ts";
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
  TypeList,
  TypePack,
} from "../model/luau-type.ts";
import { isEmptyRange } from "../source/source-range.ts";
import type { DecodeContext } from "./decode-context.ts";

function accessBefore(node: JsonNode, context: DecodeContext): PropertyAccess {
  const [previous] = context.wordsBefore(locationField(node), 1);
  return previous === "read" || previous === "write" ? previous : "read-write";
}

function decodeProperty(node: JsonNode, context: DecodeContext): TableProperty {
  return {
    name: stringField(node, "name"),
    access: accessBefore(node, context),
    type: decodeType(nodeField(node, "propType"), context),
  };
}

function decodeIndexer(node: JsonNode, context: DecodeContext): TableIndexer {
  return {
    access: accessBefore(node, context),
    key: decodeType(nodeField(node, "indexType"), context),
    value: decodeType(nodeField(node, "resultType"), context),
  };
}

function isArrayShorthand(indexer: JsonNode): boolean {
  return isEmptyRange(locationField(nodeField(indexer, "indexType")));
}

function decodeTable(node: JsonNode, context: DecodeContext): LuauType {
  const indexer = optionalNodeField(node, "indexer");
  const props = nodeArrayField(node, "props");
  if (indexer !== undefined && props.length === 0 && isArrayShorthand(indexer)) {
    return { kind: "array", element: decodeType(nodeField(indexer, "resultType"), context) };
  }
  return {
    kind: "table",
    properties: props.map((prop) => decodeProperty(prop, context)),
    indexer: indexer === undefined ? undefined : decodeIndexer(indexer, context),
  };
}

export function decodeGenerics(node: JsonNode, context: DecodeContext): readonly GenericParameter[] {
  return nodeArrayField(node, "generics").map((generic) => {
    const defaultNode = optionalNodeField(generic, "luauType");
    return {
      name: stringField(generic, "name"),
      defaultType: defaultNode === undefined ? undefined : decodeType(defaultNode, context),
    };
  });
}

export function decodeGenericPacks(node: JsonNode, context: DecodeContext): readonly GenericPackParameter[] {
  return nodeArrayField(node, "genericPacks").map((generic) => {
    const defaultNode = optionalNodeField(generic, "luauType");
    return {
      name: stringField(generic, "name"),
      defaultPack: defaultNode === undefined ? undefined : decodePack(defaultNode, context),
    };
  });
}

function argumentNameAt(names: readonly unknown[], index: number): string | undefined {
  const name = names[index];
  return name === undefined || name === null ? undefined : stringField(asNode(name, "argName"), "name");
}

function decodeFunctionType(node: JsonNode, context: DecodeContext): FunctionType {
  const argumentList = decodeTypeList(nodeField(node, "argTypes"), context);
  const names = arrayField(node, "argNames");
  const parameters: readonly FunctionParameter[] = argumentList.types.map((type, index) => ({
    name: argumentNameAt(names, index),
    type,
  }));
  return {
    kind: "function",
    generics: decodeGenerics(node, context),
    genericPacks: decodeGenericPacks(node, context),
    parameters,
    variadic: argumentList.tail,
    returns: decodePack(nodeField(node, "returnTypes"), context),
  };
}

export function decodeTypeList(node: JsonNode, context: DecodeContext): TypeList {
  const tail = optionalNodeField(node, "tailType");
  return {
    kind: "list",
    types: nodeArrayField(node, "types").map((type) => decodeType(type, context)),
    tail: tail === undefined ? undefined : decodePack(tail, context),
  };
}

export function decodePack(node: JsonNode, context: DecodeContext): TypePack {
  const type = nodeType(node);
  switch (type) {
    case "AstTypePackExplicit":
      return decodeTypeList(nodeField(node, "typeList"), context);
    case "AstTypePackVariadic":
      return { kind: "variadic", element: decodeType(nodeField(node, "variadicType"), context) };
    case "AstTypePackGeneric":
      return { kind: "generic-pack", name: stringField(node, "genericName") };
    default:
      throw new AstShapeError(`unsupported type pack ${type}`);
  }
}

function decodeTypeArgument(node: JsonNode, context: DecodeContext): TypeArgument {
  return nodeType(node).startsWith("AstTypePack") ? decodePack(node, context) : decodeType(node, context);
}

function decodeMembers(node: JsonNode, context: DecodeContext): readonly LuauType[] {
  return nodeArrayField(node, "types").map((member) => decodeType(member, context));
}

export function decodeType(node: JsonNode, context: DecodeContext): LuauType {
  const type = nodeType(node);
  switch (type) {
    case "AstTypeReference":
      return {
        kind: "reference",
        prefix: optionalStringField(node, "prefix"),
        name: stringField(node, "name"),
        arguments: nodeArrayField(node, "parameters").map((p) => decodeTypeArgument(p, context)),
      };
    case "AstTypeSingletonString":
      return { kind: "string-singleton", value: stringField(node, "value") };
    case "AstTypeSingletonBool":
      return { kind: "boolean-singleton", value: booleanField(node, "value") };
    case "AstTypeTable":
      return decodeTable(node, context);
    case "AstTypeFunction":
      return decodeFunctionType(node, context);
    case "AstTypeUnion":
      return { kind: "union", members: decodeMembers(node, context) };
    case "AstTypeIntersection":
      return { kind: "intersection", members: decodeMembers(node, context) };
    case "AstTypeOptional":
      return { kind: "optional" };
    case "AstTypeTypeof":
      return { kind: "typeof", expression: context.source.slice(locationField(node)) };
    case "AstTypeGroup":
      return { kind: "group", inner: decodeType(nodeField(node, "inner"), context) };
    default:
      throw new AstShapeError(`unsupported type ${type}`);
  }
}
