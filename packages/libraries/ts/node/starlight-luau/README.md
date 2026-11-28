# starlight-luau

A Starlight plugin that generates an API reference from Luau types. No doc comments are needed.

```ts
import starlightLuau from "starlight-luau";

starlight({
  title: "My library",
  plugins: [starlightLuau({ source: "../src" })],
});
```

It needs Luau's `luau-ast` executable on `PATH` at build time. See the
[repository README](https://github.com/Braden1996/starlight-luau#readme) for installation, options, prose files and
examples from tests.

For workspace setup and checks, see the [Sergeant setup playbooks](https://github.com/Braden1996/sergeant#readme).

MIT licensed.
