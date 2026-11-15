import type { SourcePosition, SourceRange } from "./source-range.ts";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function lineStartOffsets(lines: readonly string[]): readonly number[] {
  const offsets: number[] = [];
  let offset = 0;
  for (const line of lines) {
    offsets.push(offset);
    offset += line.length + 1;
  }
  return offsets;
}

function utf16ColumnOf(line: string, byteColumn: number): number {
  return decoder.decode(encoder.encode(line).slice(0, byteColumn)).length;
}

export class SourceText {
  readonly text: string;
  readonly #lines: readonly string[];
  readonly #lineOffsets: readonly number[];

  constructor(text: string) {
    this.text = text.replaceAll("\r\n", "\n");
    this.#lines = this.text.split("\n");
    this.#lineOffsets = lineStartOffsets(this.#lines);
  }

  offsetOf(position: SourcePosition): number {
    const line = this.#lines[position.line];
    const lineOffset = this.#lineOffsets[position.line];
    if (line === undefined || lineOffset === undefined) {
      throw new Error(`line ${String(position.line)} is outside the source`);
    }
    return lineOffset + utf16ColumnOf(line, position.column);
  }

  slice(range: SourceRange): string {
    return this.text.slice(this.offsetOf(range.start), this.offsetOf(range.end));
  }
}
