import type { SourceRange } from "../source/source-range.ts";
import { SourceText } from "../source/source-text.ts";
import { TokenIndex } from "../source/token-index.ts";

export class DecodeContext {
  readonly source: SourceText;
  readonly #tokens: TokenIndex;

  constructor(text: string) {
    this.source = new SourceText(text);
    this.#tokens = new TokenIndex(this.source.text);
  }

  wordsBefore(range: SourceRange, count: number): readonly string[] {
    const offset = this.source.offsetOf(range.start);
    return this.#tokens.tokensBefore(offset, count).map((token) => token.text);
  }
}
