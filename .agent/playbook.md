# Interop — Playbook

How the canonical library, `projects/interop`, is built. Prime, the deprecated
library in `projects/interop_deprecated`, followed other rules; its cards say
so in their file paths (`src/lib/…`).

## Spirit

Interop components are semantically correct, accessible first, and performant by default. The right HTML element always wins over a styled `<div>`. Complexity is opt-in — simpler code paths are the default.

## Architecture

- **Native elements, styled by attribute.** A component is an attribute on the
  native element that does the job: `button[interop-button]`,
  `select[interop-select]`, `dialog[interop-dialog]`, `label[interop-switch]`.
  The identity attribute goes on the smallest complete control. A variant is a
  value of it: `interop-radio-group="cards"`.
- **One flat folder per component**, `projects/interop/<name>/`, imported as
  `interop/<name>`:
  - `interop-<name>.structure.css`: layout, states, forced colors, with the
    names list ("Also known as") in its header comment.
  - `interop-<name>.base.css`: token values and size steps.
  - `<name>.ts`, only when the component needs script: thin directives.
  - `public-api.ts`, empty for a CSS-only component.
- **Shared looks** a template wears across components live in `styles/`:
  `segmented.css`, `cards.css`, `chips.css`, `underscore.css`, `disclosure.css`. `interop.css` imports
  foundations, then components, then these, then `flow.css`.
- **Flow** (`styles/flow.css`) spaces running content inside an `itx-flow`
  container: space above a block, only between direct siblings (`> * + *`),
  from `--itx-flow-*` tokens on the 4px grid. Headings have more space above
  than below and are trimmed to cap height and baseline (`text-box`). It loads
  last, because a component zeroes its own margin. Components never set outer
  margin; inside a component, `gap` spaces its parts. Put `itx-flow` on the
  element that directly holds the blocks: in Angular, a page component's host
  (`host: { "itx-flow": "" }`), never a wrapper around `<router-outlet>`. A
  page's own CSS must not set margins between its top-level blocks: component
  styles outrank flow's zero-specificity rules. Research:
  [prompts/FLOW-RESEARCH.md](../prompts/FLOW-RESEARCH.md).
- **Helpers** in `projects/interop/src/` fill the gaps the platform leaves.
  They are framework-free and exported from `interop`. See Helpers.
- **Angular directives** are standalone, take signal `input()`s, bind their
  helper in `afterRenderEffect`, and unbind in `onCleanup`. A component with a
  template exists only where it renders something (badge, icon, code block).
  No injection tokens, no host directives, no value accessors: native controls
  work with Angular forms as they are.
- **Light DOM.** No shadow roots, no view encapsulation; styles ship globally
  from `interop.css`.
- **Tokens** are named `--itx-<component>[-<element>]-<property>[-<state>]`.
  A state token is read with a fallback to the rest token. Colors are neutral
  pairs through `light-dark()`, and `styles/contrast.spec.ts` measures them;
  there are no role tokens.
- **The focus ring** for every component, and every decision about its color
  and offset, is in `styles/outline.css`.
- **The dev audit** (`src/audit.ts`) checks component contracts in the page
  and warns problem, reason, advice. The app starts it once with
  `watchInteropInDevMode()`.
- **Invokers first.** Before writing a click handler, ask whether
  `command`/`commandfor`, built-in or a custom `--command`, does the job.

## DOM writes during animation/drag

Never trigger Angular change detection inside a drag or animation loop. Write directly to `element.style` in pointer event handlers, batched via `requestAnimationFrame`. Emit Angular outputs only at end-of-drag (`pointerup` / `keydown` settle).

## Scroll management

To move a component's own viewport, use `element.scrollTo()` computed from `getBoundingClientRect()`. `scrollIntoView()` scrolls every scrollable ancestor, the page included; use it only when moving the page is the point, such as bringing a field's label into view.

## Container queries

Components that need responsive layout declare `container-type: inline-size` on the host. A `@container` condition cannot read a custom property, so its length is written in the query.

## Popover and anchor positioning

A popover is the platform's `popover` attribute with `interop-popover` styles. A button opens it with `popovertarget` or `command="toggle-popover"` and is its anchor, so anchor positioning needs no `anchor-name`. See [components/popover.md](components/popover.md).

## Accessibility

- Every component has a card in `components/` with its accessibility rules,
  audit rules and what was tested.
- One Escape closes one layer.
- A change that moves no focus is spoken with `announce()` from `interop`, from
  the element it is about. Helpers and components do not render live regions;
  `status` options exist only as the fallback for browsers without
  `ariaNotify()`.
- State is never color alone: a shape, a border width, an icon or text goes
  with it, and forced colors map it to system colors.
- Nothing appears or disappears on hover alone.
- In forced colors the browser draws every border in a system color, a
  transparent one too. A control with no edge at rest, such as a toolbar
  channel's button, gets one there for free. Where a clear border would box
  every item of a list, such as a select's options, the forced-colors block
  sets it to `Canvas`.

## Attribute naming convention

Two namespaces. Never mix their roles.

