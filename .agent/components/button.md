# InteropButton — Mental Model Card

## Files

```
src/lib/components/interop-button/
  interop-button.ts            component — styling, disabled/loading state, aria
  interop-button-activation.ts directive — activation guardrails (opt-in import)
  interop-button.html          template — loading swap (loading text vs <ng-content />)
  interop-button-map.ts        ITX_BUTTON_MAP token + InteropButtonMap directive
  interop-button-prefix.ts     marker directive — .interop-button__prefix slot
  interop-button-suffix.ts     marker directive — .interop-button__suffix slot
  interop-button.spec.ts       tests
  README.md                    consumer-facing usage doc
src/lib/styles/components/button.css            structural rules
src/lib/styles/themes/protocol/components/button.css  token values
```

## Two-layer architecture

`InteropButton` (component) and `InteropButtonActivation` (directive) share the same selector — `button[interop-button]` — and are intentionally separate imports.

**`InteropButton`** handles everything that applies regardless of how the button is used:

- Disabled/loading state → host `[disabled]` / `[attr.aria-disabled]` / `[attr.aria-busy]`
- `isDisabled` computed signal (read by the activation directive)
- Click guard: `event.preventDefault()` when `isDisabled()` (prevents form submission for `aria-disabled` cases)
- Template: loading-text swap / `<ng-content />`

**`InteropButtonActivation`** handles activation routing and guardrails:

- Inputs: `onActivate`, `activationId`, `payload`, `activationOptions`
- `canActivate` computed signal
- `@HostListener("click")` → debounce / throttle / reentrancy / cross-component trigger
- Injects `InteropButton` (self, optional) to read `isDisabled()`
- Imports `createActivationHandler` from `../../utils/activation`

### Why the split matters

The CSS layer of the button system is intentionally usable with zero JS — consumers who import only the stylesheet can write `<button interop-button>` without any Angular. The Angular layer should respect the same principle: importing `InteropButton` for styling/state costs nothing from `activation.ts`. `InteropButtonActivation` and the entire activation utility tree are only bundled when explicitly imported.

### Import patterns

```typescript
// Styling, disabled, loading only — activation utilities NOT bundled
imports: [InteropButton];

// Full activation guardrails
imports: [InteropButton, InteropButtonActivation];
```

```html
<!-- No activation — (click) binding works normally -->
<button interop-button (click)="save()">Save</button>

<!-- With guardrails — requires InteropButtonActivation in imports -->
<button
	interop-button
	[onActivate]="submit"
	[activationOptions]="{ throttleMs: 500, reentrant: false }"
>
	Submit
</button>
```

A dev-mode constructor check in `InteropButton` warns if it's applied to a non-button tag. `InteropButtonActivation` emits a dev-mode warning if no `InteropButton` instance is found on the same element.

The template body is minimal:

```html
@if (loading()) {
<span class="interop-button__loading-text">{{ loadingText() }}</span>
} @else {
<ng-content />
}
```

Everything else — visual pill, focus ring, padding, gap, disabled treatment — is global CSS keyed to the `[interop-button]` attribute, so consumers who only import the stylesheet (no Angular) get the look without the behavior.

## Attribute convention

Three axes, two namespaces:

| Axis               | Attribute            | Example                                                                    |
| ------------------ | -------------------- | -------------------------------------------------------------------------- |
| Identity + variant | `interop-button="…"` | `interop-button="primary"`, `interop-button="icon"`, bare `interop-button` |
| Size               | `itx-size="…"`       | `xs` \| `sm` \| `md` \| `lg` \| `xl`                                       |
| Radius             | `itx-radius="…"`     | `none` \| `nominal` \| `sm` \| `md` \| `lg` \| `xl` \| `full`              |

Variant **stays as a value on the identity attribute** — it's definitional (a "primary button" is a kind of button, not a tuning of one). Size and radius are orthogonal quantitative axes shared system-wide and live on `itx-*`. See [playbook.md](../playbook.md) for the full convention.

