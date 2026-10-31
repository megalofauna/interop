# Button — Mental Model Card

A button is a native `<button interop-button>` or `<summary interop-button>`
with the house look. CSS only. State lives in native attributes: `disabled`,
`aria-disabled`, `aria-busy`, `aria-pressed`, and `open` on a disclosure's
`<details>`. Behavior is three small functions in `interop` and one Angular
directive in `interop/invoker`.

```html
<button interop-button type="button">Save</button>
<button interop-button type="button" itx-size="sm"><svg interop-icon name="tabler-copy"></svg>Copy</button>
<button interop-button type="button" aria-pressed="false">Bold</button>
<button interop-button type="button" commandfor="confirm" command="show-modal">Delete…</button>
```

## Files

```
projects/interop/button/
  interop-button.structure.css   layout, states, busy spinner, forced colors, coarse-pointer floor
  interop-button.base.css        token values and size steps
  interop-button.ts              empty
  public-api.ts                  empty: CSS only
projects/interop/invoker/invoker.ts             InteropInvoker: commandFor, popoverTarget, pendingAction
projects/interop/src/bind-pending-action.ts     bindPendingAction()
projects/interop/src/guard-activation.ts        guardActivation()
projects/interop/styles/outline.css             the shared focus ring
```

The demo page is `projects/demo/src/app/components/button/`.

## States

| State | Markup | Look |
|---|---|---|
| Rest | | Fill neutral-100/800, 1px border neutral-300/700, text neutral-900/50 |
| Hover | | Fill neutral-200/700. Skipped while active, disabled, `aria-disabled` or busy |
| Active | | Fill neutral-300/600 |
| Focus | `:focus-visible` | The shared ring: 2px solid, 2px offset |
| Pressed | `aria-pressed="true"`, or the `<summary>` of an open `<details>` | The active fill, and the border takes the text color and doubles with an inset shadow. Measures 3:1 against the rest border and the page (WCAG 1.4.11, tested) |
| Disabled | `disabled` or `aria-disabled="true"` | 50% opacity, `cursor: not-allowed` |
| Busy | `aria-busy="true"` | The label stays in place, transparent, so the name and width do not change. A 1em spinner in the text color turns once per 0.75s (1.5s with reduced motion). `cursor: progress`. Full opacity, even with `aria-disabled` |
| Forced colors, pressed | | `Highlight` fill and border, `HighlightText` text |

A `<summary interop-button>` draws no disclosure marker.

## Behavior

| Job | How |
|---|---|
| Icon button | `interop-button="icon"`: square at every size (`aspect-ratio: 1`, no inline padding), icon centered. The minimum height carries to the width, so the 44px touch floor keeps it square. CSS cannot tell an icon-only button from one with text (`:has()` does not see text nodes), so the author marks it |
| Icon size | Every icon in a button is 16, 20 or 24px at `sm`, default and `lg`: the button sets `--itx-icon-size` from the icon scale. An icon's own `itx-size` or `size` wins |
| Name | Visible text, or `aria-label` on an icon-only button. An icon beside text is hidden on its own (see [icon.md](icon.md)). A label tooltip can name an icon-only button (see [tooltip.md](tooltip.md)) |
| Type | `type="button"` unless it submits. A button in a form with no type submits it |
| Toggle | `aria-pressed="true"` or `"false"`. The label stays the same; the state is the attribute |
| Unavailable but focusable | `aria-disabled="true"`. The button stays in the tab order and still receives clicks, so `guardActivation()` must be installed |
| Open a dialog or popover | Invoker commands: `commandfor` and `command`, or `popovertarget`. No script |
| Async action | `bindPendingAction()`, or `[pendingAction]` in Angular |
| Size | `itx-size="sm"` or `"lg"`; no attribute is the default |
| Radius | `itx-radius="none"`, `sm`, `md`, `lg`, `xl` or `full`. `full` also switches the corner shape to round |

### guardActivation(root = document)

Call once when the app starts. A capturing click listener on `root` cancels
every click on, or inside, an element with `aria-disabled="true"`, and every
click on, or inside, an activatable element with `aria-busy="true"`: a native
control, a link, an element with `tabindex`, a widget role (`button`,
`checkbox`, `switch`, `option`, `menuitem` and the like) or a custom element.
It calls `preventDefault()` and `stopImmediatePropagation()`, which stops the
handlers, the form submit and the invoker command. `aria-busy` on a region
(`<section>`, a list, a group) marks content that is updating, so the controls
inside it still work, and a busy `<form>` still submits: `bindPendingAction()`
marks the submit button busy, which blocks a second submit. The guard sees
clicks only. A `keydown` handler on a `role="button"` element runs regardless,
so it checks the attributes itself. Returns a function that removes the guard. The dev audit reads the count of installed
guards from `activationGuardCount()`; the guard does not import the audit, so
the audit stays out of production bundles.

### bindPendingAction(button, action)

On click, sets `aria-busy="true"` and `aria-disabled="true"`, awaits
`action(event)`, then removes both. Clicks while either attribute is set are
ignored, including on a button the consumer marked `aria-disabled`. A rejected
action still clears the state, and its error goes to `reportError()`. Returns a
function that unbinds.

### InteropInvoker

