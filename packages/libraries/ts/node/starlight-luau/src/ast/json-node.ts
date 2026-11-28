import type { SourceRange } from "../source/source-range.ts";
import { parseSourceRange } from "../source/source-range.ts";

export type JsonNode = Readonly<Record<string, unknown>>;

export class AstShapeError extends Error {
  constructor(message: string) {
    super(`unexpected luau-ast output: ${message}`);
    this.name = "AstShapeError";
  }
}

export function isJsonNode(value: unknown): value is JsonNode {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function asNode(value: unknown, context: string): JsonNode {
  if (!isJsonNode(value)) {
    throw new AstShapeError(`${context} is not an object`);
  }
  return value;
}

export function nodeType(node: JsonNode): string {
  return stringField(node, "type");
}

export function stringField(node: JsonNode, key: string): string {
  const value = node[key];
  if (typeof value !== "string") {
    throw new AstShapeError(`"${key}" is not a string`);
  }
  return value;
}

export function optionalStringField(node: JsonNode, key: string): string | undefined {
  const value = node[key];
  return value === undefined || value === null ? undefined : stringField(node, key);
}

export function booleanField(node: JsonNode, key: string): boolean {
  const value = node[key];
  if (typeof value !== "boolean") {
    throw new AstShapeError(`"${key}" is not a boolean`);
  }
  return value;
}

export function arrayField(node: JsonNode, key: string): readonly unknown[] {
  const value = node[key];
  if (!Array.isArray(value)) {
    throw new AstShapeError(`"${key}" is not an array`);
  }
  return value;
}

export function nodeArrayField(node: JsonNode, key: string): readonly JsonNode[] {
  return arrayField(node, key).map((item, index) => asNode(item, `${key}[${String(index)}]`));
}

export function nodeField(node: JsonNode, key: string): JsonNode {
  return asNode(node[key], `"${key}"`);
}

export function optionalNodeField(node: JsonNode, key: string): JsonNode | undefined {
  const value = node[key];
  return value === undefined || value === null ? undefined : asNode(value, `"${key}"`);
}

export function locationField(node: JsonNode, key = "location"): SourceRange {
  return parseSourceRange(stringField(node, key));
}
