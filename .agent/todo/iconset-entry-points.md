# TODO — Iconsets need secondary entry points to be consumable

**Status:** deferred, needs its own branch
**Raised:** 2026-08-11, during the Material Symbols round (ITX-24)

## The problem

No iconset is reachable from the published package. `dist/interop/package.json`
declares an `exports` map with exactly two subpaths:

```json
"exports": {
  ".":                   { "default": "./fesm2022/interop.mjs" },
  "./highlighters/shiki": { "default": "./fesm2022/interop-highlighters-shiki.mjs" }
}
```

An `exports` field makes every *unlisted* subpath hard-fail, so the documented
import throws for anyone installing from npm:

```ts
import { TablerCamera } from "interop/lib/iconsets/tabler/outline/tabler-camera";
```

It works in-repo only because `tsconfig.json` maps `"interop/*"` →
`"projects/interop/src/*"`, i.e. straight to source. The demo has never
exercised the published path.

This predates Material Symbols and applies identically to Tabler and Phosphor —
roughly 19,000 icon modules, none of them shippable.

## Why the cheap fix doesn't exist

**Thin re-export entry points don't work.** Attempted and rejected by ng-packagr:

```
error TS6059: File '…/src/lib/iconsets/material-symbols/sharp/index.ts' is not under
rootDir '…/iconsets/material-symbols/sharp/src'. 'rootDir' is expected to contain all source files.
```

An entry point must physically contain its sources, so this cannot be a shim
layer over the existing tree — the icons have to move.

**Exporting icons from the primary entry point is not an option either.** It
would put ~19,000 modules into one FESM bundle for every consumer, which is
what `iconsets/public-api.ts` already refuses on tree-shaking grounds.

## Scope

1. Generator writes to `projects/interop/iconsets/<set>/<variant>/src/`, and
   emits an `ng-package.json` per variant (7 entry points: phosphor
   regular/fill/duotone, tabler outline/filled, material-symbols
   sharp/sharp-fill).
2. **Change the emitted `core` import.** Every icon file currently does
   `import type { InteropIconDefinition } from "../../core"`. `core` stays in
   the primary entry point, so from a secondary entry point that relative reach
   is illegal — it has to become `from "interop"`. One generator line, 19,000
   emitted files, and it adds a dependency edge from each icon entry point back
   to the primary.
3. **Decide what happens to the set-level barrels.** `iconsets/<set>/index.ts`
   re-exports every variant and holds the bulk `provide<Set><Variant>Icons()`
   functions. Those span entry points and cannot survive unchanged. Either drop
   them, or give each set its own entry point that depends on its variants.
4. Move ~19,000 files.
5. Update 27 import lines across 11 files (10 demo, 1 `projects/interop/src/public-api.ts`).
6. Verify all 7 FESM bundles build, and measure the hit — `build:lib` is
   currently ~3.8s.

## Notes

- Do it on its own branch. The diff is unreviewable by eye, so the value is in
  the generator diff plus a green build, not in reading the moved files.
- Land the generator change and one set first, confirm the published subpath
  actually resolves from a packed tarball (`npm pack` + install into a scratch
  app), then do the rest.
- Update `iconsets/public-api.ts` docs and `.agent/imports.md` when the real
  import paths change.
