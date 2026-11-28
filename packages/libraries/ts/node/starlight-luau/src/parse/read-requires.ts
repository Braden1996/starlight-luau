import type { JsonNode } from "../ast/json-node.ts";
import { nodeArrayField, nodeField, nodeType, optionalStringField, stringField } from "../ast/json-node.ts";

function requiredPath(value: JsonNode): string | undefined {
  if (nodeType(value) !== "AstExprCall") {
    return undefined;
  }
  const callee = nodeField(value, "func");
  if (nodeType(callee) !== "AstExprGlobal" || optionalStringField(callee, "global") !== "require") {
    return undefined;
  }
  const [argument, ...rest] = nodeArrayField(value, "args");
  if (argument === undefined || rest.length > 0 || nodeType(argument) !== "AstExprConstantString") {
    return undefined;
  }
  return stringField(argument, "value");
}

function requiresOfLocal(statement: JsonNode): ReadonlyArray<readonly [string, string]> {
  const variables = nodeArrayField(statement, "vars");
  const values = nodeArrayField(statement, "values");
  return variables.flatMap((variable, index) => {
    const value = values[index];
    const path = value === undefined ? undefined : requiredPath(value);
    return path === undefined ? [] : [[stringField(variable, "name"), path] as const];
  });
}

export function readRequires(body: readonly JsonNode[]): ReadonlyMap<string, string> {
  return new Map(body.filter((statement) => nodeType(statement) === "AstStatLocal").flatMap(requiresOfLocal));
}
