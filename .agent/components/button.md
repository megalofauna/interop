# InteropButton — Mental Model Card

## Files

```
src/lib/components/interop-button/
  interop-button.ts            component — styling, disabled/loading state, aria
  interop-button-activation.ts directive — activation guardrails (opt-in import)
  interop-button.html          template — loading swap (loading text vs <ng-content />)
  interop-button-map.ts        ITX_BUTTON_MAP token + InteropButtonMap directive
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
imports: [InteropButton]

// Full activation guardrails
imports: [InteropButton, InteropButtonActivation]
```

```html
<!-- No activation — (click) binding works normally -->
<button interop-button (click)="save()">Save</button>

<!-- With guardrails — requires InteropButtonActivation in imports -->
<button interop-button
        [onActivate]="submit"
        [activationOptions]="{ throttleMs: 500, reentrant: false }">
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

| Axis | Attribute | Example |
|---|---|---|
| Identity + variant | `interop-button="…"` | `interop-button="action"`, `interop-button="icon"`, bare `interop-button` |
| Size | `itx-size="…"` | `xs` \| `sm` \| `md` \| `lg` \| `xl` |
| Radius | `itx-radius="…"` | `sm` \| `md` \| `lg` \| `full` |

Variant **stays as a value on the identity attribute** — it's definitional (a "primary button" is a kind of button, not a tuning of one). Size and radius are orthogonal quantitative axes shared system-wide and live on `itx-*`. See [playbook.md](../playbook.md) for the full convention.

```html
<button interop-button="action" itx-size="md" itx-radius="sm">Save</button>
<button interop-button="icon" itx-size="sm">…</button>
<button interop-button itx-size="md">Plain</button>
```

**CSS selector forms:**
```css
:where(button[interop-button])                            { /* base */ }
:where(button[interop-button~="action"])                  { /* variant */ }
:where(button[interop-button][itx-size="md"])             { /* size */ }
:where(button[interop-button][itx-radius="sm"])           { /* radius */ }
```

The variant selector uses `~=` (word-match) so multiple variant tokens compose (`interop-button="icon action"`). `warnOnConflictingTokens` runs in devMode and emits a console warning when conflicting variant tokens are present. ⚠️ The current warning scans for sizes in the `interop-button` value too — that detection is stale; sizes now live on `itx-size`. See "Known gaps."

## Sizing system

Driven by two tokens, set in the theme:

```css
--itx-button-padding-step: 0.1875rem;     /* the smallest tick (3px) */
--itx-button-padding-consequent: 1.5;     /* inline-to-block ratio */
--itx-button-sizing-multiplier: 2;        /* default = sm */
```

The size selector only changes the multiplier:

| `itx-size` | multiplier | padding (block/inline) | font-size |
|---|---|---|---|
| `xs` | 1 |  3 / 4.5 px | `--itx-fs-xs` |
| `sm` | 2 |  6 / 9 px   | `--itx-fs-sm` |
| `md` | 3 |  9 / 13.5 px | `--itx-fs-base` |
| `lg` | 4 | 12 / 18 px  | `--itx-fs-base` |
| `xl` | 6 | 18 / 27 px  | `--itx-fs-base` |

`padding-block = step × multiplier`; `padding-inline = padding-block × consequent`.

**Critical CSS placement:** the calc declarations live on `:where(button[interop-button])` itself, **not on `[interop-root]`**. Custom-property values containing `var()` are computed at the element where the property is declared — declaring `--itx-button-padding-block` on `[interop-root]` would bake the multiplier into the inherited computed value and freeze it across sizes. Declared on the button, the calc re-resolves whenever a size selector overrides `--itx-button-sizing-multiplier`.

## Radius system

`itx-radius` tiers are expressed as fractions of the same size unit:

```css
:where(button[interop-button][itx-radius="sm"]) {
  --itx-button-border-radius: calc(
    var(--itx-button-padding-step) * var(--itx-button-sizing-multiplier) * 0.5
  );
}
/* md = ×1, lg = ×2, full = var(--itx-radius-full) */
```

Same placement lesson as padding — declared at the button, not root.

⚠️ **Known calibration issue:** the proportional formula scales radii linearly with the size unit, but visual "roundness" is non-linear — at large sizes (`xl`), `lg` reads almost pill-shaped, while at `xs` it reads as a mild curve. The math is right; perception isn't. Treated as a "revisit later when the visual language is settled" — see the recent conversation history. Don't tinker without a clear visual reference to calibrate against.

The earlier absolute `radius-xs/sm/md/...` variant tokens that read from `--itx-radius-N` have been retired. Consumers wanting an absolute radius set `--itx-button-border-radius` directly.

## Consumer vocabulary mapping (ITX_BUTTON_MAP)

`InteropButtonMap` is a **separate directive** with the same selector. When a consumer provides `ITX_BUTTON_MAP`, the directive's `ngOnInit` reads the `interop-button` attribute value, expands each token through the map, dedupes, and rewrites the attribute *before* CSS resolves it.

Scope: the map operates **only on the `interop-button` attribute** — i.e., variants. Sizes (`itx-size`) and radii (`itx-radius`) live on separate attributes and aren't part of the vocabulary translation. A consumer who wants their `primary` keyword to mean `action` writes `{ primary: 'action' }`; size handling stays canonical.

Critical detail: the rewrite happens **at init**, not at change-detection time. The map is treated as a build-time vocabulary translator, not a reactive concern. Consumers import `InteropButtonMap` alongside `InteropButton` only when they're using a map.

## Disabled vs loading — three semantic states

This is the model the user must internalise. The combinations and the attributes they produce:

| State | `disabled` attr | `aria-disabled` | `aria-busy` | In tab order |
|---|---|---|---|---|
| `disabled` (default) | ✓ | — | — | no |
| `disabled` + `focusableWhenDisabled` | — | `true` | — | yes |
| `loading` | — | `true` | `true` | yes |

- **Default disabled** uses the native attribute — best for "this action is structurally unavailable." Browsers, form engines, and AT all understand it. Cost: keyboard users cannot reach the button to learn it exists.
- **`focusableWhenDisabled`** is the opt-in for "temporarily gated, discoverability matters" — e.g. a submit button blocked by form validity. The button stays in the tab order so a keyboard user can land on it and (eventually) be told why they can't proceed. The host `click` listener enforces the interaction block that native `disabled` would have provided.
- **Loading** never uses the native `disabled` attribute: the button must stay focusable so a screen reader user who reaches it mid-operation hears "loading," not silence. CSS suppresses pointer interaction; the click guard catches keyboard activation.

Roadmap: a `disabledReason` input (string | TemplateRef) wiring `aria-describedby` to a tooltip — only useful when `focusableWhenDisabled` is on, since natively-disabled elements can't receive focus and therefore can't expose a tooltip.

## Activation: three paths through the click handler (`InteropButtonActivation`)

The activation directive's `@HostListener("click")` routes through this priority:

```typescript
if (this.button?.isDisabled()) { event.preventDefault(); return; }

