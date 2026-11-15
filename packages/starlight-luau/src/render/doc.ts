export type TokenStyle =
  | "keyword"
  | "type"
  | "generic"
  | "builtin"
  | "string"
  | "literal"
  | "parameter"
  | "property"
  | "punctuation"
  | "plain";

export interface StyledToken {
  readonly text: string;
  readonly style: TokenStyle;
  readonly href: string | undefined;
}

export type Doc =
  | { readonly kind: "token"; readonly token: StyledToken }
  | { readonly kind: "line" }
  | { readonly kind: "softline" }
  | { readonly kind: "if-break"; readonly token: StyledToken }
  | { readonly kind: "group"; readonly parts: readonly Doc[]; readonly measuredFlat: boolean }
  | { readonly kind: "indent"; readonly parts: readonly Doc[] }
  | { readonly kind: "concat"; readonly parts: readonly Doc[] };

export const line: Doc = { kind: "line" };
export const softline: Doc = { kind: "softline" };

export function text(value: string, style: TokenStyle = "plain", href?: string): Doc {
  return { kind: "token", token: { text: value, style, href } };
}

export function ifBreak(value: string): Doc {
  return { kind: "if-break", token: { text: value, style: "plain", href: undefined } };
}

export function concat(...parts: readonly Doc[]): Doc {
  return { kind: "concat", parts };
}

export function group(...parts: readonly Doc[]): Doc {
  return { kind: "group", parts, measuredFlat: false };
}

export function keepTogether(...parts: readonly Doc[]): Doc {
  return { kind: "group", parts, measuredFlat: true };
}

export function indent(...parts: readonly Doc[]): Doc {
  return { kind: "indent", parts };
}

export function join(separator: readonly Doc[], items: readonly Doc[]): Doc {
  return concat(...items.flatMap((item, index) => (index === 0 ? [item] : [...separator, item])));
}
