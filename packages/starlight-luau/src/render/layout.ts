import { unreachable } from "../model/unreachable.ts";
import type { Doc, StyledToken } from "./doc.ts";

export interface LaidOutLine {
  readonly depth: number;
  readonly tokens: readonly StyledToken[];
}

type Mode = "flat" | "break";

interface Command {
  readonly depth: number;
  readonly mode: Mode;
  readonly doc: Doc;
}

export const INDENT_WIDTH = 2;
const SPACE: StyledToken = { text: " ", style: "plain", href: undefined };

function childCommands(
  command: Command,
  parts: readonly Doc[],
  depth: number,
  mode: Mode,
): Command[] {
  return parts.map((doc) => ({ depth: command.depth + depth, mode, doc })).toReversed();
}

function widthOfFlat(command: Command): number | "ends-line" {
  const { doc, mode } = command;
  switch (doc.kind) {
    case "token":
      return doc.token.text.length;
    case "line":
      return mode === "flat" ? 1 : "ends-line";
    case "softline":
      return mode === "flat" ? 0 : "ends-line";
    case "if-break":
      return mode === "flat" ? 0 : doc.token.text.length;
    case "group":
    case "indent":
    case "concat":
      return 0;
    default:
      return unreachable(doc);
  }
}

function expand(command: Command): readonly Command[] {
  const { doc } = command;
  switch (doc.kind) {
    case "group":
      return childCommands(command, doc.parts, 0, doc.measuredFlat ? "flat" : command.mode);
    case "concat":
      return childCommands(command, doc.parts, 0, command.mode);
    case "indent":
      return childCommands(command, doc.parts, 1, command.mode);
    case "token":
    case "line":
    case "softline":
    case "if-break":
      return [];
    default:
      return unreachable(doc);
  }
}

function fits(candidate: Command, rest: readonly Command[], available: number): boolean {
  let remaining = available;
  const pending: Command[] = [candidate];
  let restIndex = rest.length - 1;
  while (remaining >= 0) {
    const next = pending.pop() ?? rest[restIndex--];
    if (next === undefined) {
      return true;
    }
    const width = widthOfFlat(next);
    if (width === "ends-line") {
      return true;
    }
    remaining -= width;
    pending.push(...expand(next));
  }
  return false;
}

class LineWriter {
  readonly lines: { depth: number; tokens: StyledToken[] }[] = [{ depth: 0, tokens: [] }];
  column = 0;

  write(token: StyledToken): void {
    this.lines.at(-1)?.tokens.push(token);
    this.column += token.text.length;
  }

  newLine(depth: number): void {
    this.lines.push({ depth, tokens: [] });
    this.column = depth * INDENT_WIDTH;
  }
}

function step(command: Command, stack: Command[], writer: LineWriter, width: number): void {
  const { doc, mode } = command;
  switch (doc.kind) {
    case "token":
      writer.write(doc.token);
      return;
    case "line":
    case "softline":
      if (mode === "break") {
        writer.newLine(command.depth);
      } else if (doc.kind === "line") {
        writer.write(SPACE);
      }
      return;
    case "if-break":
      if (mode === "break") {
        writer.write(doc.token);
      }
      return;
    case "group": {
      const flat: Command = { ...command, mode: "flat" };
      const chosen = mode === "flat" || fits(flat, stack, width - writer.column) ? "flat" : "break";
      stack.push(...childCommands(command, doc.parts, 0, chosen));
      return;
    }
    case "indent":
    case "concat":
      stack.push(...expand(command));
      return;
  }
}

export function layout(doc: Doc, width: number): readonly LaidOutLine[] {
  const writer = new LineWriter();
  const stack: Command[] = [{ depth: 0, mode: "break", doc }];
  for (let command = stack.pop(); command !== undefined; command = stack.pop()) {
    step(command, stack, writer, width);
  }
  return writer.lines;
}

export function layoutAsText(doc: Doc, width: number): string {
  return layout(doc, width)
    .map(
      (laidOut) =>
        " ".repeat(laidOut.depth * INDENT_WIDTH) +
        laidOut.tokens.map((token) => token.text).join(""),
    )
    .join("\n");
}
