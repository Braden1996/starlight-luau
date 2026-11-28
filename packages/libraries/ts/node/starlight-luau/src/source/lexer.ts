export type TokenKind = "name" | "number" | "string" | "symbol";

export interface Token {
  readonly kind: TokenKind;
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

const MULTI_CHARACTER_SYMBOLS = [
  "...",
  "//=",
  "..=",
  "..",
  "::",
  "->",
  "==",
  "~=",
  "<=",
  ">=",
  "+=",
  "-=",
  "*=",
  "/=",
  "%=",
  "^=",
  "//",
] as const;

const NAME_START = /[A-Za-z_]/u;
const NAME_PART = /[A-Za-z0-9_]/u;
const DIGIT = /[0-9]/u;
const NUMBER_PART = /[0-9A-Za-z_.]/u;
const WHITESPACE = /\s/u;

function longBracketLevel(text: string, start: number): number | undefined {
  if (text[start] !== "[") {
    return undefined;
  }
  let index = start + 1;
  while (text[index] === "=") {
    index += 1;
  }
  return text[index] === "[" ? index - start - 1 : undefined;
}

function endOfLongBracket(text: string, start: number, level: number): number {
  const closing = `]${"=".repeat(level)}]`;
  const found = text.indexOf(closing, start + level + 2);
  return found === -1 ? text.length : found + closing.length;
}

function endOfComment(text: string, start: number): number {
  const level = longBracketLevel(text, start + 2);
  if (level !== undefined) {
    return endOfLongBracket(text, start + 2, level);
  }
  const newline = text.indexOf("\n", start);
  return newline === -1 ? text.length : newline;
}

function endOfQuotedString(text: string, start: number): number {
  const quote = text[start];
  let index = start + 1;
  while (index < text.length && text[index] !== quote && text[index] !== "\n") {
    index += text[index] === "\\" ? 2 : 1;
  }
  return text[index] === quote ? index + 1 : Math.min(index, text.length);
}

function endOfInterpolatedString(text: string, start: number): number {
  let index = start + 1;
  let braceDepth = 0;
  while (index < text.length) {
    const character = text[index];
    if (character === "\\") {
      index += 2;
    } else if (character === "`" && braceDepth === 0) {
      return index + 1;
    } else {
      braceDepth += character === "{" ? 1 : 0;
      braceDepth -= character === "}" && braceDepth > 0 ? 1 : 0;
      index += 1;
    }
  }
  return text.length;
}

function endWhile(text: string, start: number, pattern: RegExp): number {
  let index = start;
  while (index < text.length && pattern.test(text[index] ?? "")) {
    index += 1;
  }
  return index;
}

function symbolAt(text: string, start: number): string {
  const symbol = MULTI_CHARACTER_SYMBOLS.find((candidate) => text.startsWith(candidate, start));
  return symbol ?? text[start] ?? "";
}

function stringEnd(text: string, index: number): number | undefined {
  const character = text[index];
  if (character === '"' || character === "'") {
    return endOfQuotedString(text, index);
  }
  if (character === "`") {
    return endOfInterpolatedString(text, index);
  }
  const level = longBracketLevel(text, index);
  return level === undefined ? undefined : endOfLongBracket(text, index, level);
}

function token(kind: TokenKind, text: string, start: number, end: number): Token {
  return { kind, text: text.slice(start, end), start, end };
}

function readToken(text: string, index: number): Token {
  const character = text[index] ?? "";
  const end = stringEnd(text, index);
  if (end !== undefined) {
    return token("string", text, index, end);
  }
  if (NAME_START.test(character)) {
    return token("name", text, index, endWhile(text, index, NAME_PART));
  }
  if (DIGIT.test(character)) {
    return token("number", text, index, endWhile(text, index, NUMBER_PART));
  }
  return token("symbol", text, index, index + symbolAt(text, index).length);
}

export function tokenize(text: string): readonly Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < text.length) {
    if (WHITESPACE.test(text[index] ?? "")) {
      index = endWhile(text, index, WHITESPACE);
    } else if (text.startsWith("--", index)) {
      index = endOfComment(text, index);
    } else {
      const next = readToken(text, index);
      tokens.push(next);
      index = next.end;
    }
  }
  return tokens;
}
