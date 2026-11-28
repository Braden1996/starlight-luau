import { fileURLToPath } from "node:url";

import type { Generation } from "../generate/generate-api.ts";
import { generateApi } from "../generate/generate-api.ts";
import { DEFAULT_EXAMPLE_PATTERNS, DEFAULT_TEST_FUNCTIONS, sourceLinkFromTemplate } from "../plugin/options.ts";
import { createRoutes } from "../render/routes.ts";
import type { StatusLevel } from "../status/api-status.ts";

export const FIXTURES: string = fileURLToPath(new URL("../../../../../../../fixtures/", import.meta.url));
export const EXPECTED: string = fileURLToPath(new URL("../../../../../../../fixtures/expected/", import.meta.url));

export const FIXTURE_STATUS_LEVELS: readonly StatusLevel[] = [
  {
    id: "modelled",
    label: "Modelled",
    tone: "success",
    description: "The fake behaves like the game.",
  },
  {
    id: "recorded",
    label: "Recorded",
    tone: "note",
    description: "Replays values captured in the game.",
  },
  {
    id: "guessed",
    label: "Guessed",
    tone: "caution",
    description: "Plausible behaviour, not checked against the game.",
  },
  { id: "not-faked", label: "Not faked", tone: "danger", description: "Calling it fails." },
];

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
    status: {
      file: `${FIXTURES}docs/status.json`,
      levels: FIXTURE_STATUS_LEVELS,
      unlisted: "not-faked",
    },
    title: "API reference",
  });
}