```html
<button interop-button="primary" itx-size="md" itx-radius="sm">Save</button>
<button interop-button="icon" itx-size="sm">…</button>
<button interop-button itx-size="md">Plain</button>
```

`itx-radius` is **not** a button selector — it's the system-wide attribute from
`tokens/shape.css`, which resolves the semantic scale onto `--itx-radius` for
any element. The button opts in by including `--itx-radius` in its radius chain.
The one button-specific radius rule is `itx-radius="full"`, which flips
`corner-shape` to `round` (see "Radius system").

**CSS selector forms:**

```css
:where(button[interop-button]) {
	/* base */
}
:where(button[interop-button~="primary"]) {
	/* variant */
}
:where(button[interop-button][itx-size="md"]) {
	/* size */
}
:where(button[interop-button][itx-radius="full"]) {
	/* radius (one rule only) */
}
```

The variant selector uses `~=` (word-match) so multiple variant tokens compose (`interop-button="icon grow"`). `warnOnConflictingTokens` runs in devMode and emits a console warning when conflicting variant tokens are present. ⚠️ The current warning scans for sizes in the `interop-button` value too — that detection is stale; sizes now live on `itx-size`. See "Known gaps."

**The variant vocabulary the theme actually ships** is `primary`, `secondary`,
`tertiary`, `icon`, `grow`. The first three are Carbon's; `icon` squares the box;
`grow` releases the max-width so the button fills its track. `action` appears in
the disabled-treatment selector list but has no rest-state block — a leftover.

## Sizing system

Borrowed from IBM Carbon's Button. Carbon's model in one line: **size changes
the height and nothing else.** The label is a constant 14px/400, so the box
grows around a fixed label rather than scaling with it.

Carbon's constant 16px side padding is kept from `md` up but **not** at the two
small steps — see "Why the small sizes break the constant" below.

Each `itx-size` block therefore sets exactly one property:

```css
:where(button[interop-button][itx-size="lg"]) {
	--itx-button-height: 3rem;
}
```

| `itx-size` | `--itx-button-height` | font-size  | padding-inline |
| ---------- | --------------------- | ---------- | -------------- |
| `xs`       | `1.5rem` — 24px       | `0.875rem` | **8px**        |
| `sm`       | `2rem` — 32px         | `0.875rem` | **12px**       |
| `md`       | `2.5rem` — 40px       | `0.875rem` | 16px           |
| `lg`       | `3rem` — 48px         | `0.875rem` | 16px           |
| `xl`       | `4rem` — 64px         | **`1rem`** | 16px           |

`xl` is the single exception on the label: it bumps the font-size to `1rem`,
because Carbon's expressive large step does the same. Carbon's `2xl` (80px) is
not taken.

### Why the small sizes break the constant

Only one of the two padding axes is ever a constant. Block padding is derived
from the height, so across the ramp it runs 5 / 9 / 13 / 17 / 24 — while a
constant inline padding sits at 16 throughout. The padding box therefore
inverts: at `xs` it is more than three times wider than it is tall, at `xl` it
is narrower. A 24px-tall button ended up carrying two thirds of its own height
in air on each side of the label.

So `xs` and `sm` step down one and two places on the spacing scale (8px, 12px).
`md` keeps 16 as the anchor; `lg` and `xl` keep it too, where a constant still
reads correctly against a tall box.

**The `icon` variant is excluded from those two rules, and that exclusion is
load-bearing.** `icon` squares itself by deriving *both* paddings from the
height, and it is declared above the size blocks — so at equal (zero)
specificity a padding set by a size rule wins on source order and would leave
an icon button 8px wide by 5px tall in its padding. The two size rules carry
`:not([interop-button~="icon"])` for exactly this.

Worth knowing when weighing whether `xs` earns its place: **every real `xs`
button in the product is an icon button** — the terminal's reset control and
the popover placement grid. As a text size it appears only in this component's
own demo.

