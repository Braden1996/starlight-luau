# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- The stylesheet's rules are in a `starlight-luau` cascade layer, after Starlight's, so a theme such as
  starlight-warcraft can restyle signatures and badges without `!important` or an unlayered file.

## [0.2.0] - 2026-11-16

### Added

- Status badges: the `status` option reads a JSON file of per-function levels that you define, such as how much of
  each function an emulator implements. Function sections show a badge and note; the overview counts levels per
  module and adds a legend.

### Changed

- Releases are published to npm as `starlight-luau`, with provenance, as well as to GitHub releases.

## [0.1.0] - 2026-11-15

### Added

- The `starlight-luau` Starlight plugin. It generates one API page per Luau module, plus an overview, from types
  alone. It adds a sidebar group and its stylesheet, and watches sources during `astro dev`.
- Parsing through Luau's own `luau-ast`, with `read`/`write` modifiers and type-function headers recovered from source
  tokens.
- Rendering of functions, methods, aliases and type functions; generics, generic packs and defaults; unions,
  optionals, intersections, tables, indexers, arrays, function types, type packs, singletons and `typeof`.
- Cross-module type links through `require("./Module")`, variants tables for tagged unions, and notes for generics
  read through type-function aliases such as `OkOf<R>`.
- Optional hand-written prose per module, function or type, with warnings for prose that matches nothing.
- Examples from colocated unit tests: test names as behaviour descriptions and test bodies as code.
- `generateApi`, for building pages without the plugin.

[Unreleased]: https://github.com/Braden1996/starlight-luau/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/Braden1996/starlight-luau/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/Braden1996/starlight-luau/releases/tag/v0.1.0
