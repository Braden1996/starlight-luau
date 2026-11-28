import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import type { HookParameters, StarlightPlugin } from "@astrojs/starlight/types";

import { generateApi } from "../generate/generate-api.ts";
import { writePages } from "../generate/write-pages.ts";
import { createRoutes } from "../render/routes.ts";
import type { ResolvedOptions, StarlightLuauOptions } from "./options.ts";
import { resolveOptions, sourceLinkFromTemplate } from "./options.ts";

type SetupParameters = HookParameters<"config:setup">;
type SidebarItems = NonNullable<SetupParameters["config"]["sidebar"]>;

const STYLESHEET = "starlight-luau/styles.css";

function generateInto(options: ResolvedOptions, parameters: SetupParameters): readonly string[] {
  const { astroConfig, logger } = parameters;
  const projectRoot = fileURLToPath(astroConfig.root);
  const generation = generateApi({
    sourceRoot: resolve(projectRoot, options.source),
    include: options.include,
    exclude: options.exclude,
    modules: options.modules,
    proseRoot: options.prose === undefined ? undefined : resolve(projectRoot, options.prose),
    examples: options.examples,
    luauAst: options.luauAst,
    routes: createRoutes({
      base: astroConfig.base,
      output: options.output,
      trailingSlash: astroConfig.trailingSlash !== "never",
    }),
    printWidth: options.printWidth,
    sourceLink: sourceLinkFromTemplate(options.sourceUrl),
    status:
      options.status === undefined ? undefined : { ...options.status, file: resolve(projectRoot, options.status.file) },
    title: options.title,
  });
  writePages(join(fileURLToPath(astroConfig.srcDir), "content", "docs", options.output), generation.pages);
  for (const warning of generation.warnings) {
    logger.warn(warning);
  }
  logger.info(`generated ${String(generation.pages.length)} API pages into ${options.output}/`);
  return generation.inputs;
}

function sidebarWithApi(sidebar: SidebarItems, options: ResolvedOptions): SidebarItems {
  return [...sidebar, { label: options.title, items: [{ autogenerate: { directory: options.output } }] }];
}

function updateStarlightConfig(options: ResolvedOptions, parameters: SetupParameters): void {
  const { config, updateConfig } = parameters;
  const customCss = [...(config.customCss ?? []), STYLESHEET];
  if (options.sidebar && config.sidebar !== undefined) {
    updateConfig({ customCss, sidebar: sidebarWithApi(config.sidebar, options) });
  } else {
    updateConfig({ customCss });
  }
}

function watchInputs(inputs: readonly string[], parameters: SetupParameters): void {
  parameters.addIntegration({
    name: "starlight-luau-watch",
    hooks: {
      "astro:config:setup": ({ addWatchFile }) => {
        for (const input of inputs) {
          addWatchFile(input);
        }
      },
    },
  });
}

export function starlightLuau(userOptions: StarlightLuauOptions): StarlightPlugin {
  const options = resolveOptions(userOptions);
  return {
    name: "starlight-luau",
    hooks: {
      "config:setup": (parameters) => {
        updateStarlightConfig(options, parameters);
        if (parameters.command !== "preview") {
          watchInputs(generateInto(options, parameters), parameters);
        }
      },
    },
  };
}
