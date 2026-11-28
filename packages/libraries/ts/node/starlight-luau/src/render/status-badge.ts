import type { ModuleApi } from "../model/module-api.ts";
import type { ApiStatus, FunctionStatus, StatusLevel } from "../status/api-status.ts";
import { statusOf } from "../status/api-status.ts";
import { escapeHtml } from "./html.ts";
import { paragraph } from "./markdown.ts";

export function statusBadge(level: StatusLevel): string {
  const title = level.description === undefined ? "" : ` title="${escapeHtml(level.description)}"`;
  return `<span class="sl-luau-status sl-luau-status-${level.tone}" data-status="${escapeHtml(level.id)}"${title}>${escapeHtml(level.label)}</span>`;
}

export function statusLine(status: FunctionStatus | undefined): string | undefined {
  if (status === undefined) {
    return undefined;
  }
  const note = status.note === undefined ? "" : ` ${escapeHtml(status.note)}`;
  return paragraph(`${statusBadge(status.level)}${note}`, "sl-luau-status-line");
}

export function moduleStatusCounts(
  status: ApiStatus,
  module: ModuleApi,
): ReadonlyArray<{ readonly level: StatusLevel; readonly count: number }> {
  const levels = module.functions.flatMap((entry) => {
    const found = statusOf(status, module, entry.name);
    return found === undefined ? [] : [found.level.id];
  });
  return status.levels
    .map((level) => ({ level, count: levels.filter((id) => id === level.id).length }))
    .filter(({ count }) => count > 0);
}

export function moduleStatusSummary(status: ApiStatus, module: ModuleApi): string {
  return moduleStatusCounts(status, module)
    .map(({ level, count }) => `${statusBadge(level)} ${String(count)}`)
    .join(" ");
}

export function statusLegend(status: ApiStatus): string {
  const rows = status.levels.map(
    (level) => `<tr><td>${statusBadge(level)}</td><td>${escapeHtml(level.description ?? "")}</td></tr>`,
  );
  return [
    '<table class="sl-luau-status-legend">',
    "<thead><tr><th>Status</th><th>Meaning</th></tr></thead>",
    `<tbody>${rows.join("")}</tbody>`,
    "</table>",
  ].join("\n");
}
