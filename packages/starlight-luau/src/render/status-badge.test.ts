import { describe, expect, test } from "bun:test";

import type { FunctionEntry, ModuleApi } from "../model/module-api.ts";
import type { StatusLevel } from "../status/api-status.ts";
import { decodeStatus } from "../status/api-status.ts";
import {
  moduleStatusCounts,
  moduleStatusSummary,
  statusBadge,
  statusLegend,
  statusLine,
} from "./status-badge.ts";

const modelled: StatusLevel = {
  id: "modelled",
  label: "Modelled",
  tone: "success",
  description: "Behaves like the game.",
};
const notFaked: StatusLevel = {
  id: "not-faked",
  label: "Not <faked>",
  tone: "danger",
  description: undefined,
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

const frame: ModuleApi = {
  name: "Frame",
  file: "Frame.luau",
  requires: new Map(),
  types: [],
  functions: ["Show", "Hide", "SetAlpha"].map(functionEntry),
};

describe("statusBadge", () => {
  test("renders the label with the tone class, the level id and the description as a tooltip", () => {
    expect(statusBadge(modelled)).toBe(
      '<span class="sl-luau-status sl-luau-status-success" data-status="modelled" title="Behaves like the game.">Modelled</span>',
    );
  });

  test("escapes the label and leaves out an absent description", () => {
    expect(statusBadge(notFaked)).toBe(
      '<span class="sl-luau-status sl-luau-status-danger" data-status="not-faked">Not &lt;faked&gt;</span>',
    );
  });
});

describe("statusLine", () => {
  test("is absent without a status, and carries the escaped note when there is one", () => {
    expect(statusLine(undefined)).toBeUndefined();
    expect(statusLine({ level: modelled, note: "Ignores <alpha>." })).toBe(
      `<p class="sl-luau-status-line">${statusBadge(modelled)} Ignores &lt;alpha&gt;.</p>`,
    );
  });
});

describe("module summaries", () => {
  const status = decodeStatus(
    { Frame: { Show: "modelled", Hide: "modelled" } },
    { file: "status.json", levels: [modelled, notFaked], unlisted: "not-faked" },
  );

  test("count each level in level order, leaving out levels with no functions", () => {
    expect(moduleStatusCounts(status, frame)).toEqual([
      { level: modelled, count: 2 },
      { level: notFaked, count: 1 },
    ]);
    expect(moduleStatusCounts(status, { ...frame, functions: [] })).toEqual([]);
  });

  test("render as badges followed by counts", () => {
    expect(moduleStatusSummary(status, frame)).toBe(
      `${statusBadge(modelled)} 2 ${statusBadge(notFaked)} 1`,
    );
  });

  test("come with a legend of every level", () => {
    const legend = statusLegend(status);
    expect(legend).toContain(
      `<tr><td>${statusBadge(modelled)}</td><td>Behaves like the game.</td></tr>`,
    );
    expect(legend).toContain(`<tr><td>${statusBadge(notFaked)}</td><td></td></tr>`);
  });
});
