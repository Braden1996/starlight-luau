const LEADING_WHITESPACE = /^[\t ]*/u;
const INDENT = "  ";

function leadingWhitespace(line: string): string {
  return LEADING_WHITESPACE.exec(line)?.[0] ?? "";
}

function trimBlankEdges(lines: readonly string[]): readonly string[] {
  const first = lines.findIndex((line) => line.trim() !== "");
  const last = lines.findLastIndex((line) => line.trim() !== "");
  return first === -1 ? [] : lines.slice(first, last + 1);
}

function commonIndentLength(lines: readonly string[]): number {
  const indents = lines.flatMap((line) => (line.trim() === "" ? [] : [leadingWhitespace(line).length]));
  return indents.length === 0 ? 0 : Math.min(...indents);
}

function tabsToSpaces(line: string): string {
  const whitespace = leadingWhitespace(line);
  return whitespace.replaceAll("\t", INDENT) + line.slice(whitespace.length);
}

export function dedent(text: string): string {
  const lines = trimBlankEdges(text.replaceAll("\r\n", "\n").split("\n"));
  const strip = commonIndentLength(lines);
  return lines.map((line) => tabsToSpaces(line.slice(strip)).trimEnd()).join("\n");
}