**Default size is `md` (40px)**, declared on the base `[interop-root]` block —
deliberately _not_ Carbon's `lg` (48px), which reads oversized in this system.
Omitting `itx-size` gives you `md`.

**Height is the spec; block padding is derived.** The foundation computes

```css
padding-block: calc(
	var(
			--itx-button-padding-block,
			(var(--itx-button-height, 2.5rem) - 1em) / 2
		) +
		var(--itx-button-touch-inset, 0px)
);
```

so the visible pill lands at exactly `--itx-button-height` and the label-to-height
ratio holds across the scale. `--itx-button-padding-block` survives as an escape
hatch — set it and the derivation is bypassed (the `icon` variant uses this to
square itself). This is also why `--itx-button-line-height` is pinned to `1`:
the derivation measures against `1em`, so Carbon's 18/14 leading would push the
pill past its declared height.

### The var()-resolution gotcha (general lesson, not button-specific)

A custom property whose value contains `var()` is resolved **at the element
where it is declared**, not where it is read. So a derived declaration must live
on a selector that the overriding selector also matches — otherwise the
inherited computed value bakes in whatever the inputs were at declaration time
and freezes.

The button's `padding-block` derivation obeys this by living in the `padding-block`
declaration on `:where(button[interop-button])` itself rather than as a
`--itx-button-padding-block` custom property on `[interop-root]`. Had it been
declared at root, every button would inherit one frozen padding and `itx-size`
would do nothing.

The rule generalises: **if a value derives from a token that a narrower selector
overrides, declare the derivation at or below that narrower selector.** An
earlier multiplier-based sizing system for this component leaned on the same
lesson; the system is gone, the constraint is not.

## Radius system

Radius resolves through a three-tier fallback chain on the pill pseudo-element:

```css
border-radius: var(
	--itx-button-border-radius,
	/* 1. hard per-instance override */
	var(
			--_itx-button-radius,
			/* 2. the itx-radius="…" attribute */
			var(
					--itx-button-radius-default,
					/* 3. theme / per-variant default */
					var(--itx-context-radius, initial)
				)
		)
);
```

The theme's default is `--itx-radius-none` (0) — Carbon has no rounded buttons.

**The `--_itx-button-radius` bridge.** `--itx-radius` is registered
`inherits: false` (in `tokens/shape.css`) so a container's radius can't leak into
nested children. But the pill is a `::before` _pseudo_ of the host, and a
non-inheriting property is invisible to it. The foundation copies it onto an
inheriting private token on the host:

```css
:where(button[interop-button]) {
	--_itx-button-radius: var(--itx-radius);
}
```

With no `itx-radius` present this resolves guaranteed-invalid, so the chain falls
through to the theme default. This is the pattern for any component that paints
its radius on a pseudo-element.

The only button-specific radius selector in the theme is:

```css
:where(button[interop-button][itx-radius="full"]) {
	--itx-button-corner-shape: round;
}
```

`full` means a stadium. The default squircle `corner-shape` can't form one — a
maxed squircle is a superellipse, not a rounded end — so `full` switches to
`round` while every other tier keeps the squircle curve.

Consumers wanting an absolute radius past the attribute set
`--itx-button-border-radius` directly. Never assign a _theme default_ to that
token — it's the escape hatch, and doing so would mask the `itx-radius`
attribute entirely. Theme defaults go in `--itx-button-radius-default`.

## Token surface

The protocol theme declares **37 distinct `--itx-button-*` properties**. Not all
37 are set at the base — the split matters when you're reasoning about defaults:

- **Set on `[interop-root]`** — the base block: height, padding-inline, the
  layout six (display, align-items, justify-content, width, flex, min/max-width),
  gap, the typography four, the edge four, the transition three, the rest-state
  four (background / foreground / border-color / box-shadow), the two state
  backgrounds (hover, active), and the outline four.
- **Set only by variant or state selectors** — `--itx-button-padding-block`
  (the `icon` variant), `--itx-button-foreground-hover` / `-active` and
  `--itx-button-border-color-hover` / `-active` (variant blocks), and
  `--itx-button-disabled-opacity` (the disabled rules flip it from the
  foundation's `0.4` to `1` so Carbon's flat gray fill reads as-is).

