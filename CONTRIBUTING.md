# Contributing

## Setup

Install the tools with [mise](https://mise.jdx.dev). The two Sergeant config tarballs pinned in
`package.json` live in `../sergeant/dist/npm/`. Pack them from a sibling Sergeant v0.15.0 checkout or fetch
the published versions with `npm pack`.

```sh
mise install
mise exec -- sgt install
mise exec -- sgt doctor
mise exec -- sgt check
mise exec -- sgt test
mise exec -- sgt build
```

See the [Sergeant setup playbooks](https://github.com/Braden1996/sergeant#readme) for the workspace conventions.

## Style

- Use descriptive names and small functions. Keep tests beside the code and use real `luau-ast` output to cover Luau syntax.
- Decode unknown JSON with the readers in `src/ast/json-node.ts`.
- Add fixture cases in `fixtures/src`. When generated pages intentionally change, run `sgt run snapshots` and review the diff in `fixtures/expected/`.

## Pull requests

Use a Conventional Commits title such as `fix(render): handle empty signatures`. Add a line under
"Unreleased" in [CHANGELOG.md](CHANGELOG.md) for user-visible changes.

## Releases

1. Bump `version` in `packages/libraries/ts/node/starlight-luau/package.json`.
2. Move the "Unreleased" notes into a version section in `CHANGELOG.md`.
3. Run `sgt run banner` and merge the changes.
4. Tag `vX.Y.Z` on `main` and push the tag. To dispatch the workflow manually, select the release tag as its ref.

The release workflow runs the same checks as CI, validates the tag against the package manifest, and smoke-tests a
fresh install of the tarball. It attaches the tarball and checksum to the GitHub release and publishes to npm using
trusted publishing.
