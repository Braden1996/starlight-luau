import type { Token } from "./lexer.ts";
import { tokenize } from "./lexer.ts";

function lastIndexEndingBy(tokens: readonly Token[], offset: number): number {
  let low = 0;
  let high = tokens.length - 1;
  let found = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const candidate = tokens[middle];
    if (candidate !== undefined && candidate.end <= offset) {
      found = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return found;
}

export class TokenIndex {
  readonly #tokens: readonly Token[];

  constructor(text: string) {
    this.#tokens = tokenize(text);
  }

  tokensBefore(offset: number, count: number): readonly Token[] {
    const last = lastIndexEndingBy(this.#tokens, offset);
    return this.#tokens.slice(Math.max(0, last - count + 1), last + 1).toReversed();
  }

  tokenBefore(offset: number): Token | undefined {
    return this.tokensBefore(offset, 1)[0];
  }
}
