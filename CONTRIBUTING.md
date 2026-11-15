# Contributing

Thank you for helping. This page covers setup, the checks, and the house style.

## Setup

1. Install [mise](https://mise.jdx.dev). It installs every pinned tool, including Bun, Node, moon, Luau (`luau-ast`)
   and luau-lsp:

   ```sh
   mise install
   mise exec -- bun install
   mise exec -- lefthook install
   ```

2. Run the gate. CI runs the same command from a cold cache:

   ```sh
   mise exec -- moon run :check
   ```

## Style

- **No code comments.** Use descriptive names and small functions instead. If something needs explaining, it needs a
  better name or a test.
- **Colocated tests.** Every `x.ts` has an `x.test.ts` beside it. Test case by case, with real `luau-ast` output, not
  hand-written JSON.
- **Strict types.** The TypeScript config is the strictest available, checked by tsrs. Do not use `any`, non-null
  assertions or unchecked casts; decode unknown JSON with the readers in `src/ast/json-node.ts`.
- **Fixtures.** New Luau syntax gets a case in `fixtures/src` (which must pass `moon run fixtures:check`). Regenerate
  `fixtures/expected` with `bun run snapshots` in `packages/starlight-luau`, then review the diff.

## Pull requests

- One concern per pull request.
- The title becomes the squash commit: `type(scope): summary`. Types: feat fix perf refactor test docs build ci chore
  style revert. Scopes: parse link render examples prose plugin fixtures demo ci docs deps repo.
- Add a line under "Unreleased" in `CHANGELOG.md` when users will notice the change.

## Releases

1. Bump `version` in `packages/starlight-luau/package.json`.
2. Move the "Unreleased" notes into a version section in `CHANGELOG.md`.
3. Run `bun run banner` in `packages/starlight-luau`, then merge.
4. Tag `vX.Y.Z` on `main` and push the tag.

The release workflow re-runs the gate, checks that the tag matches the version, packs the tarball, and attaches it
with its checksum to a GitHub release. It then publishes the same tarball to npm through trusted publishing (OIDC,
with provenance), so the repository holds no npm token.
