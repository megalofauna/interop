# Interop — CSS strategy

How the canonical library's stylesheets are written. The rules that apply to
everything else, such as names, size steps and corners, are in
[playbook.md](playbook.md).

## Two files per component

| File | Holds |
|---|---|
| `interop-<name>.structure.css` | Selectors and properties: layout, display, states, pseudo-elements, `@supports`, `@container`, forced colors. Every value reads a token |
| `interop-<name>.base.css` | The tokens' values, and the size steps that reassign them |

A theme overrides a component by declaring the same tokens on the same
selector in its own stylesheet. `interop.css` imports every file: foundations
in `styles/`, then each component's base and structure, then the shared looks
(`segmented.css`, `cards.css`, `chips.css`), which override item layout and so
load last.

## Selectors

- Every selector is wrapped in `:where()`, so it has zero specificity and any
  page rule wins.
- A pseudo-element goes outside: `:where(select[interop-select])::picker(select)`.
  Inside `:where()` it is dropped.
- A selector a browser may not know (`::picker(select)`, `:open`,
  `::details-content`) sits in its own rule, usually inside `@supports`: one
  unknown selector drops the whole rule.
- States come from the platform: `:checked`, `:disabled`, `:user-invalid`,
  `:popover-open`, `:open`, `[aria-pressed="true"]`, `[aria-invalid="true"]`.

## Tokens

- Declared on the component's own selector, read in the structure file with
  `var()`. No fallbacks, except a state token falling back to its rest token:
  `var(--itx-button-color-hover, var(--itx-button-color))`.
- Colors are neutral pairs, `light-dark(var(--itx-neutral-900),
  var(--itx-neutral-50))`; `styles/contrast.spec.ts` measures every pair that
  carries text, an edge or a state.
- Lengths come from `--itx-space-*`, text sizes from the typography roles,
  durations from the shared transition tokens, corners from the four corner
  rules.

## Shared rules

| Concern | One home |
|---|---|
| Focus ring, its color and offset, in every mode | `styles/outline.css` |
| Reduced motion | `styles/transition.css` zeroes the shared durations |
| Corner radius and `itx-radius` | `styles/radius.css` |
| Fieldset layout for groups | `styles/fieldset.css` |
| Visually hidden text | `styles/visually-hidden.css` (`itx-visually-hidden`) |

## Guards

`styles/*.spec.ts` read the stylesheets as text: contrast, target size, radius,
forced colors and motion. See Style guards in the playbook.
