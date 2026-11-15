export interface SourcePosition {
  readonly line: number;
  readonly column: number;
}

export interface SourceRange {
  readonly start: SourcePosition;
  readonly end: SourcePosition;
}

function malformed(text: string): Error {
  return new Error(`malformed luau-ast location "${text}"`);
}

function parsePosition(text: string, original: string): SourcePosition {
  const parts = text.trim().split(",");
  if (parts.length !== 2 || parts.some((part) => !/^\d+$/u.test(part))) {
    throw malformed(original);
  }
  return { line: Number(parts[0]), column: Number(parts[1]) };
}

export function parseSourceRange(text: string): SourceRange {
  const [start, end, ...rest] = text.split(" - ");
  if (start === undefined || end === undefined || rest.length > 0) {
    throw malformed(text);
  }
  return { start: parsePosition(start, text), end: parsePosition(end, text) };
}

export function isEmptyRange(range: SourceRange): boolean {
  return range.start.line === range.end.line && range.start.column === range.end.column;
}
