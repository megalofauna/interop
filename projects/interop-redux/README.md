# Component style generator

Interop rebuilt, starting with how a component receives its styles. Early exploration —
nothing here is settled, and the two blueprints are written fresh rather than ported.

## How it works

A blueprint declares which levers a component has. Values live in `interop.config.json`.
Everything shipped is generated from the two together.

```ts
export const button: Blueprint = {
	name: 'button',
	selector: ':where(button[interop-button])',
	themeable: true,
	prerequisites: ['box-sizing: border-box'],
	sizes: ['sm', 'base', 'lg'],
	states: ['hover', 'focus-visible', 'active', 'disabled'],
	cursor: ['cursor'],
	properties: { paint: ['background-color', 'text-color'] /* … */ },
	elements: {
		icon: { selector: ' > :where([interop-icon])', properties: { paint: ['text-color'] } },
	},
};
```

| Field | Holds |
| --- | --- |
| `selector` | The component's attribute selector, inside `:where()` for zero specificity. |
| `properties` | Levers, filed by category: `layout shape border outline type paint effect`. |
| `elements` | Sub-elements, each with a selector appended to the component's and its own `properties`. |
| `prerequisites` | Declarations config cannot reach. They lead the base rule. |
| `sizes` | The size axis values, `base` among them. Absent: not sizable. |
| `states` | The states the component responds to. |
| `cursor` | The `cursor` category. Only on a component with `states`. |

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

**The config names the variants.** `vocabulary.ts` fixes the axes and their attributes. Every
value under `variants` is an exception, and an element carrying no `itx-variant` takes the base.

**The blueprint names the sizes.** A non-empty `sizes` includes `base`. The config gives every
other size its tokens under `sizes`; a listed size with no entry fails the build, as an
unvalued base token does. The config may not name `base` or a size the blueprint does not
list.

**`base` is the explicit reset.** It is the same as no `itx-size` attribute. It emits no
scope, and axis scopes match on the element itself, so `itx-size="base"` matches no size scope
and the element takes the base values.

**A lever carries its own statefulness and the declarations it requires.** `outline-width` is
stateful and pulls in `outline-style: solid`. `border-width` is neither, because a border that
thickens on hover moves the layout around it. It requires `border-style: solid`, which is
skipped when `border-style` is a lever on the same scope.

**The cursor belongs to a stateful component.** It is read under every state like any stateful
lever, so `--itx-button-cursor-disabled: not-allowed` replaces the pointer on a disabled button.
It is unregistered, so any cursor value is accepted.

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

**Orchestrator components** — those that render mandatory children. `elements` covers
sub-elements within one component, not children a component owns.

**Motion.** No levers yet.
