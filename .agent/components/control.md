# Control — Mental Model Card

**Status:** switch, radio group (with the segmented variant) and checkbox built.
Research: [VISIMORPH](../../prompts/VISIMORPH-RESEARCH.md),
[SEGMENTED-CONTROL](../../prompts/SEGMENTED-CONTROL-RESEARCH.md),
[RADIO-GROUP](../../prompts/RADIO-GROUP-RESEARCH.md),
[CHECKBOX](../../prompts/CHECKBOX-RESEARCH.md).

Control is the shared approach for the binary form controls: switch, radio
group, and checkbox. Each is CSS only. The native `<input>` draws itself with
`appearance: none` and `::before`. The browser holds all state. There is no
TS component.

```html
<label interop-switch><input type="checkbox" role="switch" name="dark"> Dark mode</label>

<fieldset interop-radio-group>
  <legend>Shipping</legend>
  <label><input type="radio" name="shipping" value="standard" checked> Standard</label>
  <label><input type="radio" name="shipping" value="express"> Express</label>
</fieldset>

<label interop-checkbox><input type="checkbox" name="terms"> Accept terms</label>
```

## Where the attribute goes

The identity attribute goes on the smallest element that is a complete control.

| Control | Complete control | Attribute |
|---|---|---|
| Switch | One labeled input | `label[interop-switch]` |
| Checkbox | One labeled input | `label[interop-checkbox]` |
| Radio | The set of same-`name` radios | `fieldset[interop-radio-group]`. Item labels carry no attribute |

A radio cannot be unchecked by the user, so a single radio is never a control.
The shared `name` gives the group its behavior: one checked radio, one tab stop,
arrow keys, group `required`, and form reset. The fieldset and legend name the
group.

A bare `<input>` outside these selectors keeps its native rendering.

## Files

```
projects/interop/<name>/
  interop-<name>.structure.css    label, input, pseudo-elements, states, forced colors; names list at the top
  interop-<name>.base.css         token values and size steps
  public-api.ts                   export {};  (CSS only, same as popover)
  ng-package.json
projects/interop/styles/fieldset.css   group layout shared by radio and checkbox groups
projects/interop/styles/outline.css    focus ring; every control's input is in its selector list
```

Folders: `switch/`, `radio-group/`, `checkbox/`. Each is imported as
`interop/<name>`, and its CSS from `interop.css`. Demo pages are in
`projects/demo/src/app/components/<name>/`.

## Selectors

| Control | Input selector |
|---|---|
| switch | `label[interop-switch] > input:is([role=switch], [switch])` |
| radio | `fieldset[interop-radio-group] label > input[type=radio]` |
| checkbox | `label[interop-checkbox] > input[type=checkbox]` |

`role="switch"` is the supported switch spelling. `[switch]` is matched because
Safari 17.4+ ships it. A switch input with neither keeps the native checkbox
look, so a missing role is visible.

The radio item selector is a descendant selector, so items can sit in lists or
other wrappers. A label in the group without a radio, such as an "Other" text
box, is not styled.

## State

| State | Selector | Effect |
|---|---|---|
| checked | `:checked` | fill changes; switch thumb moves to inline-end; radio dot scales in |
| indeterminate | `:indeterminate` | checkbox only, dash replaces check |
| disabled | `:disabled` | the label and its text take reduced opacity |
| focus | `:focus-visible` | outline on the input |
| hover | label `:hover` | the input's background and border only |

Every state comes from a pseudo-class. `form.reset()`, bfcache restore,
autofill, and `<fieldset disabled>` update the visual with no extra code.

Indeterminate is a DOM property. In Angular, bind it directly:
`[indeterminate]="some()"`. Do not set `aria-checked` on a native checkbox or
radio. Browsers report the state, and ARIA in HTML disallows it.

## Label

The label is the click target and the WCAG 2.5.8 measurement. Every control
lays out its label the same way:

- The label is `inline-block` with `position: relative`. Its text stays in
  normal flow, so links and other inline elements wrap with it.
- `padding-block: calc((min-block-size - 1lh) / 2)` puts one line of text in
  the middle of the minimum height. More lines grow the label downward.
- `padding-inline-start` reserves the control's width plus the gap.
- The input is `position: absolute` at the inline start, with
  `inset-block-start: calc((min-block-size - control height) / 2)`. That
  centers it on the first line of text, whatever the line count.

