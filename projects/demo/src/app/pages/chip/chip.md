# Button

<!-- QUICK START — commented out for now; promote the most crucial content later.

## Quick start

### What it is

`interop-button` — both a component and an attribute selector — attaches to a
platform-standard `<button>` and layers three tiers of functionality onto it:
**presentation**, **state**, and **activation**. The element remains a genuine
`<button>` throughout; its native behaviour — form submission, keyboard handling,
ARIA — is preserved. Each tier is opt-in, and a consumer imports only the layers a
given button requires.

### Presentation

The bare attribute, with no component import, styles the button through CSS custom
properties alone. The surface is broad — colour, edge, sizing, typography, focus,
and their per-state variants — and every declaration carries zero specificity, so
any default may be overridden from a consumer stylesheet. A representative
selection appears below; the full surface and its defaults are catalogued in the
[token table](#token-table).

```html
<button interop-button>Save</button>
```

```css
:where([interop-button]) {
  /* Colour — each also takes -hover and -active variants */
  --itx-button-background: var(--itx-neutral-5);
  --itx-button-foreground: var(--itx-neutral-12);
  --itx-button-border-color: transparent;

  /* Edge */
  --itx-button-border-width: 1px;
  --itx-button-radius-default: var(--itx-radius-nominal);

  /* Sizing — one multiplier drives the padding scale */
  --itx-button-padding-step: 0.2rem;
  --itx-button-sizing-multiplier: 2;

  /* Focus ring */
  --itx-button-outline-color: var(--itx-neutral-8);
}
```

### State

Importing the `InteropButton` component adds reactive state inputs — `disabled`,
`loading`, `loadingText`, and `focusableWhenDisabled` — for buttons whose
availability changes at runtime. This tier does not draw in the activation
utilities: a button that must reflect a disabled or pending state, yet routes its
click through an ordinary `(click)` binding, requires this layer and no more.

```ts
imports: [InteropButton]
```

```html
<button interop-button [disabled]="!form.valid" (click)="save()">Save</button>
<button interop-button [loading]="saving()" loadingText="Saving…">Save</button>
```

### Activation

The `InteropButtonActivation` directive adds the activation guards — throttle,
debounce, reentrance, and once — routed through a single handler. It shares the
`button[interop-button]` selector and is imported alongside `InteropButton`. The
presentation and state layers hold no dependency on this code; it is bundled only
when the directive is explicitly imported. Each guard is detailed under
[Activation guards](#activation-guards) below.

```ts
imports: [InteropButton, InteropButtonActivation]
```

```html
<button interop-button
        [onActivate]="submit"
        [activationOptions]="{ throttleMs: 500 }">
  Submit
</button>
```

-->

## Appearance

Appearance is set through three attributes across two namespaces:

| Axis | Attribute | Values |
|---|---|---|
| Identity + variant | `interop-button="…"` | bare, or one or more variant names |
| Size | `itx-size="…"` | `xs` · `sm` · `md` · `lg` · `xl` |
| Radius | `itx-radius="…"` | `none` · `nominal` · `sm` · `md` · `lg` · `xl` · `full` |

Variant sits on the identity attribute because it is definitional — a variant is a
kind of button, not a tuning of one. Size and radius are quantitative axes shared
across the system, and each occupies its own `itx-*` attribute.

### Size

Five opt-in sizes on an 8-point grid — 24, 32, 40, 48, 56px — set through
`itx-size`, with `md` (40) the anchor. Omit the attribute to retain the base size
(md), or to manage sizing independently.

| `itx-size` | height | label |
|---|---|---|
| `xs` | 24px | 12px |
| `sm` | 32px | 14px |
| `md` | 40px | 16px |
| `lg` | 48px | 20px |
| `xl` | 56px | 24px |

#### Code example

```html
<button interop-button itx-size="xs">Extra small</button>
<button interop-button itx-size="sm">Small</button>
<button interop-button itx-size="md">Medium</button>
<button interop-button itx-size="lg">Large</button>
<button interop-button itx-size="xl">Extra large</button>
```

Each size pins one value — its height. Block padding is derived from the height as
`(height − 1em) / 2`, so the label-to-height ratio holds and the visible pill lands
at exactly the height. Retune a size, or set a height on any button directly:

```css
/* Every size is one token — retune a height directly. */
[interop-button][itx-size="md"] {
  --itx-button-height: 2.75rem;
}

/* Or set a height on any button, no size attribute required. */
[interop-button].compact {
  --itx-button-height: 1.75rem;
}
```

On coarse pointers, any button shorter than 44px gains invisible block space so
its hit area clears the touch-target minimum; the visible pill never changes size.

### Radius

Seven opt-in radii, applied through `itx-radius`. The values draw from the
system's semantic radius scale, so a button's corners align with the components
around it. Omit the attribute to retain the theme default.

#### Code example

```html
<button interop-button itx-radius="none">None</button>
<button interop-button itx-radius="nominal">Nominal</button>
<button interop-button itx-radius="sm">Small</button>
<button interop-button itx-radius="md">Medium</button>
<button interop-button itx-radius="lg">Large</button>
<button interop-button itx-radius="xl">Extra large</button>
<button interop-button itx-radius="full">Full</button>
```

For an absolute radius beyond the scale, set the escape-hatch token on the
instance:

```css
[interop-button].my-special-case {
  --itx-button-border-radius: 10px;
}
```

### Variants

A variant is a named bundle of CSS custom properties — nothing more. There is no
variant registry and no component code to amend: define a selector, assign tokens,
and that name becomes a variant.

The default button, with no variant applied:

```html
<button interop-button>Label</button>
```

To define one — here, `interop-demo` — target the identity attribute and assign
the tokens of interest. Any token left unset inherits from the base.

#### Code example

```css
:where([interop-button~="interop-demo"]) {
  --itx-button-background: hsl(250 60% 55%);
  --itx-button-foreground: white;
  --itx-button-border-color: hsl(250 60% 45%);

  /* State slots — append -hover or -active */
  --itx-button-background-hover: hsl(250 60% 60%);
  --itx-button-background-active: hsl(250 60% 50%);
}
```

```html
<button interop-button="interop-demo">Custom</button>
```

The selector uses `~=` (word match), so a button may carry more than one variant:

```html
<button interop-button="interop-demo loud">Composed</button>
```

The selectors use `:where()`, so they carry zero specificity. Any Interop default
may be overridden from a consumer stylesheet, across the entire page or a single
subtree, without a specificity conflict.

#### Token table

The custom properties a variant or theme may set. The coloured slots have state
variants: append `-hover` or `-active` to the rest token (for example,
`--itx-button-background-hover`).

| Token | Role |
|---|---|
| `--itx-button-background` | Fill colour (rest / `-hover` / `-active`) |
| `--itx-button-background-image` | Gradient or image fill for the pill |
| `--itx-button-foreground` | Text and icon colour (rest / `-hover` / `-active`) |
| `--itx-button-border-color` | Border colour (rest / `-hover` / `-active`) |
| `--itx-button-border-width` | Border thickness |
| `--itx-button-border-style` | Border style |
| `--itx-button-box-shadow` | Pill shadow (rest / `-hover` / `-active`) |
| `--itx-button-radius-default` | Variant's default corner radius (below `itx-radius`) |
| `--itx-button-border-radius` | Per-instance radius override |
| `--itx-button-corner-shape` | `squircle`, `round`, and so on |
| `--itx-button-font-family` | Type family |
| `--itx-button-font-size` | Type size |
| `--itx-button-line-height` | Leading |
| `--itx-button-height` | Visual pill height (set by `itx-size`); block padding derives from it |
| `--itx-button-padding-block` | Escape hatch — overrides the height-derived block padding |
| `--itx-button-padding-inline` | Horizontal padding |
| `--itx-button-gap` | Gap between projected content items |
| `--itx-button-touch-inset` | Invisible block space added on coarse pointers to floor the touch target |
| `--itx-button-outline-{width,style,color,offset}` | Focus ring |
| `--itx-button-transition-{property,duration,timing-function}` | State transition |

## Availability

A button communicates its availability through three distinct states, each
producing a different set of attributes and a different relationship to the tab
order. The choice among them is an accessibility decision, not merely a visual one.

| State | `disabled` | `aria-disabled` | `aria-busy` | In tab order |
|---|---|---|---|---|
| Disabled (default) | ✓ | — | — | No |
| Disabled, focusable | — | `true` | — | Yes |
| Loading | — | `true` | `true` | Yes |

### Disabled

The default. It sets the native `disabled` attribute, which browsers, form engines,
and assistive technology all understand without further wiring. The button is
removed from the tab order — appropriate when the action is structurally
unavailable and its absence requires no explanation.

```html
<button interop-button [disabled]="true">Save</button>
```

### Focusable when disabled

`focusableWhenDisabled` substitutes `aria-disabled` for the native attribute,
keeping the button in the tab order. It suits a control a keyboard user should be
able to reach in order to discover why it is unavailable — a submit button gated by
form validity, for instance. Interaction remains blocked; the click is suppressed
rather than the element withdrawn.

```html
<button interop-button [disabled]="true" [focusableWhenDisabled]="true">Save</button>
```

### Loading

`loading` marks an operation in progress. It never applies the native `disabled`
attribute: the button stays focusable, so a screen-reader user who reaches it
mid-operation hears its busy state rather than silence. `aria-busy` is set, pointer
interaction is suppressed, and the content is replaced by `loadingText`.

```html
<button interop-button [loading]="saving()" loadingText="Saving…">Save</button>
```

## Activation guards

The guards live on `InteropButtonActivation`. Import it alongside `InteropButton`,
pass a handler to `[onActivate]`, and configure it with `[activationOptions]`.

```ts
imports: [InteropButton, InteropButtonActivation]
```

```html
<button interop-button
        [onActivate]="submit"
        [activationOptions]="{ throttleMs: 500 }">
  Submit
</button>
```

`activationOptions` accepts `debounceMs`, `throttleMs`, `reentrant`, and `once`,
along with lifecycle hooks. The three common guards follow.

### Throttle

Runs the handler at most once per window. The first click fires immediately; clicks
within the window are dropped. Suited to actions where repeated clicks should not
repeat the work, such as pagination or a "load more" control.

#### Code example

```html
<button interop-button
        [onActivate]="loadMore"
        [activationOptions]="{ throttleMs: 500 }">
  Load more
</button>
```

### Debounce

Runs the handler once, after clicks stop. Each click resets the timer; the handler
fires after the window elapses with no further clicks. Appropriate when only the
final click should take effect, such as a live filter or a recalculation driven by
rapid input.

#### Code example

```html
<button interop-button
        [onActivate]="recalculate"
        [activationOptions]="{ debounceMs: 300 }">
  Recalculate
</button>
```

### Reentrance gate

Blocks overlapping runs of an async handler. While a run is in progress, further
clicks are ignored until it settles, preventing duplicate submissions. This is the
default (`reentrant: false`); set `reentrant: true` to permit concurrent runs.

#### Code example

```html
<button interop-button
        [onActivate]="submitOrder"
        [activationOptions]="{ reentrant: false }">
  Place order
</button>
```
