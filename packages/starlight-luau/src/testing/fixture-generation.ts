import { fileURLToPath } from "node:url";

import type { Generation } from "../generate/generate-api.ts";
import { generateApi } from "../generate/generate-api.ts";
import {
  DEFAULT_EXAMPLE_PATTERNS,
  DEFAULT_TEST_FUNCTIONS,
  sourceLinkFromTemplate,
} from "../plugin/options.ts";
import { createRoutes } from "../render/routes.ts";

export const FIXTURES = fileURLToPath(new URL("../../../../fixtures/", import.meta.url));
export const EXPECTED = fileURLToPath(new URL("../../../../fixtures/expected/", import.meta.url));

export function generateFixtures(): Generation {
  return generateApi({
    sourceRoot: `${FIXTURES}src`,
    include: ["**/*.luau"],
    exclude: ["**/*.spec.luau"],
    modules: ["Shape", "Inventory"],
    proseRoot: `${FIXTURES}docs/api`,
    examples: { patterns: DEFAULT_EXAMPLE_PATTERNS, testFunctions: DEFAULT_TEST_FUNCTIONS },
    luauAst: "luau-ast",
    routes: createRoutes({ base: "/", output: "api", trailingSlash: true }),
    printWidth: 80,
    sourceLink: sourceLinkFromTemplate(
      "https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/{file}#L{line}",
    ),
    title: "API reference",
  });
}
