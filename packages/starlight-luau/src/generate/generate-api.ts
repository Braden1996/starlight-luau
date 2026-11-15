import { readFileSync } from "node:fs";

import { readAstRoot } from "../ast/run-luau-ast.ts";
import type { TestExample } from "../examples/extract-tests.ts";
import { extractTests } from "../examples/extract-tests.ts";
import { ApiIndex } from "../link/api-index.ts";
import { DecodeContext } from "../parse/decode-context.ts";
import type { ModuleFile } from "../parse/parse-module-file.ts";
import { parseModuleFile } from "../parse/parse-module-file.ts";
import { loadProse, unmatchedProse } from "../prose/load-prose.ts";
import { displayName } from "../render/function-section.ts";
import { renderIndexPage } from "../render/index-page.ts";
import type { ModulePageInput } from "../render/module-page.ts";
import { renderModulePage } from "../render/module-page.ts";
import type { PageContext, SourceLink } from "../render/page-context.ts";
import type { Routes } from "../render/routes.ts";
import { moduleSlug } from "../render/routes.ts";
import { discoverModules, exampleFilesFor } from "./discover-modules.ts";

export interface ExampleOptions {
  readonly patterns: readonly string[];
  readonly testFunctions: readonly string[];
}

export interface GenerateOptions {
  readonly sourceRoot: string;
  readonly include: readonly string[];
  readonly exclude: readonly string[];
  readonly modules: readonly string[] | undefined;
  readonly proseRoot: string | undefined;
  readonly examples: ExampleOptions | undefined;
  readonly luauAst: string;
  readonly routes: Routes;
  readonly printWidth: number;
  readonly sourceLink: SourceLink | undefined;
  readonly title: string;
}

export interface GeneratedPage {
  readonly path: string;
  readonly content: string;
}

export interface Generation {
  readonly pages: readonly GeneratedPage[];
  readonly inputs: readonly string[];
  readonly warnings: readonly string[];
}

function examplesOf(
  module: ModuleFile,
  options: GenerateOptions,
): { examples: readonly TestExample[]; files: readonly string[] } {
  if (options.examples === undefined) {
    return { examples: [], files: [] };
  }
  const files = exampleFilesFor(options.sourceRoot, module, options.examples.patterns);
  const conventions = {
    moduleName: displayName({ name: module.name }),
    testFunctions: new Set(options.examples.testFunctions),
  };
  const examples = files.flatMap((file) =>
    extractTests(
      readAstRoot(options.luauAst, file),
      new DecodeContext(readFileSync(file, "utf8")),
      conventions,
    ),
  );
  return { examples, files };
}

export function generateApi(options: GenerateOptions): Generation {
  const discovery = discoverModules(options);
  const parsed = discovery.modules.map((module) => ({
    module,
    api: parseModuleFile(options.luauAst, module).api,
  }));
  const index = new ApiIndex(parsed.map(({ api }) => api));
  const context: PageContext = {
    index,
    routes: options.routes,
    printWidth: options.printWidth,
    sourceLink: options.sourceLink,
  };
  const warnings: string[] = discovery.missing.map(
    (name) => `module ${name} is listed but no file matches it`,
  );
  const inputs: string[] = discovery.modules.map((module) => module.path);
  const pageInputs: ModulePageInput[] = parsed.map(({ module, api }, position) => {
    const prose = loadProse(options.proseRoot, api.name);
    const { examples, files } = examplesOf(module, options);
    warnings.push(
      ...unmatchedProse(prose, api).map((file) => `prose ${file} matches no function or type`),
    );
    inputs.push(...files);
    return { module: api, prose, examples, order: position + 1 };
  });
  const pages: GeneratedPage[] = [
    { path: "index.md", content: renderIndexPage(options.title, pageInputs, context) },
    ...pageInputs.map((input) => ({
      path: `${moduleSlug(input.module)}.md`,
      content: renderModulePage(input, context),
    })),
  ];
  return { pages, inputs, warnings };
}