The foundation declares a further handful that the theme never touches and that
exist purely as consumer escape hatches: `--itx-button-touch-inset`,
`--itx-button-border-radius`, `--itx-button-background-image`,
`--itx-button-letter-spacing`, `--itx-button-icon-color` (+ `-hover` / `-active`),
`--itx-button-box-shadow-hover` / `-active`, and
`--itx-button-transition-property`. The full annotated list lives in the header
comment of `components/button.css` — that comment is the canonical inventory.

Keep the demo page's CSS tokens table in sync with the theme file; nothing fails
when a default drifts.

## Consumer vocabulary mapping (ITX_BUTTON_MAP)

`InteropButtonMap` is a **separate directive** with the same selector. When a consumer provides `ITX_BUTTON_MAP`, the directive's `ngOnInit` reads the `interop-button` attribute value, expands each token through the map, dedupes, and rewrites the attribute _before_ CSS resolves it.

Scope: the map operates **only on the `interop-button` attribute** — i.e., variants. Sizes (`itx-size`) and radii (`itx-radius`) live on separate attributes and aren't part of the vocabulary translation. A consumer who wants their `primary` keyword to mean `action` writes `{ primary: 'action' }`; size handling stays canonical.

Critical detail: the rewrite happens **at init**, not at change-detection time. The map is treated as a build-time vocabulary translator, not a reactive concern. Consumers import `InteropButtonMap` alongside `InteropButton` only when they're using a map.

## Disabled vs loading — three semantic states

This is the model the user must internalise. The combinations and the attributes they produce:

| State                                | `disabled` attr | `aria-disabled` | `aria-busy` | In tab order |
| ------------------------------------ | --------------- | --------------- | ----------- | ------------ |
| `disabled` (default)                 | ✓               | —               | —           | no           |
| `disabled` + `focusableWhenDisabled` | —               | `true`          | —           | yes          |
| `loading`                            | —               | `true`          | `true`      | yes          |

- **Default disabled** uses the native attribute — best for "this action is structurally unavailable." Browsers, form engines, and AT all understand it. Cost: keyboard users cannot reach the button to learn it exists.
- **`focusableWhenDisabled`** is the opt-in for "temporarily gated, discoverability matters" — e.g. a submit button blocked by form validity. The button stays in the tab order so a keyboard user can land on it and (eventually) be told why they can't proceed. The host `click` listener enforces the interaction block that native `disabled` would have provided.
- **Loading** never uses the native `disabled` attribute: the button must stay focusable so a screen reader user who reaches it mid-operation hears "loading," not silence. CSS suppresses pointer interaction; the click guard catches keyboard activation.

Roadmap: a `disabledReason` input (string | TemplateRef) wiring `aria-describedby` to a tooltip — only useful when `focusableWhenDisabled` is on, since natively-disabled elements can't receive focus and therefore can't expose a tooltip.

## Activation: three paths through the click handler (`InteropButtonActivation`)

The activation directive's `@HostListener("click")` routes through this priority:

```typescript
if (this.button?.isDisabled()) {
	event.preventDefault();
	return;
}

const local = this.localActivation(); // 1. [onActivate] handler
if (local) {
	local(this.payload());
	return;
}

const id = this.activationId(); // 2. cross-component trigger
if (id) {
	this.activationService?.trigger(id, this.payload());
}
// 3. otherwise: fall through to consumer's own (click) — native button click
```

1. `[onActivate]` — a local handler wrapped by `createActivationHandler` with guardrails (debounce/throttle/reentrancy/once). The wrapped handler lives in a signal (`localActivation`) so it rebuilds reactively when `onActivate` or `activationOptions` changes.
2. `[activationId]` — fires a registered handler on `InteropActivation` (optional injection). A common pattern is a single registered handler activated from multiple buttons in different parts of the UI.
3. Neither set — the host listener is a no-op. The consumer's `(click)` binding (if any) still runs because the listener is non-stopping. A vanilla `<button interop-button (click)="...">` works.