const local = this.localActivation();           // 1. [onActivate] handler
if (local) { local(this.payload()); return; }

const id = this.activationId();                 // 2. cross-component trigger
if (id) { this.activationService?.trigger(id, this.payload()); }
// 3. otherwise: fall through to consumer's own (click) — native button click
```

1. `[onActivate]` — a local handler wrapped by `createActivationHandler` with guardrails (debounce/throttle/reentrancy/once). The wrapped handler lives in a signal (`localActivation`) so it rebuilds reactively when `onActivate` or `activationOptions` changes.
2. `[activationId]` — fires a registered handler on `InteropActivation` (optional injection). A common pattern is a single registered handler activated from multiple buttons in different parts of the UI.
3. Neither set — the host listener is a no-op. The consumer's `(click)` binding (if any) still runs because the listener is non-stopping. A vanilla `<button interop-button (click)="...">` works.

Note: `InteropButton` also has a `@HostListener("click")` — it calls `event.preventDefault()` when `isDisabled()` (the form-submission guard for `aria-disabled` cases). When both directives are present, both run; the duplication is harmless.

## Inputs

### `InteropButton`

| Input | Type | Default | Effect |
|---|---|---|---|
| `loading` | `boolean` | `false` | Swaps content for `loadingText`, sets `aria-busy` |
| `disabled` | `boolean` | `false` | Native `disabled` attr (unless `focusableWhenDisabled`) |
| `focusableWhenDisabled` | `boolean` | `false` | Switch to `aria-disabled` for discoverability |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Bound to the host (not currently — see "Gaps") |
| `loadingText` | `string` | `'Loading...'` | Shown in template when `loading=true` |

### `InteropButtonActivation`

| Input | Type | Default | Effect |
|---|---|---|---|
| `onActivate` | `ActivationHandler<unknown> \| null` | `null` | Local handler with activation guardrails |
| `activationId` | `string \| null` | `null` | Triggers a handler registered on `InteropActivation` |
| `payload` | `unknown` | `undefined` | Passed to the handler |
| `activationOptions` | `ActivationOptions` | `{}` | `{ debounceMs, throttleMs, reentrant, once }` |

## Computed

- `InteropButton.isDisabled = disabled() || loading()` — single source of truth for interaction suppression; read by `InteropButtonActivation` via injection
- `InteropButtonActivation.canActivate = !isDisabled && (onActivate || activationId)` — exposed but not bound in the template; useful for consumers building affordances around buttons

## Layout: source-order content with gap

The button is `display: inline-flex; gap: var(--itx-button-gap)`. Any content the consumer projects renders left-to-right (or RTL-flipped) in source order, with the same `gap` between every adjacent pair. **There are no built-in prefix/suffix slots** — icons go before or after text purely by where the author writes them.

This is the in-progress design question — see `.agent/components/button.md`'s sibling discussion of prefix/suffix nomenclature and slot options (separate doc in this work-in-progress branch).

## Visual pill via `::before`

The pill (background, border, focus ring, hover/active state colors) is rendered on the `::before` pseudo-element, not the host. This isolates the pill's `inset-block` from the host's padding, so the touch target (host padding-block + `--itx-button-touch-inset`) can extend past the visible pill on coarse pointers. `@media (pointer: fine)` collapses the inset so hit area equals the visible pill on desktops.

Focus ring uses `outline` on the pseudo-element, not the host, so the ring traces the pill shape rather than the touch box.

## State-resolved private slots

The CSS uses `--_background`, `--_foreground`, `--_border-color`, `--_box-shadow` as state-internal slots. Pseudo-class rules (`:hover`, `:active`, `:focus-visible`) re-assign these slots; the pill rule reads them. Each slot has a cascade: `*-active` (or hover) falls back to the rest token, which falls back to `transparent`/`inherit`. Themes set values, never selectors.

## Things to know when editing

- **Adding a new variant token**: it's a theme concern. The theme CSS adds a selector like `:where(button[interop-button~="action-plus"]) { … }` and sets the relevant tokens. The component code doesn't need to know about it (other than the conflict warning — see below).
- **Adding/changing sizes or radii**: theme concern. Add an `:where(button[interop-button][itx-size="…"])` rule that sets `--itx-button-sizing-multiplier` (and font-size if needed). Adjust `--itx-button-padding-step` and `--itx-button-padding-consequent` if the whole scale needs retuning.
- **Tuning the warning**: extend the `BUTTON_SIZES` / `BUTTON_VARIANTS` arrays in `interop-button.ts`. ⚠️ Both arrays are currently out of sync with reality — see "Known gaps." Touching the warning means deciding whether to keep scanning `interop-button` for sizes (currently does, shouldn't) and what the real variant vocabulary is now.
- **Loading-text template**: only a string today. The README mentions a `slot="loading"` pattern, but the live template just renders `loadingText()`. Rich loading content would need a `TemplateRef` input.

## Known gaps

- **`BUTTON_SIZES` / `BUTTON_VARIANTS` in `interop-button.ts` are stale.**
  - `BUTTON_SIZES = ["sm", "md", "lg"]` — but sizes now live on `itx-size` (not in the `interop-button` value), and the real scale is `xs/sm/md/lg/xl`. The warning scans the wrong attribute and the wrong set.
  - `BUTTON_VARIANTS = ["primary", "secondary", "ghost", "destructive"]` — but the theme CSS actually targets `action`, `action-plus`, `action-minus`, `fancy`, `icon`, `caution`, `destroy`. The `primary/secondary/ghost/destructive` vocabulary doesn't exist in CSS today; it appears to be the *intended consumer-facing vocabulary* that `ITX_BUTTON_MAP` is supposed to expand from.
  - Net effect: the conflict warning rarely fires, and when it does fire it's on the wrong tokens.
- **`type` input not bound on host** — the input exists but the host bindings don't include `[type]`. Consumers must set `type="submit"` directly on the `<button>`. Likely a missed migration; harmless because native default is `button`.
- **No prefix/suffix slots** — the README's "flexible icon positioning" relies on the consumer placing the icon themselves. Anything wanting `<interop-button-prefix>` / `<interop-button-suffix>` semantics (or `interop-field` parity) is currently a design exercise.
- **README out of sync** — the README references `ActivationManagerService` (the old name) and a `slot="loading"` content slot that the template doesn't honor.
- **Radius perceptual scaling** — see "Radius system" above; proportional formula doesn't read right at scale extremes.
