import { describe, expect, test } from "bun:test";

import type { FunctionEntry, ModuleApi, TypeEntry } from "../model/module-api.ts";
import { createRoutes, entryAnchor, moduleSlug } from "./routes.ts";

const module: ModuleApi = {
  name: "net/Http",
  file: "net/Http.luau",
  functions: [],
  types: [],
  requires: new Map(),
};

const fn: FunctionEntry = {
  kind: "function",
  name: "get",
  isMethod: false,
  line: 1,
  generics: [],
  genericPacks: [],
  parameters: [],
  variadic: { kind: "none" },
  returns: undefined,
};

const type: TypeEntry = {
  kind: "type-function",
  name: "Get",
  exported: true,
  line: 1,
  parameters: [],
  implementation: "",
};

describe("routes", () => {
  test("slugs modules by lower-casing their path", () => {
    expect(moduleSlug(module)).toBe("net/http");
  });

  test("anchors functions by name and types with a type- prefix", () => {
    expect(entryAnchor(fn)).toBe("get");
    expect(entryAnchor(type)).toBe("type-Get");
  });

  test("joins the base and output with a trailing slash", () => {
    const routes = createRoutes({ base: "/docs/", output: "api", trailingSlash: true });
    expect(routes.indexPage).toBe("/docs/api/");
    expect(routes.modulePage(module)).toBe("/docs/api/net/http/");
    expect(routes.entryHref(module, type)).toBe("/docs/api/net/http/#type-Get");
  });

  test("omits the trailing slash when the site does", () => {
    const routes = createRoutes({ base: "/", output: "/reference/", trailingSlash: false });
    expect(routes.indexPage).toBe("/reference");
    expect(routes.entryHref(module, fn)).toBe("/reference/net/http#get");
  });
});