Note: `InteropButton` also has a `@HostListener("click")` — it calls `event.preventDefault()` when `isDisabled()` (the form-submission guard for `aria-disabled` cases). When both directives are present, both run; the duplication is harmless.

## Inputs

### `InteropButton`

| Input                   | Type                              | Default        | Effect                                                  |
| ----------------------- | --------------------------------- | -------------- | ------------------------------------------------------- |
| `loading`               | `boolean`                         | `false`        | Swaps content for `loadingText`, sets `aria-busy`       |
| `disabled`              | `boolean`                         | `false`        | Native `disabled` attr (unless `focusableWhenDisabled`) |
| `focusableWhenDisabled` | `boolean`                         | `false`        | Switch to `aria-disabled` for discoverability           |
| `type`                  | `'button' \| 'submit' \| 'reset'` | `'button'`     | Bound to the host (not currently — see "Gaps")          |
| `loadingText`           | `string`                          | `'Loading...'` | Shown in template when `loading=true`                   |

### `InteropButtonActivation`

| Input               | Type                                 | Default     | Effect                                               |
| ------------------- | ------------------------------------ | ----------- | ---------------------------------------------------- |
| `onActivate`        | `ActivationHandler<unknown> \| null` | `null`      | Local handler with activation guardrails             |
| `activationId`      | `string \| null`                     | `null`      | Triggers a handler registered on `InteropActivation` |
| `payload`           | `unknown`                            | `undefined` | Passed to the handler                                |
| `activationOptions` | `ActivationOptions`                  | `{}`        | `{ debounceMs, throttleMs, reentrant, once }`        |

## Computed

- `InteropButton.isDisabled = disabled() || loading()` — single source of truth for interaction suppression; read by `InteropButtonActivation` via injection
- `InteropButtonActivation.canActivate = !isDisabled && (onActivate || activationId)` — exposed but not bound in the template; useful for consumers building affordances around buttons

## Layout: source-order content with gap, plus marker slots

The button is `display: inline-flex; gap: var(--itx-button-gap)` (8px, Carbon's
`$spacing-03`). Any content the consumer projects renders left-to-right (or
RTL-flipped) in **source order**, with the same `gap` between every adjacent pair.

`InteropButtonPrefix` and `InteropButtonSuffix` are **marker directives, not
positioning ones**. Each is usable as an element or an attribute and does exactly
one thing: put `.interop-button__prefix` / `.interop-button__suffix` on its host.
Source order is still layout order — a suffix written first renders first. The
foundation rules only constrain the slot itself:

```css
:where(
	button[interop-button] .interop-button__prefix,
	button[interop-button] .interop-button__suffix
) {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	flex: none;
	line-height: 1;
}
```

`flex: none` stops an addon growing to fill spare space; `line-height: 1` keeps a
1em icon vertically centred even though the button runs `line-height: 1`, because
the addon then measures to its own content rather than the button's leading.

Neither directive sets `aria-hidden`. That is deliberate and worth internalising:
a button's contents can _be_ its accessible name (icon-only buttons), so an
unconditional `aria-hidden` would erase it. Mark decorative addons
`aria-hidden="true"` yourself when a visible label is also present; for icon-only
buttons give the host an `aria-label` and leave the addon alone. Both warn in
dev-mode if applied to an interactive element — nesting a `<button>`/`<a>` inside
a button is invalid HTML.

## Visual pill via `::before`

The pill (background, border, focus ring, hover/active state colors) is rendered on the `::before` pseudo-element, not the host. This isolates the pill's `inset-block` from the host's padding, so the touch target (host padding-block + `--itx-button-touch-inset`) can extend past the visible pill on coarse pointers.

The inset is computed rather than fixed, and only under `@media (pointer: coarse)`:

