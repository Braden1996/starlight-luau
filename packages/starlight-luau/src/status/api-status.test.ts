import { afterAll, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { FunctionEntry, ModuleApi } from "../model/module-api.ts";
import type { StatusLevel, StatusOptions } from "./api-status.ts";
import {
  decodeStatus,
  loadStatus,
  StatusFileError,
  statusOf,
  unmatchedStatus,
} from "./api-status.ts";

const modelled: StatusLevel = {
  id: "modelled",
  label: "Modelled",
  tone: "success",
  description: "Behaves like the game.",
};
const guessed: StatusLevel = {
  id: "guessed",
  label: "Guessed",
  tone: "caution",
  description: undefined,
};
const options: StatusOptions = {
  file: "status.json",
  levels: [modelled, guessed],
  unlisted: undefined,
};

function functionEntry(name: string): FunctionEntry {
  return {
    kind: "function",
    name,
    isMethod: false,
    line: 1,
    generics: [],
    genericPacks: [],
    parameters: [],
    variadic: { kind: "none" },
    returns: undefined,
  };
}

function moduleApi(name: string, functions: readonly string[]): ModuleApi {
  return {
    name,
    file: `${name}.luau`,
    requires: new Map(),
    types: [],
    functions: functions.map(functionEntry),
  };
}

const directory = mkdtempSync(join(tmpdir(), "starlight-luau-status-"));

afterAll(() => {
  rmSync(directory, { recursive: true, force: true });
});

describe("decodeStatus", () => {
  test("reads a level name or a level with a note", () => {
    const status = decodeStatus(
      { Frame: { Show: "modelled", Hide: { level: "guessed", note: "No animation." } } },
      options,
    );
    expect(statusOf(status, { name: "Frame" }, "Show")).toEqual({
      level: modelled,
      note: undefined,
    });
    expect(statusOf(status, { name: "Frame" }, "Hide")).toEqual({
      level: guessed,
      note: "No animation.",
    });
  });

  test("leaves unlisted functions without a status unless `unlisted` names a level", () => {
    expect(statusOf(decodeStatus({}, options), { name: "Frame" }, "Show")).toBeUndefined();
    const fallback = decodeStatus({}, { ...options, unlisted: "guessed" });
    expect(statusOf(fallback, { name: "Frame" }, "Show")).toEqual({
      level: guessed,
      note: undefined,
    });
  });

  test("rejects unknown levels and malformed entries, naming where", () => {
    expect(() => decodeStatus({ Frame: { Show: "faked" } }, options)).toThrow(
      'Frame.Show: "faked" is not one of the levels "modelled", "guessed"',
    );
    expect(() => decodeStatus({ Frame: { Show: 3 } }, options)).toThrow(
      "Frame.Show must be a level name",
    );
    expect(() =>
      decodeStatus({ Frame: { Show: { level: "modelled", note: 1 } } }, options),
    ).toThrow("Frame.Show.note must be a string");
    expect(() => decodeStatus({ Frame: ["Show"] }, options)).toThrow(
      "Frame must map function names",
    );
    expect(() => decodeStatus([], options)).toThrow(StatusFileError);
    expect(() => decodeStatus({}, { ...options, unlisted: "missing" })).toThrow(
      '"missing" is not one of',
    );
  });
});

describe("loadStatus", () => {
  test("reads the JSON file", () => {
    const file = join(directory, "status.json");
    writeFileSync(file, '{ "Frame": { "Show": "modelled" } }');
    const status = loadStatus({ ...options, file });
    expect(statusOf(status, { name: "Frame" }, "Show")?.level).toBe(modelled);
  });

  test("names the file when the JSON does not parse", () => {
    const file = join(directory, "broken.json");
    writeFileSync(file, "{ nope");
    expect(() => loadStatus({ ...options, file })).toThrow(`status file ${file}`);
  });
});

describe("unmatchedStatus", () => {
  test("lists modules and functions the API does not have", () => {
    const status = decodeStatus(
      { Frame: { Show: "modelled", Gone: "guessed" }, Missing: { Any: "guessed" } },
      options,
    );
    expect(unmatchedStatus(status, [moduleApi("Frame", ["Show"])])).toEqual([
      "Frame.Gone",
      "Missing",
    ]);
  });
});
