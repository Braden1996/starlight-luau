import type { FunctionEntry, ModuleApi, TypeEntry } from "../model/module-api.ts";

export interface RouteOptions {
  readonly base: string;
  readonly output: string;
  readonly trailingSlash: boolean;
}

export interface Routes {
  readonly indexPage: string;
  modulePage(module: ModuleApi): string;
  entryHref(module: ModuleApi, entry: FunctionEntry | TypeEntry): string;
}

function trimSlashes(path: string): string {
  return path.replace(/^\/+/u, "").replace(/\/+$/u, "");
}

export function moduleSlug(module: ModuleApi): string {
  return module.name.toLowerCase();
}

export function entryAnchor(entry: FunctionEntry | TypeEntry): string {
  return entry.kind === "function" ? entry.name : `type-${entry.name}`;
}

export function createRoutes(options: RouteOptions): Routes {
  const segments = [trimSlashes(options.base), trimSlashes(options.output)].filter((segment) => segment !== "");
  const root = `/${segments.join("/")}`;
  const finish = (path: string): string => (options.trailingSlash ? `${path}/` : path);
  const modulePage = (module: ModuleApi): string => finish(`${root}/${moduleSlug(module)}`);
  return {
    indexPage: finish(root),
    modulePage,
    entryHref: (module, entry) => `${modulePage(module)}#${entryAnchor(entry)}`,
  };
}
