import type { ApiIndex, Scope } from "../link/api-index.ts";
import type { TypeReference } from "../model/luau-type.ts";
import { unreachable } from "../model/unreachable.ts";
import type { Routes } from "./routes.ts";
import type { LinkTarget, ReferenceLinker } from "./type-doc.ts";

export function createLinker(index: ApiIndex, routes: Routes, scope: Scope): ReferenceLinker {
  return (reference: TypeReference): LinkTarget => {
    const resolution = index.resolve(reference, scope);
    switch (resolution.kind) {
      case "generic":
        return { style: "generic", href: undefined };
      case "builtin":
        return { style: "builtin", href: undefined };
      case "entry":
        return { style: "type", href: routes.entryHref(resolution.module, resolution.entry) };
      case "unresolved":
        return { style: "type", href: undefined };
      default:
        return unreachable(resolution);
    }
  };
}
