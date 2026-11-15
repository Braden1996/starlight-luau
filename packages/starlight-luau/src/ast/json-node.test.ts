import { describe, expect, test } from "bun:test";

import {
  arrayField,
  asNode,
  booleanField,
  isJsonNode,
  locationField,
  nodeArrayField,
  nodeType,
  optionalNodeField,
  optionalStringField,
  stringField,
} from "./json-node.ts";

const node = asNode(
  {
    type: "AstTypeReference",
    location: "1,2 - 1,8",
    name: "number",
    prefix: null,
    exported: true,
    parameters: [{ type: "AstTypeOptional" }],
    indexer: null,
  },
  "root",
);

describe("json-node readers", () => {
  test("recognise objects but not arrays or null", () => {
    expect(isJsonNode({})).toBe(true);
    expect(isJsonNode([])).toBe(false);
    expect(isJsonNode(null)).toBe(false);
  });

  test("read typed fields", () => {
    expect(nodeType(node)).toBe("AstTypeReference");
    expect(stringField(node, "name")).toBe("number");
    expect(booleanField(node, "exported")).toBe(true);
    expect(arrayField(node, "parameters")).toHaveLength(1);
    expect(nodeArrayField(node, "parameters").map(nodeType)).toEqual(["AstTypeOptional"]);
    expect(locationField(node).start).toEqual({ line: 1, column: 2 });
  });

  test("treat null and missing optional fields as undefined", () => {
    expect(optionalStringField(node, "prefix")).toBeUndefined();
    expect(optionalStringField(node, "absent")).toBeUndefined();
    expect(optionalNodeField(node, "indexer")).toBeUndefined();
  });

  test("name the field when the shape is wrong", () => {
    expect(() => stringField(node, "exported")).toThrow('"exported" is not a string');
    expect(() => booleanField(node, "name")).toThrow('"name" is not a boolean');
    expect(() => arrayField(node, "name")).toThrow('"name" is not an array');
    expect(() => asNode([], "root")).toThrow("root is not an object");
  });
});
