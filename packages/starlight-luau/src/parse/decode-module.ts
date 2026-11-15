import type { JsonNode } from "../ast/json-node.ts";
import {
  AstShapeError,
  booleanField,
  locationField,
  nodeArrayField,
  nodeField,
  nodeType,
  optionalNodeField,
  stringField,
} from "../ast/json-node.ts";
import type {
  EntryParameter,
  EntryVariadic,
  FunctionEntry,
  ModuleApi,
  TypeAliasEntry,
  TypeEntry,
  TypeFunctionEntry,
} from "../model/module-api.ts";
import type { DecodeContext } from "./decode-context.ts";
import { decodeGenericPacks, decodeGenerics, decodePack, decodeType } from "./decode-type.ts";
import { readRequires } from "./read-requires.ts";

export interface ModuleSource {
  readonly name: string;
  readonly file: string;
  readonly root: JsonNode;
  readonly context: DecodeContext;
}

function lineOf(node: JsonNode): number {
  return locationField(node).start.line + 1;
}

function returnedLocalLocation(body: readonly JsonNode[]): string | undefined {
  const last = body.at(-1);
  if (last === undefined || nodeType(last) !== "AstStatReturn") {
    return undefined;
  }
  const [value, ...rest] = nodeArrayField(last, "list");
  if (value === undefined || rest.length > 0 || nodeType(value) !== "AstExprLocal") {
    return undefined;
  }
  return stringField(nodeField(value, "local"), "location");
}

function decodeAlias(statement: JsonNode, context: DecodeContext): TypeAliasEntry {
  return {
    kind: "alias",
    name: stringField(statement, "name"),
    exported: booleanField(statement, "exported"),
    line: lineOf(statement),
    generics: decodeGenerics(statement, context),
    genericPacks: decodeGenericPacks(statement, context),
    value: decodeType(nodeField(statement, "value"), context),
  };
}

function isTypeFunctionExported(statement: JsonNode, context: DecodeContext): boolean {
  const [previous, beforePrevious] = context.wordsBefore(locationField(statement), 2);
  if (previous !== "type") {
    throw new AstShapeError(`a function statement at line ${String(lineOf(statement))}`);
  }
  return beforePrevious === "export";
}

function decodeTypeFunction(statement: JsonNode, context: DecodeContext): TypeFunctionEntry {
  const exported = isTypeFunctionExported(statement, context);
  const declaration = context.source.slice(locationField(statement));
  return {
    kind: "type-function",
    name: stringField(statement, "debugname"),
    exported,
    line: lineOf(statement),
    parameters: nodeArrayField(statement, "args").map((arg) => stringField(arg, "name")),
    implementation: `${exported ? "export " : ""}type ${declaration}`,
  };
}

function decodeParameter(arg: JsonNode, context: DecodeContext): EntryParameter {
  const annotation = optionalNodeField(arg, "luauType");
  return {
    name: stringField(arg, "name"),
    type: annotation === undefined ? undefined : decodeType(annotation, context),
  };
}

function decodeVariadic(func: JsonNode, context: DecodeContext): EntryVariadic {
  if (!booleanField(func, "vararg")) {
    return { kind: "none" };
  }
  const annotation = optionalNodeField(func, "varargAnnotation");
  return annotation === undefined
    ? { kind: "untyped" }
    : { kind: "typed", pack: decodePack(annotation, context) };
}

function decodeFunction(statement: JsonNode, context: DecodeContext): FunctionEntry {
  const name = nodeField(statement, "name");
  const func = nodeField(statement, "func");
  const returns = optionalNodeField(func, "returnAnnotation");
  return {
    kind: "function",
    name: stringField(name, "index"),
    isMethod: stringField(name, "op") === ":",
    line: lineOf(statement),
    generics: decodeGenerics(func, context),
    genericPacks: decodeGenericPacks(func, context),
    parameters: nodeArrayField(func, "args").map((arg) => decodeParameter(arg, context)),
    variadic: decodeVariadic(func, context),
    returns: returns === undefined ? undefined : decodePack(returns, context),
  };
}

function isModuleFunction(statement: JsonNode, moduleLocation: string | undefined): boolean {
  const name = nodeField(statement, "name");
  if (moduleLocation === undefined || nodeType(name) !== "AstExprIndexName") {
    return false;
  }
  const target = nodeField(name, "expr");
  return (
    nodeType(target) === "AstExprLocal" &&
    stringField(nodeField(target, "local"), "location") === moduleLocation
  );
}

export function decodeModule(module: ModuleSource): ModuleApi {
  const body = nodeArrayField(module.root, "body");
  const moduleLocation = returnedLocalLocation(body);
  const functions: FunctionEntry[] = [];
  const types: TypeEntry[] = [];
  for (const statement of body) {
    const type = nodeType(statement);
    if (type === "AstStatTypeAlias") {
      types.push(decodeAlias(statement, module.context));
    } else if (type === "AstExprFunction") {
      types.push(decodeTypeFunction(statement, module.context));
    } else if (type === "AstStatFunction" && isModuleFunction(statement, moduleLocation)) {
      functions.push(decodeFunction(statement, module.context));
    }
  }
  return {
    name: module.name,
    file: module.file,
    functions,
    types,
    requires: readRequires(body),
  };
}
