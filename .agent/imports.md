# Interop — Import Hygiene

## Icons: import the individual file, never the iconset barrel

`iconsets/tabler/index.ts` (and `phosphor`) is a **~10k-line barrel** that
re-exports thousands of icon definitions. Importing a single icon from it drags
that whole module graph into the consuming chunk — bloating dev cold-start,
slowing the build, and (for lazy routes) making the first load flash/re-optimise.

**Always import the one icon from its own file:**

```ts
// ✗ barrel — pulls thousands of icons
import { TablerSearch } from "../../iconsets/tabler";
import { TablerReload } from "interop/lib/iconsets/tabler";

// ✓ direct — pulls exactly one file
import { TablerSearch } from "../../iconsets/tabler/outline/tabler-search";
import { TablerReload } from "interop/lib/iconsets/tabler/outline/tabler-reload";
```

### Name → path mapping

| Icon export | File |
|---|---|
| `TablerSearch` | `iconsets/tabler/outline/tabler-search` |
| `TablerAlertTriangleFilled` | `iconsets/tabler/filled/tabler-alert-triangle-filled` |

- Path segment is the export name **kebab-cased**, minus the `Tabler` prefix.
- `*Filled` exports live under `filled/…-filled`; everything else under `outline/`.
- Library code uses the relative path (`../../iconsets/tabler/outline/…`); demo/consumer
  code uses `interop/lib/iconsets/tabler/outline/…` (resolves via the `interop/*`
  tsconfig path). One icon per import line — don't group into a shared barrel.

The established components already do this (composites, stepper). Command-palette
and toast were the stragglers, now conformed.

## General rule

Prefer the **narrowest module that exports the symbol** over a convenience barrel,
whenever the barrel is large or pulls unrelated code. Barrels are fine for small,
cohesive public surfaces (a component's `public-api.ts`); they are a liability when
they front hundreds/thousands of independent definitions.