Angular templates cannot bind `commandForElement` or `popoverTargetElement`, so
this directive does. Selector: `button[commandFor], button[popoverTarget],
button[pendingAction]`.

| Input | Takes | Effect |
|---|---|---|
| `commandFor` | An element or an ID | An element sets `commandForElement` and removes `commandfor`. A string sets the `commandfor` attribute, as plain HTML does |
| `popoverTarget` | An element or an ID | The same, with `popoverTargetElement` and `popovertarget` |
| `pendingAction` | `(event) => Promise` or `null` | Binds `bindPendingAction()`; rebinds when the function changes |

```html
<button interop-button type="button" command="show-modal" [commandFor]="confirm">Delete…</button>
<dialog #confirm interop-dialog aria-labelledby="confirm-title">…</dialog>
<button interop-button type="button" [pendingAction]="save">Save</button>
```

## Sizes

| Size | Min height | Text | Inline padding |
|---|---|---|---|
| `sm` | 32px | `p-sm`, 14px | 13.5px |
| default | 40px | `p`, 16px | 18px |
| `lg` | 56px | `p-lg`, 18–20px | 27–28.5px |

Inline padding is `(min height − 1lh) × 0.75`, with a line height of 1: one
and a half times the block space that the height leaves around one line. On a
coarse pointer every size is at least 44px tall.

| Token | Default |
|---|---|
| `--itx-button-min-block-size` | `--itx-space-10` (40px); `sm` `--itx-space-8`, `lg` `--itx-space-14` |
| `--itx-button-padding-inline` | `calc((var(--itx-button-min-block-size) - 1lh) * 0.75)` |
| `--itx-button-gap` | `--itx-space-2` |
| `--itx-button-font-size`, `-line-height` | `--itx-font-size-p`, 1; `sm` `p-sm`, `lg` `p-lg` |
| `--itx-button-color` | neutral-900/50 |
| `--itx-button-color-hover`, `-active`, `-focus-visible`, `-pressed` | `--itx-button-color` |
| `--itx-button-background-color` | neutral-100/800 |
| `--itx-button-background-color-hover`, `-active` | neutral-200/700, neutral-300/600 |
| `--itx-button-background-color-focus-visible` | `--itx-button-background-color` |
| `--itx-button-background-color-pressed` | `--itx-button-background-color-active` |
| `--itx-button-border-width`, `-border-style`, `-border-color` | 1px, solid, neutral-300/700 |
| `--itx-button-border-color-hover`, `-active`, `-focus-visible` | `--itx-button-border-color` |
| `--itx-button-border-color-pressed` | `--itx-button-color` |
| `--itx-button-box-shadow-pressed` | an inset ring of the border width in the pressed border color |
| `--itx-button-border-radius`, `-corner-shape` | `var(--itx-radius, var(--itx-radius-base))`, `--itx-corner-shape` |
| `--itx-button-cursor`, `-cursor-disabled`, `-cursor-busy` | default, not-allowed, progress |
| `--itx-button-opacity-disabled` | 0.5 |
| `--itx-button-transition-property` | border, background-color, color |
| `--itx-button-transition-duration`, `-transition-timing-function` | the shared duration and easing |
| `--itx-button-spinner-inline-size`, `-spinner-block-size` | 1em, 1em |
| `--itx-button-spinner-border-width` | 2px |
| `--itx-button-spinner-animation-duration` | 0.75s; 1.5s with reduced motion |

The focus ring's tokens are shared, in `styles/outline.css`:
`--itx-outline-width` 2px, `-style` solid, `-color` neutral-950/300
(`Highlight` in forced colors), `-offset` 2px.

## Split button

Two buttons in `div[role="group"][interop-group="attached"]`, the second opening
a popover with `command="toggle-popover"`. Not a component: see
[group.md](group.md#split-button). The demo shows it on its pattern page,
`/patterns/split-button`, and the button page links there.

## Dev audit rules

| Rule | Flags |
|---|---|
| `button-name` | A `button[interop-button]`, or any button holding an icon, with no accessible name |
| `button-icon-square` | A `button` or `summary[interop-button]` whose drawn content is only an icon, without `interop-button="icon"` |
| `button-type` | A `button[interop-button]` with no `type` inside a form |
| `button-activation-guard` | An `[interop-button]` with `aria-disabled="true"` or `aria-busy="true"` while `guardActivation()` is not installed |
| `button-pressed-value` | `aria-pressed` with a value other than `true`, `false` or `mixed` |
| `icon-label-repeated` | A labeled icon inside a button that already has text |
| `tooltip-trigger-disabled` | A `disabled` control with a tooltip |

## Tested

Style guards: text contrast at 4.5:1 at rest, hover, active, focus-visible and
pressed, light and dark; the pressed edge at 3:1 against the rest edge and the
page; the focus ring at 3:1 against the page; a minimum height of 24px at every
size; a forced-colors block that uses `Highlight`; radius; motion. axe on plain,
icon, labeled-icon, pressed, busy, disabled, `aria-disabled`, pending, tooltip
and invoker buttons and a `<summary>` button. `bindPendingAction()` has 5
specs, `guardActivation()` 5, `InteropInvoker` 5. Audit rules have specs.

Not recorded: browser runs, screen reader output.

## Not built

Variants beyond the neutral look, an `aria-pressed="mixed"` look, a
reason shown for an `aria-disabled` button.
