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
