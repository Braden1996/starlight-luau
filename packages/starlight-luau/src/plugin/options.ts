import type { StatusLevel, StatusTone } from "../status/api-status.ts";
import { STATUS_TONES } from "../status/api-status.ts";

export interface StatusLevelUserOptions {
  readonly label: string;
  readonly tone?: StatusTone;
  readonly description?: string;
}

export interface StatusUserOptions {
  readonly file: string;
  readonly levels: Readonly<Record<string, StatusLevelUserOptions>>;
  readonly unlisted?: string;
}

export interface ResolvedStatusOptions {
  readonly file: string;
  readonly levels: readonly StatusLevel[];
  readonly unlisted: string | undefined;
}

export interface ExampleUserOptions {
  readonly patterns?: readonly string[];
  readonly testFunctions?: readonly string[];
}

export interface StarlightLuauOptions {
  readonly source: string;
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
  readonly modules?: readonly string[];
  readonly output?: string;
  readonly title?: string;
  readonly prose?: string;
  readonly examples?: false | ExampleUserOptions;
  readonly sourceUrl?: string;
  readonly status?: StatusUserOptions;
  readonly luauAst?: string;
  readonly printWidth?: number;
  readonly sidebar?: boolean;
}

export interface ResolvedOptions {
  readonly source: string;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly modules: readonly string[] | undefined;
  readonly output: string;
  readonly title: string;
  readonly prose: string | undefined;
  readonly examples:
    | { readonly patterns: readonly string[]; readonly testFunctions: readonly string[] }
    | undefined;
  readonly sourceUrl: string | undefined;
  readonly status: ResolvedStatusOptions | undefined;
  readonly luauAst: string;
  readonly printWidth: number;
  readonly sidebar: boolean;
}

export const DEFAULT_EXAMPLE_PATTERNS = [
  "{dir}/{name}.spec.luau",
  "{dir}/{name}.test.luau",
] as const;
export const DEFAULT_TEST_FUNCTIONS = ["test", "it"] as const;

export class InvalidOptionsError extends Error {
  constructor(message: string) {
    super(`starlight-luau: ${message}`);
    this.name = "InvalidOptionsError";
  }
}

function resolveExamples(
  examples: false | ExampleUserOptions | undefined,
): ResolvedOptions["examples"] {
  if (examples === false) {
    return undefined;
  }
  return {
    patterns: examples?.patterns ?? DEFAULT_EXAMPLE_PATTERNS,
    testFunctions: examples?.testFunctions ?? DEFAULT_TEST_FUNCTIONS,
  };
}

function resolveStatusLevel(id: string, level: StatusLevelUserOptions): StatusLevel {
  const tone = level.tone ?? "default";
  if (!STATUS_TONES.includes(tone)) {
    throw new InvalidOptionsError(
      `status level "${id}" has tone "${tone}"; use one of ${STATUS_TONES.join(", ")}`,
    );
  }
  if (id.trim() === "" || level.label.trim() === "") {
    throw new InvalidOptionsError("every status level needs a non-empty name and `label`");
  }
  return { id, label: level.label, tone, description: level.description };
}

function resolveStatus(status: StatusUserOptions | undefined): ResolvedStatusOptions | undefined {
  if (status === undefined) {
    return undefined;
  }
  if (status.file.trim() === "") {
    throw new InvalidOptionsError("`status.file` must name a JSON file");
  }
  const levels = Object.entries(status.levels).map(([id, level]) => resolveStatusLevel(id, level));
  if (levels.length === 0) {
    throw new InvalidOptionsError("`status.levels` must define at least one level");
  }
  if (status.unlisted !== undefined && !levels.some((level) => level.id === status.unlisted)) {
    throw new InvalidOptionsError(
      `\`status.unlisted\` names "${status.unlisted}", which is not a level`,
    );
  }
  return { file: status.file, levels, unlisted: status.unlisted };
}

function assertValid(options: StarlightLuauOptions): void {
  if (options.source.trim() === "") {
    throw new InvalidOptionsError("`source` must name the folder that holds your Luau modules");
  }
  if (options.output !== undefined && /^[/\\]*$|\.\./u.test(options.output)) {
    throw new InvalidOptionsError(
      "`output` must be a folder inside src/content/docs, such as `api`",
    );
  }
  if (
    options.printWidth !== undefined &&
    (!Number.isInteger(options.printWidth) || options.printWidth < 20)
  ) {
    throw new InvalidOptionsError("`printWidth` must be a whole number of at least 20");
  }
}

export function resolveOptions(options: StarlightLuauOptions): ResolvedOptions {
  assertValid(options);
  return {
    source: options.source,
    include: options.include ?? ["**/*.luau"],
    exclude: options.exclude ?? ["**/*.spec.luau", "**/*.test.luau"],
    modules: options.modules,
    output: options.output ?? "api",
    title: options.title ?? "API reference",
    prose: options.prose,
    examples: resolveExamples(options.examples),
    sourceUrl: options.sourceUrl,
    status: resolveStatus(options.status),
    luauAst: options.luauAst ?? "luau-ast",
    printWidth: options.printWidth ?? 80,
    sidebar: options.sidebar ?? true,
  };
}

export function sourceLinkFromTemplate(
  template: string | undefined,
): ((file: string, line: number) => string) | undefined {
  if (template === undefined) {
    return undefined;
  }
  return (file, line) => template.replaceAll("{file}", file).replaceAll("{line}", String(line));
}
