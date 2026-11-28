import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";

import starlightLuau from "@starlight-luau/library";

export default defineConfig({
  output: "static",
  base: "/starlight-luau",
  trailingSlash: "always",
  vite: {
    resolve: {
      alias: { "starlight-luau/styles.css": "@starlight-luau/library/styles.css" },
    },
  },
  integrations: [
    starlight({
      title: "starlight-luau demo",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/Braden1996/starlight-luau" }],
      sidebar: [{ label: "Start here", items: [{ label: "Introduction", link: "/" }] }],
      plugins: [
        starlightLuau({
          source: "../../../fixtures/src",
          modules: ["Shape", "Inventory"],
          prose: "../../../fixtures/docs/api",
          sourceUrl: "https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/{file}#L{line}",
          status: {
            file: "../../../fixtures/docs/status.json",
            levels: {
              modelled: { label: "Modelled", tone: "success", description: "The fake behaves like the game." },
              recorded: { label: "Recorded", tone: "note", description: "Replays values captured in the game." },
              guessed: {
                label: "Guessed",
                tone: "caution",
                description: "Plausible behaviour, not checked against the game.",
              },
              "not-faked": { label: "Not faked", tone: "danger", description: "Calling it fails." },
            },
            unlisted: "not-faked",
          },
        }),
      ],
    }),
  ],
});
