import { posix } from "node:path";

import type { TypeReference } from "../model/luau-type.ts";
import type { FunctionEntry, ModuleApi, TypeEntry } from "../model/module-api.ts";
import { referencesIn, typesOfEntry, typesOfFunction } from "../model/walk-types.ts";

export interface Scope {
  readonly module: ModuleApi;
  readonly generics: ReadonlySet<string>;
}

export type Resolution =
  | { readonly kind: "generic"; readonly name: string }
  | { readonly kind: "builtin"; readonly name: string }
  | { readonly kind: "entry"; readonly module: ModuleApi; readonly entry: TypeEntry }
  | { readonly kind: "unresolved" };

const BUILTIN_TYPES: ReadonlySet<string> = new Set([
  "any",
  "boolean",
  "buffer",
  "never",
  "nil",
  "number",
  "string",
  "table",
  "thread",
  "type",
  "unknown",
  "userdata",
  "vector",
]);

const REQUIRE_SUFFIXES = [".luau", ".lua", "/init.luau", "/init.lua"] as const;

export function scopeOfFunction(module: ModuleApi, entry: FunctionEntry): Scope {
  const names = [...entry.generics, ...entry.genericPacks].map((generic) => generic.name);
  return { module, generics: new Set(names) };
}

export function scopeOfType(module: ModuleApi, entry: TypeEntry): Scope {
  if (entry.kind === "type-function") {
    return { module, generics: new Set() };
  }
  const names = [...entry.generics, ...entry.genericPacks].map((generic) => generic.name);
  return { module, generics: new Set(names) };
}

function rootsOf(module: ModuleApi): ReadonlyArray<readonly [Scope, readonly TypeReference[]]> {
  const fromFunctions = module.functions.map(
    (entry) => [scopeOfFunction(module, entry), referencesIn(typesOfFunction(entry))] as const,
  );
  const fromExports = module.types.flatMap((entry) =>
    entry.exported ? [[scopeOfType(module, entry), referencesIn(typesOfEntry(entry))] as const] : [],
  );
  return [...fromFunctions, ...fromExports];
}

function localTarget(module: ModuleApi, scope: Scope, reference: TypeReference): TypeEntry | undefined {
  if (reference.prefix !== undefined || scope.generics.has(reference.name)) {
    return undefined;
  }
  return module.types.find((entry) => entry.name === reference.name);
}

function documentedTypesOf(module: ModuleApi): readonly TypeEntry[] {
  const documented = new Set(module.types.filter((entry) => entry.exported));
  const pending = [...rootsOf(module)];
  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [scope, references] = next;
    for (const reference of references) {
      const target = localTarget(module, scope, reference);
      if (target !== undefined && !documented.has(target)) {
        documented.add(target);
        pending.push([scopeOfType(module, target), referencesIn(typesOfEntry(target))]);
      }
    }
  }
  return module.types.filter((entry) => documented.has(entry));
}

function requireCandidates(fromFile: string, requirePath: string): readonly string[] {
  const base = posix.normalize(posix.join(posix.dirname(fromFile), requirePath));
  return REQUIRE_SUFFIXES.map((suffix) => `${base}${suffix}`);
}

export class ApiIndex {
  readonly modules: readonly ModuleApi[];
  readonly #byFile: ReadonlyMap<string, ModuleApi>;
  readonly #documented: ReadonlyMap<ModuleApi, readonly TypeEntry[]>;

  constructor(modules: readonly ModuleApi[]) {
    this.modules = modules;
    this.#byFile = new Map(modules.map((module) => [module.file, module]));
    this.#documented = new Map(modules.map((module) => [module, documentedTypesOf(module)]));
  }

  documentedTypes(module: ModuleApi): readonly TypeEntry[] {
    return this.#documented.get(module) ?? [];
  }

  requiredModule(from: ModuleApi, localName: string): ModuleApi | undefined {
    const requirePath = from.requires.get(localName);
    if (requirePath === undefined || !requirePath.startsWith(".")) {
      return undefined;
    }
    const file = requireCandidates(from.file, requirePath).find((candidate) => this.#byFile.has(candidate));
    return file === undefined ? undefined : this.#byFile.get(file);
  }

  #documentedEntry(module: ModuleApi, name: string): Resolution {
    const entry = this.documentedTypes(module).find((candidate) => candidate.name === name);
    return entry === undefined ? { kind: "unresolved" } : { kind: "entry", module, entry };
  }

  resolve(reference: TypeReference, scope: Scope): Resolution {
    if (reference.prefix !== undefined) {
      const target = this.requiredModule(scope.module, reference.prefix);
      return target === undefined ? { kind: "unresolved" } : this.#documentedEntry(target, reference.name);
    }
    if (scope.generics.has(reference.name)) {
      return { kind: "generic", name: reference.name };
    }
    const local = this.#documentedEntry(scope.module, reference.name);
    if (local.kind === "unresolved" && BUILTIN_TYPES.has(reference.name)) {
      return { kind: "builtin", name: reference.name };
    }
    return local;
  }
}
