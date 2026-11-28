import type { JsonNode } from "../ast/json-node.ts";
import { isJsonNode, locationField, nodeArrayField, nodeField, nodeType, stringField } from "../ast/json-node.ts";
import type { DecodeContext } from "../parse/decode-context.ts";
import { dedent } from "../source/dedent.ts";

export interface TestExample {
  readonly name: string;
  readonly line: number;
  readonly code: string;
  readonly mentions: ReadonlySet<string>;
}

export interface TestConventions {
  readonly moduleName: string;
  readonly testFunctions: ReadonlySet<string>;
}

function* nodesWithin(value: unknown): Generator<JsonNode> {
  if (Array.isArray(value)) {
    for (const item of value) {
      yield* nodesWithin(item);
    }
  } else if (isJsonNode(value)) {
    if (typeof value["type"] === "string") {
      yield value;
    }
    for (const child of Object.values(value)) {
      yield* nodesWithin(child);
    }
  }
}

function nameOfExpression(expression: JsonNode): string | undefined {
  switch (nodeType(expression)) {
    case "AstExprIndexName":
      return stringField(expression, "index");
    case "AstExprGlobal":
      return stringField(expression, "global");
    case "AstExprLocal":
      return stringField(nodeField(expression, "local"), "name");
    default:
      return undefined;
  }
}

function moduleMember(expression: JsonNode, moduleName: string): string | undefined {
  if (nodeType(expression) !== "AstExprIndexName") {
    return undefined;
  }
  const target = nodeField(expression, "expr");
  const kind = nodeType(target);
  const isModule = (kind === "AstExprLocal" || kind === "AstExprGlobal") && nameOfExpression(target) === moduleName;
  return isModule ? stringField(expression, "index") : undefined;
}

function mentionsIn(body: JsonNode, moduleName: string): ReadonlySet<string> {
  const mentions = new Set<string>();
  for (const node of nodesWithin(body)) {
    const member = moduleMember(node, moduleName);
    if (member !== undefined) {
      mentions.add(member);
    }
  }
  return mentions;
}

function asTest(call: JsonNode, context: DecodeContext, conventions: TestConventions): TestExample | undefined {
  const callee = nameOfExpression(nodeField(call, "func"));
  if (callee === undefined || !conventions.testFunctions.has(callee)) {
    return undefined;
  }
  const [name, body, ...rest] = nodeArrayField(call, "args");
  if (name === undefined || body === undefined || rest.length > 0) {
    return undefined;
  }
  if (nodeType(name) !== "AstExprConstantString" || nodeType(body) !== "AstExprFunction") {
    return undefined;
  }
  const block = nodeField(body, "body");
  return {
    name: stringField(name, "value"),
    line: locationField(call).start.line + 1,
    code: dedent(context.source.slice(locationField(block))),
    mentions: mentionsIn(block, conventions.moduleName),
  };
}

export function extractTests(
  root: JsonNode,
  context: DecodeContext,
  conventions: TestConventions,
): readonly TestExample[] {
  return [...nodesWithin(root)]
    .filter((node) => nodeType(node) === "AstExprCall")
    .flatMap((call) => asTest(call, context, conventions) ?? []);
}
