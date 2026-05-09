# InteropDialog — Mental Model Card

## Files

```
src/lib/components/interop-dialog/
  interop-dialog.ts             directive implementation
  public-api.ts                 barrel
src/lib/styles/components/dialog.css            structural rules
src/lib/styles/themes/protocol/components/dialog.css  token values
projects/demo/src/app/pages/dialog/             demo page
```

## Selector

```html
<dialog interop-dialog [isOpen]="open()" (closed)="onClosed($event)">
  ...
</dialog>
```

`InteropDialog` is a **Directive**, not a Component. The selector is an attribute on the native `<dialog>` element. The CSS targets `dialog[interop-dialog]` globally — no Angular component encapsulation involved.

## Inputs

| Input | Default | Effect |
|---|---|---|
| `isOpen` | `false` | Opens (`showModal()`) or closes (`close()`) the dialog |
| `dismissOnBackdrop` | `true` | Click outside the dialog emits `(closed)` with reason `'backdrop'` |
| `disableEscape` | `false` | When true, ESC key is suppressed; explicit close button required |
| `autoFocus` | `null` | CSS selector for the element to focus on open; null = native autofocus |
| `returnFocus` | `null` | `ElementRef`, CSS selector, or null (restores previously focused element) |
| `autoClose` | `false` | Close on internal form submit, emit reason `'form-submit'` |

## Outputs

| Output | Type | Fired when |
|---|---|---|
| `closed` | `{ reason: DialogCloseReason }` | Any close path — see reasons below |

### Close reasons

```typescript
type DialogCloseReason = 'backdrop' | 'escape' | 'programmatic' | 'form-submit';
```

- `'programmatic'` — `isOpen` was set to `false`
- `'backdrop'` — user clicked outside the dialog
- `'escape'` — user pressed ESC (when `disableEscape=false`)
- `'form-submit'` — form inside dialog submitted with `autoClose=true`

**Consumer responsibility**: when `(closed)` fires with reason `'backdrop'` or `'escape'`, the consumer must set `isOpen=false` to keep the signal in sync with the actual dialog state.

## Open/close mechanics

`isOpen` is driven by an `effect()`. When it flips to `true`, `dialog.showModal()` is called, which:
- Promotes the element to the top layer
- Creates the `::backdrop` pseudo-element
- Traps focus inside the dialog (native browser behavior)

When `isOpen` flips to `false`, `dialog.close()` is called, which fires the `'programmatic'` closed event.

ESC key fires the native `cancel` event on `<dialog>`. The directive always `preventDefault()` to keep the close path unified — it then emits `(closed)` with reason `'escape'` if `disableEscape=false`. The consumer's response (setting `isOpen=false`) then drives the actual `dialog.close()` through the effect.

## Focus management

On open: `previousFocus` captures `document.activeElement`, then `autoFocus` selector is applied via `afterNextRender()` (deferred until the top-layer has been entered).

On close: `restoreFocus()` checks (in priority order):
1. `returnFocus()` as `ElementRef`
2. `returnFocus()` as a CSS selector string
3. `previousFocus()` — the element that was focused before open

## Form submit

Do **not** use `<form method="dialog">` when `autoClose=true`. The browser closes the dialog before the directive's submit listener fires. Use a plain `<form>` (no method attribute).

## Dev-mode warnings

`afterNextRender` in devMode checks:
1. Missing `aria-label` or `aria-labelledby` on the `<dialog>` element
2. CSS transforms on any ancestor element (breaks top-layer fixed positioning)

## CSS structure (summary)

`dialog[interop-dialog]` — sizing (`width`, `max-height`, `padding`), appearance (background/color/border/shadow via tokens), entry/exit transitions.

`@starting-style` — entry: `opacity: 0; translate: 0 -0.75rem` → fades and slides in.

`:not([open])` exit — `opacity: 0; translate: 0 0.25rem` + exit-duration/easing tokens.

`dialog[interop-dialog]::backdrop` — `background` + `backdrop-filter` with enter transition. The `::backdrop` rule intentionally does NOT use `:where()` — pseudo-elements cannot appear inside `:where()`, so it carries its natural specificity.

`@starting-style { dialog[interop-dialog][open]::backdrop }` — entry: background fades from `transparent`.

Browsers without `transition-behavior: allow-discrete` get a `@supports not` fallback that only animates `opacity` and `translate` (no animated display/overlay).

## Accessibility notes

- The native `<dialog>` provides focus trap, ARIA `role="dialog"`, and scroll lock automatically.
- Add `aria-label` or `aria-labelledby` on the `<dialog>` element to announce purpose.
- Nested dialogs are architecturally possible but not recommended — focus and escape management across dialog stacks is complex and not currently supported.