The control always sits at the inline start. The label has no background or
border of its own, and there are no layout modifiers.

## Group layout

`styles/fieldset.css` lays out `fieldset[interop-radio-group]` and
`fieldset[interop-checkbox-group]`: a flex column, no fieldset border or
padding, `min-inline-size: 0`, and a legend in the `p` role.
`--itx-fieldset-flex-direction: row` puts the options in a line. The legend is
spaced with padding because some engines ignore a legend's margin.

Put a hint or error under the legend and point `aria-describedby` on the
fieldset at it.

## Geometry

| Control | Drawing |
|---|---|
| Switch | The input is the track, a flex box. `::before` is the thumb. It moves by `margin-inline-start: calc(100% - thumb size)`, a logical property, so right-to-left needs no rule |
| Radio | The input is the circle (`--itx-radius-full`, round by shape). `::before` is the dot, centered with `inset: 0; margin: auto`, and `scale: 0` until checked |
| Checkbox | The input is the box. `::before` fills it and paints the mark through `mask-image`: a check, or a dash when `:indeterminate`. Indeterminate shares the checked fill and wins over checked, as native boxes do. A theme swaps the shape through the mask token |

## Tokens

Names follow `--itx-<component>[-<element>]-<css-property>[-<state>]`. Values
are declared on the element that carries the attribute. Override them there or
on a class that matches it. The structure file reads tokens with no fallbacks,
except state tokens, which fall back to the rest value. Each control has its
own family.

| Switch token | Default |
|---|---|
| `--itx-switch-gap`, `-min-block-size` | `--itx-space-2`, `--itx-space-10` |
| `--itx-switch-font-size`, `-line-height` | the `label` role |
| `--itx-switch-cursor[-disabled]`, `-opacity-disabled` | default, not-allowed, 0.5 |
| `--itx-switch-track-block-size` | `--itx-space-6` |
| `--itx-switch-track-inline-size`, `-padding`, `-border-width`, `-border-style`, `-border-radius` | 1.75 × track height, `--itx-space-0_5`, 1px, solid, full |
| `--itx-switch-track-border-color[-hover\|-checked]` | neutral-500/400, 600/300, transparent |
| `--itx-switch-track-background-color[-hover\|-checked\|-checked-hover]` | neutral-50/900, 100/800, 900/50, 700/200 |
| `--itx-switch-thumb-size`, `-border-radius` | track height − 2 × padding − 2 × border, full |
| `--itx-switch-thumb-background-color[-checked]` | neutral-500/400, 50/900 |
| `--itx-switch-transition-duration`, `-timing-function` | the shared transition tokens |

| Radio group token | Default |
|---|---|
| `--itx-radio-group-label-gap`, `-label-min-block-size` | `--itx-space-2`, `--itx-space-10` |
| `--itx-radio-group-label-font-size`, `-label-line-height` | the `label` role |
| `--itx-radio-group-label-cursor[-disabled]`, `-label-opacity-disabled` | default, not-allowed, 0.5 |
| `--itx-radio-group-circle-size`, `-circle-border-width`, `-circle-border-style` | `--itx-space-5`, 1px, solid |
| `--itx-radio-group-circle-border-color[-hover\|-checked]` | neutral-500/400, 600/300, transparent |
| `--itx-radio-group-circle-background-color[-hover\|-checked\|-checked-hover]` | neutral-50/900, 100/800, 900/50, 700/200 |
| `--itx-radio-group-dot-size`, `-dot-background-color` | `--itx-space-2`, neutral-50/900 |
| `--itx-radio-group-transition-duration`, `-timing-function` | the shared transition tokens |

| Checkbox token | Default |
|---|---|
| `--itx-checkbox-gap`, `-min-block-size` | `--itx-space-2`, `--itx-space-10` |
| `--itx-checkbox-font-size`, `-line-height` | the `label` role |
| `--itx-checkbox-cursor[-disabled]`, `-opacity-disabled` | default, not-allowed, 0.5 |
| `--itx-checkbox-box-size`, `-box-border-width`, `-box-border-style` | `--itx-space-5`, 1px, solid |
| `--itx-checkbox-box-border-radius`, `-box-corner-shape` | half the house radius, at most a quarter of the box; the house corner shape |
| `--itx-checkbox-box-border-color[-hover\|-checked]` | neutral-500/400, 600/300, transparent |
| `--itx-checkbox-box-background-color[-hover\|-checked\|-checked-hover]` | neutral-50/900, 100/800, 900/50, 700/200 |
| `--itx-checkbox-mark-mask-image[-indeterminate]` | an SVG check, an SVG dash |
| `--itx-checkbox-mark-background-color` | neutral-50/900 |
| `--itx-checkbox-transition-duration`, `-timing-function` | the shared transition tokens |

