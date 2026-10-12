# InteropVisimorph — Retired

Replaced by [control.md](control.md). The deprecated source is in
`projects/interop_deprecated/src/lib/components/interop-visimorph/`, with CSS
in `styles/components/visimorph/` and `styles/themes/protocol/components/visimorph/`.
Full review: [prompts/VISIMORPH-RESEARCH.md](../../prompts/VISIMORPH-RESEARCH.md).

## What it was

`<interop-visimorph>` was an `aria-hidden` decorative element rendered beside
a visually hidden native `<input>` in `interop-checkbox`, `interop-radio` and
`interop-toggle`. The parent control passed `type`, `checked`, `indeterminate`,
`disabled` and `focused` in as inputs. The element reflected them to `data-*`
attributes that the CSS read.

## Why it is not rebuilt

It held a second copy of state the input already holds. The copies disagree
whenever the input changes without the parent's signal changing:

- A click on an unbound toggle or radio.
- A click on an indeterminate checkbox. The browser clears `.indeterminate`;
  the signal stays `true`.
- `form.reset()`, bfcache restore, autofill.
- `<fieldset disabled>`.
- A parent that does not wire `[focused]`. No focus ring appears.

Drawing the indicator on the input and reading pseudo-classes removes every
case. Do not reintroduce a decorative element that receives state as inputs.
