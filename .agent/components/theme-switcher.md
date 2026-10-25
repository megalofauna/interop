# Theme switcher — Mental Model Card

A pattern: Light, Dark and System as a segmented radio group, with
`bindColorScheme()`. The demo page is `projects/demo/src/app/patterns/theme-switcher/`
(`/patterns/theme-switcher`), and the site header uses it.

## Files

```
projects/interop/styles/color.css             the root color-scheme rules, first in the file
projects/interop/src/bind-color-scheme.ts     bindColorScheme()
projects/interop/color-scheme/color-scheme.ts InteropColorScheme, fieldset[interopColorScheme]
```

## How it works

- `interop.css` declares `color-scheme: light dark` on the root, so every
  `light-dark()` color follows the system with no script. Without it a page
  resolves every pair to its light value.
- `itx-color-scheme="light"` or `"dark"` on the root picks one.
- `bindColorScheme(fieldset)`:
  - a radio with value `light` or `dark` sets the attribute and stores it in
    `localStorage` under `itx-color-scheme`; any other value (`system`) removes
    both;
  - on bind it checks the stored scheme's radio;
  - it follows the root attribute (a MutationObserver), so several switchers on
    one page stay in step, and `storage` events, so other tabs do;
  - storage that throws (some private modes) leaves the choice for the page's
    life only.
- A blocking script in `<head>` sets the stored attribute before first paint;
  `<meta name="color-scheme" content="light dark">` paints the canvas right
  before CSS loads. Both are on the demo's `index.html` and the pattern page.

## Accessibility rules

- Three options, System first in meaning and the default. A two-state toggle
  loses System.
- The group's name is "Theme" (a visually hidden legend in the header) and
  never changes. Text labels; icons only beside them, `aria-hidden`.
- No live region: a radio change is already announced.
- If two states are required: `<button aria-pressed>` with a fixed name
  ("Dark theme"). Not `role="switch"`, not an icon alone.
- Component CSS never uses `@media (prefers-color-scheme)`: it would ignore the
  switcher.

## Tests

- `src/bind-color-scheme.spec.ts`: default, set and remember, back to System,
  stored scheme on bind, unknown stored value, another tab, another switcher or
  a script, unbinding. Node's own `localStorage` global has no methods under
  test, so the spec stubs an in-memory one.
- Chrome 155, on the demo: Space on Dark sets `dark`, the canvas turns
  neutral-900, a reload with the system light keeps dark, System clears it; the
  page's switcher and the header's stay in step; page checks pass.
- Not yet tested: Firefox and Safari, a flash on a slow reload, speech output.

## Research

Tailwind, MDN, Geist, shadcn and Starlight ship three options with System as
the default; Soueidan and Rutter use radios; Roselli and Giraudel use
`aria-pressed` with a fixed name where only two states fit. The Web Preferences
API (`navigator.preferences.colorScheme.requestOverride()`) was retired into
Media Queries 5 and is not in Chrome 155.
