# InteropButton — Mental Model Card

## Files

```
src/lib/components/interop-button/
  interop-button.ts          component (selector: button[interop-button])
  interop-button.html        template — loading swap (loading text vs <ng-content />)
  interop-button-map.ts      ITX_BUTTON_MAP token + InteropButtonMap directive (vocabulary translation)
  interop-button.spec.ts     tests
  README.md                  consumer-facing usage doc
src/lib/styles/components/button.css            structural rules
src/lib/styles/themes/protocol/components/button.css  token values
```

## Selector and shape

`selector: "button[interop-button]"` — applies as an attribute on a native `<button>`. The component owns no wrapper element; the `<button>` *is* the host.

A dev-mode constructor check warns if the directive is applied to a non-button tag. The semantic enforcement is intentional: anchors, divs, and inputs all have wrong defaults for activation, focus, or form participation.

The template body is minimal:

```html
@if (loading()) {
  <span class="interop-button__loading-text">{{ loadingText() }}</span>
} @else {
  <ng-content />
}
```

Everything else — visual pill, focus ring, padding, gap, disabled treatment — is global CSS keyed to the `[interop-button]` attribute, so consumers who only import the stylesheet (no Angular) get the look without the behavior.

## Token vocabulary system

The `interop-button` attribute carries a **space-separated list of style tokens** that drive theme CSS (e.g. `interop-button="action md radius-sm"`). The component itself doesn't read these tokens — the theme CSS does. Tokens are author intent: size (`sm`/`md`/`lg`), variant (`primary`/`secondary`/`ghost`/`destructive`/`action`/`action-plus`/`action-minus`/`destroy`), and modifiers (`radius-sm`, `icon`, …).

`warnOnConflictingTokens` runs in devMode and emits a console warning when conflicting size or variant tokens are present — "last wins" survives but the author hears about it.

## Consumer vocabulary mapping (ITX_BUTTON_MAP)

`InteropButtonMap` is a **separate directive** with the same selector. When a consumer provides `ITX_BUTTON_MAP`, the directive's `ngOnInit` reads `interop-button="primary md"`, expands each token through the map, dedupes, and rewrites the attribute *before* CSS resolves it.

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

## Activation: three paths through the click handler

The host `(click)` listener routes through this priority:

```typescript
if (this.isDisabled()) { event.preventDefault(); return; }

const local = this.localActivation();           // 1. [onActivate] handler
if (local) { local(this.payload()); return; }

const id = this.activationId();                 // 2. cross-component trigger
if (id) { this.activationService?.trigger(id, this.payload()); }
// 3. otherwise: fall through to consumer's own (click) — native button click
```

1. `[onActivate]` — a local handler wrapped by `createActivationHandler` with guardrails (debounce/throttle/reentrancy/once). The wrapped handler lives in a signal (`localActivation`) so it rebuilds reactively when `onActivate` or `activationOptions` changes.
2. `[activationId]` — fires a registered handler on `InteropActivation` (optional injection). A common pattern is a single registered handler activated from multiple buttons in different parts of the UI.
3. Neither set — the host listener is a no-op. The consumer's `(click)` binding (if any) still runs because the listener is non-stopping. A vanilla `<button interop-button (click)="...">` works.

`isDisabled = disabled() || loading()` — both states suppress activation through all three paths.

## Inputs

| Input | Type | Default | Effect |
|---|---|---|---|
| `onActivate` | `ActivationHandler<unknown> \| null` | `null` | Local handler with activation guardrails |
| `activationId` | `string \| null` | `null` | Triggers a handler registered on `InteropActivation` |
| `payload` | `unknown` | `undefined` | Passed to the handler |
| `activationOptions` | `ActivationOptions` | `{}` | `{ debounceMs, throttleMs, reentrant, once }` |
| `loading` | `boolean` | `false` | Swaps content for `loadingText`, sets `aria-busy` |
| `disabled` | `boolean` | `false` | Native `disabled` attr (unless `focusableWhenDisabled`) |
| `focusableWhenDisabled` | `boolean` | `false` | Switch to `aria-disabled` for discoverability |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Bound to the host (not currently — see "Gaps") |
| `loadingText` | `string` | `'Loading...'` | Shown in template when `loading=true` |

## Computed

- `isDisabled = disabled() || loading()` — single source of truth for interaction suppression
- `canActivate = !isDisabled && (onActivate || activationId)` — currently exposed but not bound in the template. Useful for consumers building affordances around buttons.

## Layout: source-order content with gap

The button is `display: inline-flex; gap: var(--itx-button-gap)`. Any content the consumer projects renders left-to-right (or RTL-flipped) in source order, with the same `gap` between every adjacent pair. **There are no built-in prefix/suffix slots** — icons go before or after text purely by where the author writes them.

This is the in-progress design question — see `.agent/components/button.md`'s sibling discussion of prefix/suffix nomenclature and slot options (separate doc in this work-in-progress branch).

## Visual pill via `::before`

The pill (background, border, focus ring, hover/active state colors) is rendered on the `::before` pseudo-element, not the host. This isolates the pill's `inset-block` from the host's padding, so the touch target (host padding-block + `--itx-button-touch-inset`) can extend past the visible pill on coarse pointers. `@media (pointer: fine)` collapses the inset so hit area equals the visible pill on desktops.

Focus ring uses `outline` on the pseudo-element, not the host, so the ring traces the pill shape rather than the touch box.

## State-resolved private slots

The CSS uses `--_background`, `--_foreground`, `--_border-color`, `--_box-shadow` as state-internal slots. Pseudo-class rules (`:hover`, `:active`, `:focus-visible`) re-assign these slots; the pill rule reads them. Each slot has a cascade: `*-active` (or hover) falls back to the rest token, which falls back to `transparent`/`inherit`. Themes set values, never selectors.

## Things to know when editing

- **Adding a new variant token**: it's a theme concern. The theme CSS adds a selector like `:where(button[interop-button~="action-plus"]) { … }` and sets the relevant tokens. The component code doesn't need to know about it.
- **Adding to the conflict warning**: extend the `BUTTON_SIZES` / `BUTTON_VARIANTS` arrays in the component. The warning is intentionally conservative — only tokens that conflict warrant noise.
- **Loading-text template**: only a string today. The README mentions a `slot="loading"` pattern, but the live template just renders `loadingText()`. Rich loading content would need a `TemplateRef` input.

## Known gaps

- **`type` input not bound on host** — the input exists but the host bindings don't include `[type]`. Consumers must set `type="submit"` directly on the `<button>`. Likely a missed migration; harmless because native default is `button`.
- **No prefix/suffix slots** — the README's "flexible icon positioning" relies on the consumer placing the icon themselves. Anything wanting `<interop-button-prefix>` / `<interop-button-suffix>` semantics (or `interop-field` parity) is currently a design exercise.
- **README out of sync** — the README references `ActivationManagerService` (the old name) and a `slot="loading"` content slot that the template doesn't honor.