```css
--itx-button-touch-inset: max(
	0px,
	(2.75rem - var(--itx-button-height, 2.5rem)) / 2
);
```

That floors the hit box at 44px for buttons shorter than 44px while leaving taller
ones alone. Because the pill's own `inset-block` matches the inset, the _visible_
height never changes — only the hit box grows. On fine pointers the inset is `0`
(the default) and hit box equals pill. Elements that opt out (e.g. the stepper
nav-trigger) set `--itx-button-touch-inset: 0` and win on later source order.

Focus ring uses `outline` on the pseudo-element, not the host, so the ring traces the pill shape rather than the touch box.

## State-resolved private slots

The CSS uses `--_background`, `--_foreground`, `--_border-color`, `--_box-shadow` and `--_icon-color` as state-internal slots. Pseudo-class rules (`:hover:not(:active)`, `:active`) re-assign these slots; the pill rule reads them. Each slot has a cascade: `*-hover` (or `-active`) falls back to the rest token, which falls back to `transparent` / `--itx-on-surface`. Themes set values, never selectors.

## Things to know when editing

- **Adding a new variant token**: it's a theme concern. The theme CSS adds a selector like `:where(button[interop-button~="quiet"]) { … }` and sets the relevant tokens. The component code doesn't need to know about it (other than the conflict warning — see below).
- **Adding/changing a size**: theme concern, and now a one-liner. Add an `:where(button[interop-button][itx-size="…"])` rule setting `--itx-button-height` and nothing else. Resist adding a font-size to it — a constant label at every step _is_ the model, and `xl` is the deliberate exception, not a precedent.
- **Retuning the whole scale**: there is no shared multiplier to turn any more. Edit the five heights. To move the default, change `--itx-button-height` on the base `[interop-root]` block (currently `2.5rem` = md).
- **Changing the default radius**: set `--itx-button-radius-default`, never `--itx-button-border-radius` — the latter is the hard override and would mask the `itx-radius` attribute.
- **Tuning the warning**: extend the `BUTTON_SIZES` / `BUTTON_VARIANTS` arrays in `interop-button.ts`. ⚠️ Both arrays are currently out of sync with reality — see "Known gaps." Touching the warning means deciding whether to keep scanning `interop-button` for sizes (currently does, shouldn't) and what the real variant vocabulary is now.
- **Loading-text template**: only a string today. The README mentions a `slot="loading"` pattern, but the live template just renders `loadingText()`. Rich loading content would need a `TemplateRef` input.

## Known gaps

- **`BUTTON_SIZES` / `BUTTON_VARIANTS` in `interop-button.ts` are stale.**
  - `BUTTON_SIZES = ["sm", "md", "lg"]` — but sizes now live on `itx-size` (not in the `interop-button` value), and the real scale is `xs/sm/md/lg/xl`. The warning scans the wrong attribute and the wrong set.
  - `BUTTON_VARIANTS = ["primary", "secondary", "ghost", "destructive"]` — half right since the Carbon borrow. `primary` and `secondary` are now real; `tertiary` (which is real) is missing, and `ghost` / `destructive` don't exist in CSS. `icon` and `grow` are real but absent too. The array predates the borrow and was never reconciled.
  - Net effect: the conflict warning rarely fires, and when it does fire it's on the wrong tokens.
- **`type` input not bound on host** — the input exists but the host bindings don't include `[type]`. Consumers must set `type="submit"` directly on the `<button>`. Likely a missed migration; harmless because native default is `button`.
- **Orphan `action` selector** — the theme's disabled block still targets `interop-button~="action"`, but no rest-state `action` variant exists any more. Dead branch, harmless.
- **Commented-out variants** — `destroy` and `caution` blocks survive as a large comment in the theme file, on the pre-Carbon colour language (raw `oklch`/`hsla` literals, drop shadows). They need re-deriving against the Carbon vocabulary before they come back, not uncommenting.
- **README out of sync** — the README references `ActivationManagerService` (the old name) and a `slot="loading"` content slot that the template doesn't honor.