| Fieldset token | Default |
|---|---|
| `--itx-fieldset-flex-direction` | column |
| `--itx-fieldset-row-gap`, `-column-gap` | `--itx-space-0`, `--itx-space-6` |
| `--itx-fieldset-legend-font-size`, `-legend-line-height` | the `p` role |
| `--itx-fieldset-legend-padding-block-end` | `--itx-space-1` |

## Size

`itx-size="lg"` goes on the element that carries the attribute. There is no
`sm`.

| Control | Step | Indicator | Label min block size | Text |
|---|---|---|---|---|
| Switch | default | track 42 × 24px, thumb 18px | 40px | `label` role |
| Switch | `lg` | track 56 × 32px, thumb 26px | 48px | `p` role |
| Radio | default | circle 20px, dot 8px | 40px | `label` role |
| Radio | `lg` | circle 24px, dot 10px | 48px | `p` role |
| Checkbox | default | box 20px | 40px | `label` role |
| Checkbox | `lg` | box 24px | 48px | `p` role |

## Tests

- `styles/contrast.spec.ts`: 3:1 in both schemes for every unchecked border and
  checked fill against the page, and every thumb or dot against its fill, at
  rest and on hover.
- `styles/target-size.spec.ts`: every label minimum height at every size step
  is 24px or more.
- `a11y/a11y.spec.ts`: axe on every control and state, plus negative controls
  for an unlabeled switch, radio and checkbox. It asserts that an indeterminate
  box has no `aria-checked`.
- `src/bind-select-all.spec.ts`, `src/bind-radio-home-end.spec.ts`: the helpers.
- `styles/contrast.spec.ts` also checks segment text on the page and checked
  text on the pill at 4.5:1, and the frame and pill against the page at 3:1.
- `src/audit.spec.ts`: the dev audit rules below.

## Dev audit rules

| Rule | Flags |
|---|---|
| `control-name` | A control label with no text and no label on its input |
| `control-aria-checked` | `aria-checked` on a native checkbox or radio |
| `group-name` | A radio or checkbox group with no legend and no `aria-label` |
| `radio-group-shared-name` | Radios in a group with a missing or differing `name`. Angular's `formControlName` does not write `name`, so the consumer must |
| `radio-group-options` | A radio group with fewer than two radios |
| `checkbox-group-required` | A checkbox group where every box is `required`, which demands all of them |

## Checkbox groups

The platform covers most of a group: the legend names it, a shared `name`
submits every checked value, and `<fieldset disabled>` disables it. Two needs
are not native:

| Need | Help |
|---|---|
| Select-all | `bindSelectAll(parent, group?)` from `interop`. Checking the parent checks every enabled box; it shows mixed when some boxes are checked, counting disabled ones; it fires `input` and `change` on each box it changes; it follows form reset. A box changed from script fires no event, so dispatch `change` on it, or bind the parent from the same model in Angular. Returns an unbind function |
| "At least one" | `setCustomValidity()` on the first box whenever the group changes and after reset. In Angular, a validator in the form model. `required` on every box demands all of them |

Give a select-all box no `name`, so it does not submit.

## Media queries

| Query | Behavior |
|---|---|
| `forced-colors: active` | `forced-color-adjust: none` with system colors: rest `Canvas`/`CanvasText`, checked `Highlight`/`HighlightText`, disabled `GrayText`, focus ring `Highlight` |
| `prefers-reduced-motion: reduce` | The shared transition tokens are 0ms (`styles/transition.css`) |
| `prefers-contrast: more` | 2px border |

## Constraints

- Firefox creates `::before` on checkbox and radio only when `appearance: none`
  is set. Every structure file sets it.
- Focus never changes a control's size.
- A switch has no indeterminate state.
- `role="radiogroup"` is not added. Fieldset and legend are the robust group
  semantics. A consumer may add the role.

