import { readFileSync } from "node:fs";

import type { ModuleApi } from "../model/module-api.ts";

export const STATUS_TONES = ["default", "note", "tip", "success", "caution", "danger"] as const;

export type StatusTone = (typeof STATUS_TONES)[number];

export interface StatusLevel {
  readonly id: string;
  readonly label: string;
  readonly tone: StatusTone;
  readonly description: string | undefined;
}

export interface StatusOptions {
  readonly file: string;
  readonly levels: readonly StatusLevel[];
  readonly unlisted: string | undefined;
}

export interface FunctionStatus {
  readonly level: StatusLevel;
  readonly note: string | undefined;
}

export interface ApiStatus {
  readonly levels: readonly StatusLevel[];
  readonly unlisted: StatusLevel | undefined;
  readonly modules: ReadonlyMap<string, ReadonlyMap<string, FunctionStatus>>;
}

export class StatusFileError extends Error {
  constructor(file: string, message: string, options?: ErrorOptions) {
    super(`starlight-luau: status file ${file}: ${message}`, options);
    this.name = "StatusFileError";
  }
}

type JsonObject = Readonly<Record<string, unknown>>;

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function levelById(
  levels: readonly StatusLevel[],
  id: string,
  fail: (message: string) => StatusFileError,
): StatusLevel {
  const level = levels.find((candidate) => candidate.id === id);
  if (level === undefined) {
    throw fail(`"${id}" is not one of the levels ${levels.map((known) => `"${known.id}"`).join(", ")}`);
  }
  return level;
}

function decodeFunctionStatus(
  value: unknown,
  where: string,
  levels: readonly StatusLevel[],
  fail: (message: string) => StatusFileError,
): FunctionStatus {
  if (typeof value === "string") {
    return {
      level: levelById(levels, value, (message) => fail(`${where}: ${message}`)),
      note: undefined,
    };
  }
  if (!isJsonObject(value) || typeof value["level"] !== "string") {
    throw fail(`${where} must be a level name or { "level": string, "note"?: string }`);
  }
  const note = value["note"];
  if (note !== undefined && typeof note !== "string") {
    throw fail(`${where}.note must be a string`);
  }
  return {
    level: levelById(levels, value["level"], (message) => fail(`${where}: ${message}`)),
    note,
  };
}

function decodeModule(
  name: string,
  value: unknown,
  levels: readonly StatusLevel[],
  fail: (message: string) => StatusFileError,
): ReadonlyMap<string, FunctionStatus> {
  if (!isJsonObject(value)) {
    throw fail(`${name} must map function names to levels`);
  }
  return new Map(
    Object.entries(value).map(([functionName, entry]) => [
      functionName,
      decodeFunctionStatus(entry, `${name}.${functionName}`, levels, fail),
    ]),
  );
}

export function decodeStatus(json: unknown, options: StatusOptions): ApiStatus {
  const fail = (message: string): StatusFileError => new StatusFileError(options.file, message);
  if (!isJsonObject(json)) {
    throw fail("must map module names to { function: level } objects");
  }
  return {
    levels: options.levels,
    unlisted: options.unlisted === undefined ? undefined : levelById(options.levels, options.unlisted, fail),
    modules: new Map(
      Object.entries(json).map(([name, value]) => [name, decodeModule(name, value, options.levels, fail)]),
    ),
  };
}

function parseJson(file: string): unknown {
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new StatusFileError(file, error instanceof Error ? error.message : String(error), {
      cause: error,
    });
  }
}

export function loadStatus(options: StatusOptions): ApiStatus {
  return decodeStatus(parseJson(options.file), options);
}

export function statusOf(
  status: ApiStatus,
  module: Pick<ModuleApi, "name">,
  functionName: string,
): FunctionStatus | undefined {
  const listed = status.modules.get(module.name)?.get(functionName);
  if (listed !== undefined) {
    return listed;
  }
  return status.unlisted === undefined ? undefined : { level: status.unlisted, note: undefined };
}

export function unmatchedStatus(status: ApiStatus, apis: readonly ModuleApi[]): readonly string[] {
  const functionsByModule = new Map(apis.map((api) => [api.name, new Set(api.functions.map((entry) => entry.name))]));
  return [...status.modules].flatMap(([moduleName, functions]) => {
    const known = functionsByModule.get(moduleName);
    if (known === undefined) {
      return [moduleName];
    }
    return [...functions.keys()].flatMap((name) => (known.has(name) ? [] : [`${moduleName}.${name}`]));
  });
}