| Prefix | Role | Examples |
|---|---|---|
| `interop-*` | **Identity / activation** — declares "this element IS an interop component" | `interop-button`, `interop-root`, `interop-dialog`, `interop-popover` |
| `itx-*` | **System configuration** — cross-component modifier axes owned by the design system | `itx-size="md"`, `itx-radius="sm"`, `itx-color="danger"` |

Rules:
- `interop-*` answers **what is this element**. Never use it to configure appearance.
- `itx-*` answers **how is the system configured for it**. These are reusable across components — the same `itx-size` axis applies to button, segmented control, input, etc.
- **Variant** stays as a value on the identity attribute: `interop-button="primary"`. Variant is definitional — it describes what kind of component this is, not a quantitative axis. `interop-button` with no value is also valid (default/unstyled). CSS uses `[interop-button~="primary"]` to target variants.
- `data-*` remains correct for **component-internal state** (`data-has-selection`, `data-thumb-role`) — internal, not consumer-facing.

Well-formed example:
```html
<!-- identity        system axes -->
<span interop-badge="dot" itx-size="sm" itx-color="info">New activity</span>
```

CSS selectors follow the same split:
```css
/* identity selector */
:where(button[interop-button]) { … }

/* system modifier selector */
:where(button[interop-button][itx-size="lg"]) { … }
```

## Size steps

`itx-size` works the same way on every component that has it.

- No attribute is the default step. `md` means the same thing.
- A step is a block in the base file that reassigns the component's own
  tokens: `:where(<selector>[itx-size="lg"]) { … }`. The structure file never
  mentions `itx-size`.
- A step changes the component's height and its text size together.
- Every control's `lg` step is 56px (`--itx-space-14`), so controls line up in
  a row at every size: 32, 40, 56. Tags, chips and badges keep their own
  smaller pill scale.
- Lengths come from `--itx-space-*`. Text sizes come from the typography
  roles (`--itx-font-size-<role>` with its `--itx-line-height-<role>`). No raw
  `rem` values for either.
- A container's `itx-size` is a rule, not a default: a toolbar's sets every
  button in it, and the dev audit warns about a button's own `itx-size` there.
- A component ships only the steps it needs. Leave a step out when it would
  break a minimum, such as the 24px target size of WCAG 2.5.8.

## Corner radius

Every component corner follows one of four rules. A control keeps the house
radius inside a container; the container's corner grows to stay concentric,
never the control's shrinks. `styles/radius.css` states
them, and `styles/radius.spec.ts` fails on a corner that follows none.

| Rule | Value | Used by |
|---|---|---|
| Round by shape | `var(--itx-radius-full)` | badge, switch track and thumb, radio circle and dot, spinner |
| House | `var(--itx-radius, var(--itx-radius-base))` | every control, wherever it sits; popover, dialog, any container |
| Small | half the house radius, capped where it would change the shape | tooltip; checkbox box, capped at a quarter of its size |
| Enclosing | the house radius plus the gap to the controls inside (padding and border), `0` when the house radius is `0`: `var(--itx-radius, min(var(--itx-radius-base) * 9999, var(--itx-radius-base) + gap))` | a container whose controls sit close to its corners: segmented frame, toolbar channel, select picker, split button choices, code block, palette. Not a dialog |

The house radius is `--itx-radius-base`, 8px, with squircle corners
(`--itx-corner-shape`). A theme sets `--itx-radius-base` on `:root` to change it
everywhere. Never write a radius literal or a fixed step in a component.

`itx-radius` picks a step on one element. Each step is a multiple of the house
radius, worked out on that element, so the whole scale moves with the theme:

| `itx-radius` | Multiple | At 8px |
|---|---|---|
| `none` | 0 | 0 |
| `sm` | ½ | 4px |
| `md`, `base`, no attribute | 1 | 8px |
| `lg` | 1½ | 12px |
| `xl` | 2 | 16px |
| `full` | pill or circle, round corners | — |

At 8px every step sits on the 4px layout grid. A theme's base may not, and
need not: a corner positions nothing, so nothing has to line up with it.

## Style guards

jsdom computes no styles, so these specs read the stylesheets as text, from one
list: `styles/sheets.ts` imports every stylesheet, and `styles/sheets.spec.ts`
fails when it disagrees with `interop.css`. A new component adds its
stylesheets to `interop.css` and `sheets.ts`; contrast, radius, motion and
focus then read them, and forced colors makes it decide whether it needs a
block.

| Spec | Guards |
|---|---|
| `styles/sheets.spec.ts` | Every stylesheet in `interop.css` is in the list the guards read |
| `styles/contrast.spec.ts` | Text 4.5:1 and state indicators 3:1 against the page, in both schemes; a pressed edge 3:1 against rest |
| `styles/target-size.spec.ts` | Every control's target height at every size step is 24px or more |
| `styles/radius.spec.ts` | Every corner in every stylesheet follows one of the four corner rules |
| `styles/forced-colors.spec.ts` | Every component stylesheet keeps a forced-colors block or is exempt with a reason; selected states map to Highlight |
| `styles/motion.spec.ts` | Every transition in every stylesheet reads a shared duration token, so reduced motion reaches it |
| `styles/focus.spec.ts` | Only `outline.css` sets a focus ring or its tokens; nothing styles bare `:focus` |
| `styles/preferences.spec.ts` | Only `border.css` answers `prefers-contrast` and only `transition.css` answers `prefers-reduced-motion`; every border width reads a shared token |
| `a11y/a11y.spec.ts` | axe on every component and state, including inside popovers and unselected tab panels, and on markup the helpers have finished |

