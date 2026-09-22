# Component style generator

Interop rebuilt, starting with how a component receives its styles. Early exploration —
nothing here is settled, and the two blueprints are written fresh rather than ported.

## How it works

A blueprint declares which levers a component has. Values live in `interop.config.json`.
Everything shipped is generated from the two together.

```
vocabulary  ──┐
              ├── resolve ──┬── structure.css    rules that read tokens
blueprint   ──┤             ├── theme.css        token declarations
              │             ├── properties.css   @property registrations
config      ──┘             ├── manifest.json    every token, for tooling
                            └── docs.md          the lever tables
```

## Running it

```sh
node src/build.ts           # write src/generated/
node src/build.ts --check   # fail if anything on disk differs from a fresh build
node --test src/system/*.test.ts
npx tsc -p tsconfig.json --noEmit
open harness/index.html
```

No dependencies and no build step. Node runs the TypeScript directly.

## Rules

**Structure is what config cannot change; theme is what it can.** A component with no levers
gets a structure file and no theme file.

**Variants and sizes are declaration scopes.** There is one `--itx-button-background-color`,
redeclared under `[itx-variant="danger"]`. Axis values do not appear in token names.

**The config names the axis values.** `vocabulary.ts` fixes the axes and their attributes;
every value under `variants` or `sizes` is an exception, and an element carrying neither
attribute takes the base. A component with no named exceptions has no axes.

**A lever carries its own statefulness and its own prerequisites.** `outline-width` is
stateful and pulls in `outline-style: solid`; `border-width` is neither, because a border that
thickens on hover moves the layout around it.

**A stateful lever is read as `var(--x-hover, var(--x))`.** An unset state token falls through
to the base.

**Category conditionals happen at build time, value conditionals in the cascade.** Disabling a
category drops its tokens from the output. Changing a value needs no rebuild.

**One lever per CSS property.** Shorthands are composed where they are read.

## Two rejected values

`--x: null` sets the token to the characters `null`. The consuming declaration goes
invalid-at-computed-value-time, which resolves to `transparent` for `background-color` and
*inherits* for `color`.

`--x: inherit` inherits the token from the parent element. It does not mean "same as the base".

`src/system/lint.ts` catches both, reading the emitted CSS rather than the model.

## The CLI seam

There is no CLI. Two constraints keep it a later addition:

- It reads `manifest.json`, edits `interop.config.json`, and calls `build()`. It does not
  write CSS.
- The config stays plain data, so a value can be read, changed, and written back.

## Not modeled

**Orchestrator components** — those that render mandatory children. `parts` covers
sub-elements within one component, not children a component owns.

**State-dependent mechanics.** Mechanics are emitted once. `cursor: pointer` stays `pointer`
on a disabled button.

**Motion.** No levers yet.

**Resetting an axis.** A scope that sets `itx-size="lg"` on an ancestor cannot be overridden
back to the base from inside it. There is no value meaning "the default", because the default
has no name.
