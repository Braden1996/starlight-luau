import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";

export const collections = {
  docs: { type: "content_layer", loader: docsLoader(), schema: docsSchema() },
};
