import { afterEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { MARKER_FILE, UnsafeOutputError, writePages } from "./write-pages.ts";

const roots: string[] = [];

function freshDirectory(): string {
  const root = mkdtempSync(join(tmpdir(), "starlight-luau-write-"));
  roots.push(root);
  return join(root, "api");
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

describe("writePages", () => {
  test("writes pages, nested folders and the marker into a new folder", () => {
    const directory = freshDirectory();
    writePages(directory, [
      { path: "index.md", content: "index" },
      { path: "net/http.md", content: "http" },
    ]);
    expect(readFileSync(join(directory, "net", "http.md"), "utf8")).toBe("http");
    expect(existsSync(join(directory, MARKER_FILE))).toBe(true);
  });

  test("replaces its own earlier output, removing stale pages", () => {
    const directory = freshDirectory();
    writePages(directory, [{ path: "old.md", content: "old" }]);
    writePages(directory, [{ path: "new.md", content: "new" }]);
    expect(existsSync(join(directory, "old.md"))).toBe(false);
    expect(existsSync(join(directory, "new.md"))).toBe(true);
  });

  test("refuses to replace a folder of hand-written pages", () => {
    const directory = freshDirectory();
    mkdirSync(directory, { recursive: true });
    writeFileSync(join(directory, "guide.md"), "mine");
    expect(() => writePages(directory, [])).toThrow(UnsafeOutputError);
    expect(readFileSync(join(directory, "guide.md"), "utf8")).toBe("mine");
  });
});
