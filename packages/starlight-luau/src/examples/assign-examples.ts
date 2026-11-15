import type { TestExample } from "./extract-tests.ts";

const WORD = /[A-Za-z_][A-Za-z0-9_]*/gu;

export function wordsOf(name: string): ReadonlySet<string> {
  return new Set(name.match(WORD) ?? []);
}

function namedFunctions(
  example: TestExample,
  functionNames: ReadonlySet<string>,
): readonly string[] {
  return [...wordsOf(example.name)].filter((word) => functionNames.has(word));
}

export function examplesForFunction(
  functionName: string,
  examples: readonly TestExample[],
  functionNames: ReadonlySet<string>,
): readonly TestExample[] {
  return examples.filter((example) => {
    const named = namedFunctions(example, functionNames);
    return named.length > 0 ? named.includes(functionName) : example.mentions.has(functionName);
  });
}