## Segmented control

`interop-radio-group="segmented"` draws the radio group as a row of equal
segments in a frame, with a pill on the checked one. It is the same radio
group: one value, one tab stop, arrow keys, form participation, and the same
dev audit rules. It has its own demo page. Use it to choose a value or a view of
the same content; tabs switch between different sections.

```html
<fieldset interop-radio-group="segmented" itx-size="sm">
  <legend>View</legend>
  <label><input type="radio" name="view" value="list" checked> List</label>
  <label><input type="radio" name="view" value="grid"> Grid</label>
</fieldset>
```

| Part | How |
|---|---|
| Layout | The fieldset is an `inline-grid` with `grid-auto-columns: 1fr`, so every segment is as wide as the widest label. The labels are direct children |
| Segment | The label. The input is transparent and fills it (`inset: 0`), so it takes the clicks and the focus ring |
| Frame | `fieldset::before`, anchored from the first segment's start to the last segment's end with logical `anchor()` sides, outset by the frame padding and border. The legend stays outside it with no wrapper |
| Pill | `fieldset::after`, anchored to the checked segment. In Chromium it slides when the selection changes, with the shared transition tokens. Firefox and Safari move it without the slide: they do not transition an inset when its anchor changes |
| Divider | `label::before` between two unchecked segments |
| Focus ring | Inside the segment. On the pill it takes the checked text color, which contrasts with the pill |
| Fallback | Without anchor positioning, each segment draws its own border and the checked one paints the pill color |
| Icons | `interop-radio-group="segmented icon"` makes square segments. Name each with visually hidden text in the label |
| Radius | The frame takes the house radius; the pill and the focus ring take the nested radius, the frame's less its padding and border |

Anchor names are found only inside the fieldset, because the fieldset is the
positioned containing block, so several controls on one page do not collide.

| Size | Control height | Text |
|---|---|---|
| `sm` | 32px | `p-sm` role |
| default | 40px | `p` role |
| `lg` | 48px | `p-lg` role |

These match the button's steps, so a segmented control lines up with the
buttons beside it.

The look lives in `styles/segmented.css`, shared with tabs. Each of its rules
lists the container, segment and selected segment of every component that wears
it. The radio group's structure file keeps only the radio half: the input that
fills its label, and the focus ring on it.

| Segmented token | Default |
|---|---|
| `--itx-segmented-block-size` | `--itx-space-10`; `sm` `--itx-space-8`, `lg` `--itx-space-12` |
| `--itx-segmented-segment-block-size` | the block size less the frame padding and border on both sides |
| `--itx-segmented-segment-padding-inline` | `--itx-space-4`; `sm` `--itx-space-3`, `lg` `--itx-space-5` |
| `--itx-segmented-segment-font-size`, `-segment-line-height` | `p`; `sm` `p-sm`, `lg` `p-lg` |
| `--itx-segmented-segment-color[-hover\|-selected]` | neutral-700/300, 950/50, 50/900 |
| `--itx-segmented-segment-opacity-disabled` | 0.5 |
| `--itx-segmented-frame-padding`, `-frame-border-width`, `-frame-border-color` | `--itx-space-0_5`, 1px, neutral-500/400 |
| `--itx-segmented-pill-background-color` | neutral-900/50 |
| `--itx-segmented-divider-width`, `-divider-inset-block`, `-divider-color` | 1px, `--itx-space-2`, neutral-300/700 |
| `--itx-segmented-transition-duration`, `-transition-timing-function` | the shared transition tokens |

Anchor names are `--itx-segmented-first`, `--itx-segmented-last` and
`--itx-segmented-selected`.

`bindRadioHomeEnd(root)` from `interop` adds Home and End to any radio group:
they focus and check the first or last enabled radio with the same name. It is
optional, ignores the keys when a modifier is held, and returns an unbind
function.

## Angular

Angular forms need no Interop code. `[(ngModel)]` and `formControlName` use
Angular's built-in checkbox and radio accessors on the native input, and
Signal Forms bind it too. Radios also need `name`. A `FormsModule` import adds
`novalidate` to every form; `ngNativeValidate` keeps the browser's validation.

## When a TS component is warranted

None ships until a concrete need exists. A component added then wraps this
markup. It does not mirror input state into another element. See
[visimorph.md](visimorph.md) for why.
