import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { EXPECTED, generateFixtures } from "./fixture-generation.ts";

rmSync(EXPECTED, { recursive: true, force: true });
mkdirSync(EXPECTED, { recursive: true });
for (const page of generateFixtures().pages) {
  writeFileSync(join(EXPECTED, page.path), page.content);
}
