import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightLuau from "starlight-luau";

export default defineConfig({
  output: "static",
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "starlight-luau demo",
      social: [{ icon: "github", label: "GitHub", href: "https://github.com/Braden1996/starlight-luau" }],
      sidebar: [{ label: "Start here", items: [{ label: "Introduction", link: "/" }] }],
      plugins: [
        starlightLuau({
          source: "../fixtures/src",
          modules: ["Shape", "Inventory"],
          prose: "../fixtures/docs/api",
          sourceUrl: "https://github.com/Braden1996/starlight-luau/blob/main/fixtures/src/{file}#L{line}",
        }),
      ],
    }),
  ],
});
