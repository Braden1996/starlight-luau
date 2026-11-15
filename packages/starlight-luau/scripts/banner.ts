import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const OUTPUT = fileURLToPath(new URL("../../../.github/banner.svg", import.meta.url));
const PACKAGE_JSON = fileURLToPath(new URL("../package.json", import.meta.url));
const MONO = "'JetBrains Mono','Cascadia Code',Consolas,monospace";
const SANS = "'Segoe UI','Inter','Helvetica Neue',Arial,sans-serif";

type Attributes = Readonly<Record<string, string | number>>;

interface Token {
  readonly text: string;
  readonly colour: string;
}

function escapeXml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function attributes(values: Attributes): string {
  return Object.keys(values)
    .toSorted()
    .map((key) => `${key}="${String(values[key])}"`)
    .join(" ");
}

function element(name: string, values: Attributes, body?: string): string {
  return body === undefined
    ? `<${name} ${attributes(values)}/>`
    : `<${name} ${attributes(values)}>${body}</${name}>`;
}

function gradient(id: string, from: string, to: string): string {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient>`;
}

function packageVersion(): string {
  const parsed: unknown = JSON.parse(readFileSync(PACKAGE_JSON, "utf8"));
  if (typeof parsed !== "object" || parsed === null || !("version" in parsed)) {
    throw new Error("package.json has no version");
  }
  return String(parsed.version);
}

function codeLine(tokens: readonly Token[], x: number, y: number): string {
  const spans = tokens.map((token) =>
    element("tspan", { fill: token.colour }, escapeXml(token.text)),
  );
  return element("text", { x, y, "font-family": MONO, "font-size": 21 }, spans.join(""));
}

const SIGNATURE: readonly Token[] = [
  { text: "function", colour: "#c678dd" },
  { text: " Result.map", colour: "#e6edf3" },
  { text: "<", colour: "#8b949e" },
  { text: "R, U", colour: "#f7a072" },
  { text: ">(", colour: "#8b949e" },
  { text: "r", colour: "#e6edf3" },
  { text: ": ", colour: "#8b949e" },
  { text: "R", colour: "#f7a072" },
  { text: ", f", colour: "#e6edf3" },
  { text: ": (", colour: "#8b949e" },
  { text: "OkOf", colour: "#8ab4ff" },
  { text: "<R>) -> U)", colour: "#8b949e" },
];

const PAGE_LINE: readonly Token[] = [
  { text: "→ ", colour: "#7ee2a8" },
  { text: "api/result/#map", colour: "#7ee2a8" },
  { text: "  linked types · variants · examples from tests", colour: "#8b949e" },
];

function emblem(): readonly string[] {
  return [
    element("rect", {
      x: 96,
      y: 112,
      width: 220,
      height: 176,
      rx: 18,
      fill: "#0d1117",
      stroke: "url(#core)",
      "stroke-width": 3,
    }),
    element(
      "text",
      { x: 122, y: 166, "font-family": MONO, "font-size": 22, fill: "#c678dd" },
      "export type",
    ),
    element(
      "text",
      { x: 122, y: 204, "font-family": MONO, "font-size": 22, fill: "#8ab4ff" },
      "Shape =",
    ),
    element(
      "text",
      { x: 140, y: 242, "font-family": MONO, "font-size": 22, fill: "#7ee2a8" },
      "| Circle",
    ),
    element(
      "text",
      { x: 140, y: 276, "font-family": MONO, "font-size": 22, fill: "#7ee2a8" },
      "| Square",
    ),
    element("path", {
      d: "M330 200 L 392 200",
      stroke: "url(#core)",
      "stroke-width": 6,
      "stroke-linecap": "round",
    }),
    element("path", {
      d: "M380 186 L 396 200 L 380 214",
      fill: "none",
      stroke: "#8ab4ff",
      "stroke-width": 6,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }),
  ];
}

function wordmark(version: string): readonly string[] {
  const stats = `v${version}  ·  Luau types only, no doc comments  ·  Astro + Starlight plugin`;
  return [
    element(
      "text",
      {
        x: 440,
        y: 140,
        "font-family": SANS,
        "font-size": 68,
        "font-weight": 700,
        fill: "#ffffff",
        "letter-spacing": -1,
      },
      "starlight-luau",
    ),
    element(
      "text",
      { x: 442, y: 184, "font-family": SANS, "font-size": 24, fill: "#c9d1ff" },
      "API reference pages for Starlight, generated from Luau types",
    ),
    element("rect", {
      x: 440,
      y: 210,
      width: 760,
      height: 96,
      rx: 10,
      fill: "#0d1117",
      "fill-opacity": 0.8,
      stroke: "#3d63dd",
      "stroke-opacity": 0.6,
    }),
    codeLine(SIGNATURE, 464, 248),
    codeLine(PAGE_LINE, 464, 284),
    element(
      "text",
      { x: 442, y: 350, "font-family": SANS, "font-size": 20, fill: "#7ee2a8" },
      escapeXml(stats),
    ),
  ];
}

function bannerSvg(version: string): string {
  const lines = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="400" viewBox="0 0 1280 400" role="img" aria-labelledby="title desc">',
    '<title id="title">starlight-luau</title>',
    '<desc id="desc">A Starlight plugin that generates API reference pages from Luau types</desc>',
    `<defs>${gradient("bg", "#0d1117", "#10203f")}${gradient("core", "#8ab4ff", "#3d63dd")}</defs>`,
    element("rect", { width: 1280, height: 400, fill: "url(#bg)" }),
    ...emblem(),
    ...wordmark(version),
    "</svg>",
  ];
  return `${lines.join("\n")}\n`;
}

function run(check: boolean): void {
  const content = bannerSvg(packageVersion());
  if (!check) {
    writeFileSync(OUTPUT, content);
    return;
  }
  if (readFileSync(OUTPUT, "utf8") !== content) {
    process.stderr.write(
      ".github/banner.svg is stale: run `bun run banner` in packages/starlight-luau\n",
    );
    process.exitCode = 1;
  }
}

run(process.argv.includes("--check"));