`npm run test:pages` (`scripts/cdp/check-pages.mjs`) checks what jsdom cannot,
on every demo page in headless Chrome: axe with color contrast in light and
dark, no sideways scroll at 320px, and a focus ring at every Tab stop, also in
forced colors. It reports how many Tab stops it reached. A known failure is
listed with its reason in `scripts/cdp/known-failures.json`, and the run says
when a listed one stops failing. CI runs it after building the demo.

One way per pattern. When two components solve the same problem differently,
fix the outlier before adding a third.

## Helpers

A helper fills one gap the platform leaves, in `projects/interop/src/`. It is
`bindX(element, options) → unbind`, framework-free, with an Angular directive
of a few lines that calls it from `afterRenderEffect`.

A helper:

- listens, and sets attributes, focus or status text. It never inserts nodes
  into content the page renders. It may fill an element the author leaves empty
  for it: a status region's text, or an error summary's `<ul>`;
- keeps no state the page cannot read from the DOM;
- binds only the element it is given. Nothing scans the page and binds by
  itself;
- adds every listener with `{ signal }` from one `AbortController`, and its
  unbind calls `abort()` and disconnects its observers;
- finds focus targets with `focusables()` or `isFocusable()` from
  `src/focusable.ts`, the one definition of what the keyboard can reach.

Shared code is extracted when a second helper needs it, not before.

A helper does not start the dev audit. The app calls `watchInteropInDevMode()`
once at startup, so the audit runs on pages built only from CSS components too.

Each helper names what would retire it. The list should shrink as browsers
ship; a helper with nothing on the horizon needs a reason to exist.

| Helper | Gap | Retired by |
|---|---|---|
| `bindTabs` | Arrow keys, selection, panels | `focusgroup` takes the arrow keys (Chrome 150); nothing proposed for selection |
| `bindRadioHomeEnd` | Home and End in a radio group | `focusgroup` moves focus with them, but does not check the radio |
| `bindTooltip` | Show on hover and keyboard focus | Interest invokers, `interestfor` (Chrome 142) |
| `bindPasswordToggle` | Showing a password | Nothing proposed; Open UI has no command for it |
| `bindCharacterCount` | A count that does not block typing, announced on a pause | Nothing proposed |
| `bindValidation` | Error messages in the page, at the right time, wired to the field; an error summary | Nothing proposed. The browser checks the constraints; only its message bubbles are replaced |
| `bindToolbar` | One Tab stop and arrow keys in a toolbar, where `focusgroup` is missing | `focusgroup` in Firefox and Safari; it binds nothing where the attribute works |
| `bindScrollArea` | A scroller the keyboard can reach | Safari doing it, as Chrome and Firefox do |
| `bindSegmentedFit` | Stacking a segmented control when its row does not fit | Nothing proposed: CSS cannot measure whether content fits. Optional: `itx-orientation` and the page's own threshold need no script |
| `bindDrawer` | Focus into a popover on opening; closing when focus leaves | Nothing proposed |
| `bindSlider`, `paintSlider` | A fill that follows the value; value text from a formatter | `::slider-fill` with `appearance: base` (CSS Forms; no browser ships it) |
| `bindSteps` | Steps of one form, and their validation | Nothing proposed |
| `bindTags`, `bindTagInput` | Focus after a removal, announcements, adding by Enter | Nothing proposed |
| `bindSelectAll` | A select-all checkbox | Nothing proposed |
| `bindToasts`, `toast` | Timers that pause, dismissal, focus after a removal, and a region in the open modal | Nothing proposed. `popover`, `command` and `ariaNotify()` do the rest |
| `bindTargetCurrent` | `aria-current` for the section in view; choosing it without `:target-current`; keeping the current link in view in an overflowing bar | Chrome exposing `:target-current` as `aria-current` (ARIA WG, 2026-01-29) and Firefox and Safari shipping `scroll-target-group`. Nothing proposed for the reveal |
| `bindPendingAction`, `guardActivation` | A busy button that ignores repeat clicks | Nothing proposed |
| `scopeSelectAll` | Ctrl+A inside a code block | Nothing proposed |
| `announce` | Speaking a change that moves no focus, in browsers without `ariaNotify()` | `ariaNotify()` Baseline widely available, about March 2029: the `status` fallback goes, and `announce()` is one call |

## What NOT to do

- Don't add fallbacks or validation for scenarios that can't happen inside the library
- Don't write comments that describe WHAT code does — only WHY it does something non-obvious
- Don't wrap a native control in a custom element: its attributes stop reaching it
- Don't use `scrollIntoView()` for scroll-snap viewports (see above)
- Don't trigger Angular CD in pointer/animation loops
