# InteropField — Mental Model Card

## Files

```
src/lib/components/interop-field/
  public-api.ts                              barrel
  shared/
    field-base.ts                            FieldBase abstract Directive + provideFieldValueAccessor
  interop-field-input/
    interop-field-input.ts                   <interop-field-input> — extends FieldBase
    interop-field-input.html                 label + control + prefix/suffix slots + notes + errors
    interop-field-input.scss                 component styles
  interop-field-textarea/
    interop-field-textarea.ts                <interop-field-textarea> — extends FieldBase, adds autoResize/rows
    interop-field-textarea.html              same layout, <textarea> in place of <input>
    interop-field-textarea.scss              component styles
  internal/
    field-elements.ts                        Zero-logic semantic element directives:
                                               <interop-field-control>, <interop-field-errors>,
                                               <interop-field-notes>
  primitives/
    interop-field-prefix/interop-field-prefix.ts   marker directive (aria-hidden)
    interop-field-suffix/interop-field-suffix.ts   marker directive (aria-hidden)
  errors/
    field-error.model.ts                     FieldError, ErrorMessages types
    default-error-messages.ts                INTEROP_DEFAULT_ERROR_MESSAGES (required/min/max/email/…)
    error-messages.token.ts                  INTEROP_ERROR_MESSAGES app-level injection token
    resolve-errors.ts                        ValidationErrors → FieldError[] resolver
    public-api.ts                            errors barrel
```

## What "field" means here

A **field** is the full unit: visible label + bordered control + optional notes + optional error list + ARIA wiring. Two concrete components ship today, both extending `FieldBase`:

```html
<interop-field-input id="email" label="Email" type="email" [formControl]="ctrl" />
<interop-field-textarea id="bio" label="Bio" [formControl]="ctrl" [autoResize]="true" />
```

The components are the *only* public consumer surface. Consumers don't compose label + input + errors themselves — the component owns the whole stack and the ARIA glue between them.

## Architecture: abstract base + thin concretes

`FieldBase` (in `shared/field-base.ts`, an `@Directive({ standalone: true })` so Angular processes inputs/host bindings/DI on it) carries everything common:

- Required `id` and `label` inputs
- `required`, `placeholder`, `disabled`, `readonly` inputs forwarded to the native element
- `control` (manual `AbstractControl`), `fieldErrors` (manual array), `fieldNotes` inputs
- `errorMessages` per-field override map, `showErrorsOn` (`'touched' | 'dirty' | 'immediate'`), `errorDisplay` (`'single' | 'all'`)
- CVA implementation (`writeValue`/`registerOnChange`/`registerOnTouched`)
- Error resolution pipeline (see below)
- ARIA computeds: `describedByIds`, `firstErrorId`
- `focused` signal, `onInput`/`onTouched` template handlers

Concrete subclasses are thin:

- `InteropFieldInput` — adds `type` input, wires CVA via `inject(NgControl, { self: true, optional: true })` + `ngControl.valueAccessor = this`, calls `setCvaControl(ngControl.control)` in `afterNextRender`. Dev-mode warning if `type="textarea"`.
- `InteropFieldTextarea` — adds `autoResize` and `rows` inputs, same CVA wiring. Overrides `onInput` to call `resizeToFit()` which writes `style.height = auto` then `${scrollHeight}px`.

The self-injection CVA pattern (not `NG_VALUE_ACCESSOR` provider) is deliberate — see `provideFieldValueAccessor` doc-comment: using both simultaneously causes NG0200. The exported helper is *only* for external CVAs built on `FieldBase`, not the two components in this library.

## Semantic internal elements

`internal/field-elements.ts` declares three zero-logic directives:

```typescript
@Directive({ selector: "interop-field-control", standalone: true }) class FieldControlElement {}
@Directive({ selector: "interop-field-errors", standalone: true })  class FieldErrorsElement {}
@Directive({ selector: "interop-field-notes", standalone: true })   class FieldNotesElement {}
```

They exist solely to register the custom element names with Angular's template compiler so the internal HTML can use semantic names instead of `<div>`. Internal only — never exported in `public-api`. Adding a new one is two lines.

## Template shape (input variant)

```html
<label [attr.for]="id()" class="interop-field-label">{{ label() }}</label>

<interop-field-control [class.focused]="focused()" [class.invalid]="hasVisibleErrors()" …>
  <ng-content select="[interop-field-prefix]" />
  <input
    [id]="id()" [type]="type()" [value]="value()" …
    [attr.aria-describedby]="describedByIds()"
    [attr.aria-errormessage]="firstErrorId()"
    (input)="onInput($event)"
    (focus)="focused.set(true)"
    (blur)="focused.set(false); onTouched()" />
  <ng-content select="[interop-field-suffix]" />
</interop-field-control>

@if (normalizedNotes().length) {
  <interop-field-notes>
    @for (note of normalizedNotes(); track $index) {
      <span class="interop-field-note" [id]="noteId($index)">{{ note }}</span>
    }
  </interop-field-notes>
}

@if (hasVisibleErrors()) {
  <interop-field-errors role="alert">
    @for (error of visibleErrors(); track error.key ?? $index) {
      <span class="interop-field-error" [id]="errorId($index)">{{ error.message }}</span>
    }
  </interop-field-errors>
}
```

Textarea variant is identical except for the native element and the `#textareaEl` viewChild for auto-resize.

## Visual language — Carbon Text Input / Text Area (borrow round 10)

The field's look is lifted from IBM Carbon, per `.agent/workflows/carbon-borrow.md`. Four decisions carry it:

1. **A filled slab, not an outlined box.** `--itx-field-background` defaults to `--itx-surface-above`. Carbon's `$field-01` is a grey recess on a white page; our elevation model runs the other way, so the polarity is inverted and the figure/ground relationship preserved. Dark mode comes free from the `light-dark()` neutral pair.
2. **One border.** `border: none` plus a single `border-block-end` at `--itx-neutral-8` (Carbon's `$border-strong`). Deliberately stronger than the `--itx-neutral-7` hairline the other borrows use, because here the rule *is* the affordance.
3. **Fixed heights on `itx-size`** — 32 / 40 / 48, with 16px inline padding and 14px type held constant at every step.
4. **Label above, helper below**, both at 12/16 and both quieter than the value.

Squared throughout (`--itx-radius-none`; Carbon specifies no radius on any field). Focus and invalid are both 2px **inset** rings (`outline-offset: -2px`) so the control always measures exactly its size step — focus in `--itx-colorway`, invalid in `--itx-danger`, and **focus outranks invalid** (Carbon's `[data-invalid]:not(:focus)`). Invalid additionally recolours the underline — that part is ours, so a focused invalid field still carries the signal — and renders a 16px WarningFilled glyph as a CSS mask on `interop-field-control::after`, which means it needs no template element and takes its colour from a token.

Disabled keeps the fill and drops the underline to transparent (the missing rule is the signal); read-only does the opposite — no fill, softer `--itx-neutral-4` rule.

### Where the styles live — and the debt

**Field is not on the library's two-file split.** Both sub-components are styled from their own `styleUrl` in SCSS, like `interop-progress`. There is no `styles/components/field.css` and no `themes/protocol/components/field.css`.

Consequence: **a CSS-only consumer gets no field styling at all.** That is the one thing the global stylesheet exists to provide, and it matters more here than elsewhere given the framework-portability direction in `project_angular_waystation`.

Neither `.scss` file uses a single SCSS feature — they are plain CSS wearing a `.scss` extension. The one thing SCSS *would* buy (a shared `_field-shared.scss` partial) is exactly what would fix the duplication below, and it is not used.

The two files are near-identical by design and must stay that way. Values that have to agree are named as tokens and read through `var()` so the shared block is byte-identical and a diff shows drift; the literal defaults are still typed twice. Migration steps are written out in the header of `interop-field-input.scss`.

Both files belong on the shared ledger in `.agent/todo/styleurl-components-migration.md` — that list was compiled from a different round and does not name them yet.

### Token surface

One `--itx-field-*` namespace, shared by both components. Every read carries its default inline, so setting a token on **any ancestor** works — the files never declare a public token on the host except in the `itx-size` blocks.

| Token | Default | Notes |
|---|---|---|
| `--itx-field-gap` | `var(--itx-spacing-1)` — 4px | control ↔ helper ↔ error |
| `--itx-field-label-color` | `var(--itx-neutral-9)` | `$text-secondary` |
| `--itx-field-label-font-size` | `0.75rem` | `$label-01`; fixed rem, never `--itx-font-size-*` |
| `--itx-field-label-font-weight` | `400` | |
| `--itx-field-label-line-height` | `1.3333` | |
| `--itx-field-label-gap` | `var(--itx-spacing-1)` — 4px | on top of `--itx-field-gap` → 8px under the label |
| `--itx-field-required-indicator` | `" *"` | set `""` to suppress |
| `--itx-field-required-indicator-color` | `var(--itx-danger)` | |
| `--itx-field-height` | `var(--itx-spacing-10)` — 40px | height on input, **minimum** height on textarea |
| `--itx-field-padding-inline` | `var(--itx-spacing-4)` — 16px | constant at every size step |
| `--itx-field-background` | `var(--itx-surface-above)` | |
| `--itx-field-background-hover` | `var(--itx-surface-hover)` | |
| `--itx-field-underline-width` | `1px` | |
| `--itx-field-underline-color` | `var(--itx-neutral-8)` | `$border-strong` |
| `--itx-field-border-radius` | `var(--itx-radius-none)` | |
| `--itx-field-focus-color` | `var(--itx-colorway)` | semantic token, so it survives dark mode |
| `--itx-field-focus-width` | `2px` | also the invalid ring width |
| `--itx-field-invalid-color` | `var(--itx-danger)` | ring + underline + glyph |
| `--itx-field-invalid-icon-size` | `1rem` | |
| `--itx-field-readonly-underline-color` | `var(--itx-neutral-4)` | `$border-subtle` |
| `--itx-field-disabled-color` | `var(--itx-neutral-7)` | value, label and notes |
| `--itx-field-transition-duration` | `var(--itx-duration-fast)` — 100ms | Carbon uses 70ms |
| `--itx-field-addon-gap` | `var(--itx-spacing-2)` — 8px | |
| `--itx-field-addon-color` | `var(--itx-muted)` | |
| `--itx-field-font-family` | `var(--itx-font-family-sans)` | |
| `--itx-field-font-size` | `0.875rem` | |
| `--itx-field-line-height` | `1.2857` input / `1.4286` textarea | `$body-compact-01` vs `$body-01` |
| `--itx-field-color` | `var(--itx-on-surface)` | |
| `--itx-field-placeholder-color` | `var(--itx-neutral-8)` | one step darker than Carbon's failing gray-40 |
| `--itx-field-textarea-padding-block` | `0.6875rem` — 11px | textarea only |
| `--itx-field-textarea-min-inline-size` | `10rem` | textarea only |
| `--itx-field-textarea-resize` | `vertical` | textarea only |
| `--itx-field-note-color` | `var(--itx-muted)` | |
| `--itx-field-note-font-size` | `0.75rem` | `$helper-text-01` |
| `--itx-field-note-line-height` | `1.3333` | |
| `--itx-field-notes-gap` | `var(--itx-spacing-1)` — 4px | |
| `--itx-field-error-color` | `var(--itx-danger)` | `$text-error` |
| `--itx-field-error-font-size` | `0.75rem` | |
| `--itx-field-error-line-height` | `1.3333` | |
| `--itx-field-errors-gap` | `var(--itx-spacing-1)` — 4px | |

Renamed / removed in the borrow (no consumers existed): `--itx-field-bg` → `--itx-field-background`; `--itx-field-border-width` / `-style` / `-color` → `--itx-field-underline-*`; `--itx-field-invalid-border-color` and `--itx-field-invalid-focus-color` → one `--itx-field-invalid-color`; `--itx-field-padding-block` and `--itx-field-disabled-opacity` dropped.

### Sizing

`itx-size` on the **host** — `sm` 32px / `md` 40px (default) / `lg` 48px. Only the height moves; Carbon treats density (inline padding) as a separate axis and so do we. Carbon's `xs` (24px) is not taken: it sits exactly on the WCAG 2.2 SC 2.5.8 target-size floor and cannot fit the 16px error glyph.

The attribute lands on the host and the read happens on `interop-field-control`, a descendant — which is what keeps it clear of the `var()` resolution trap described in the borrow workflow.

On a textarea `itx-size` sets `min-block-size` rather than `block-size`, so a textarea starts flush with an input beside it and grows from there.

### Typography isolation

Both components carry a static `interop-typography-isolate` host attribute. The field owns its own fixed type scale — 12px label, 14px value, 12px helper, inside a pinned-height control — and a global `interop-typography-root` would otherwise let prose's fluid `clamp()` sizes and rhythm margins land on shapes the component never declared. See the round 3 note in the borrow workflow.

## Prefix and suffix primitives

`InteropFieldPrefix` and `InteropFieldSuffix` are **attribute marker directives** (`selector: "interop-field-prefix, [interop-field-prefix]"` — element or attribute form). They set `aria-hidden="true"` and a class for styling. Devmode warning if applied to a `<button>` or `<a>` — those are interactive, would need their own accessible name, and `aria-hidden` would erase it from the AT tree.

This is the **static-addon** model: currency symbols, units, decorative icons. Interactive prefixes (clear button, password toggle) are the consumer's responsibility — a regular `<button>` with `aria-label` projected into the same slot, with the marker directive omitted.

## Error resolution pipeline

Three-level message resolution (most-specific wins):

```
INTEROP_DEFAULT_ERROR_MESSAGES  ←  INTEROP_ERROR_MESSAGES token  ←  [errorMessages] input
```

`resolveErrors(validationErrors, messages)` walks `Object.keys(validationErrors)` in insertion order — Angular preserves it, and that order *is* the priority. The first key is the highest-priority error. Each message can be a string or a function `(errorValue) => string` for parametrised messages (e.g. `minlength: err => 'Must be at least ${err.requiredLength}'`).

The base routes through a chain of computeds, all signal-reactive:

```
fieldErrors (manual)  →  normalizedFieldErrors  ─┐
                                                 ├→ resolvedErrors  →  visibleErrors → hasVisibleErrors
control / cvaControl  →  activeControl  ─────────┘                  ↑
                          ↓                                          shouldShowErrors
                       (errors)                                          ↑
                                                              showErrorsOn ('touched'|'dirty'|'immediate')
                                                              + cvaControl.touched / .dirty
```

Manual `[fieldErrors]` *always* shows immediately (consumer-controlled visibility); CVA-derived errors are gated by `shouldShowErrors`.

### The `ctrlRevision` trick

`AbstractControl.errors`, `.touched`, `.dirty` are NOT signals. The base subscribes to `control.events` (Angular Forms emits on every value/status/touched/dirty change) and bumps a `ctrlRevision = signal(0)` counter. Computeds that read `.errors`/`.touched`/`.dirty` also read `ctrlRevision()` — that's what makes them re-evaluate when the control changes. Subscription is created in `setCvaControl` and torn down via `DestroyRef`.

If you need to add a new control-derived computed, read `ctrlRevision()` inside it.

## ARIA wiring

The base composes `aria-describedby` from note IDs (`{id}-note-{i}`) and visible error IDs (`{id}-error-{i}`), joined with spaces — returns `null` when empty (don't emit a blank attribute). `aria-errormessage` points to the first error ID, or `null`. Host attributes (`data-invalid`, `data-disabled`, `data-required`, `data-readonly`) mirror state for CSS styling hooks.

## Inputs

`FieldBase` (shared):

| Input | Type | Default | Notes |
|---|---|---|---|
| `id` | `string` | required | `<label for>` and native element `id` |
| `label` | `string` | required | Label text |
| `required` | `boolean` | `false` | Sets `aria-required` + visual indicator |
| `placeholder` | `string` | `""` | Forwarded to native |
| `disabled` | `boolean` | `false` | Forwarded to native |
| `readonly` | `boolean` | `false` | Forwarded to native |
| `control` | `AbstractControl \| null` | `null` | Explicit override; otherwise auto-detected via CVA |
| `fieldErrors` | `FieldError \| FieldError[] \| null` | `null` | Manual errors; bypasses CVA, always visible |
| `fieldNotes` | `string \| string[] \| null` | `null` | Hint text(s) |
| `errorMessages` | `ErrorMessages` | `{}` | Per-field override map |
| `showErrorsOn` | `'touched' \| 'dirty' \| 'immediate'` | `'touched'` | When to show CVA-derived errors |
| `errorDisplay` | `'single' \| 'all'` | `'single'` | Show only highest-priority vs every active |

`required` now really does render a visual indicator — the `--itx-field-required-indicator` asterisk after the label, driven off the host's `data-required`. Before the borrow the token was documented and nothing read it, so the input's only effect was `aria-required`. Note Carbon does the opposite by default: it marks *optional* fields with the word "(optional)" and leaves required ones bare, on the argument that marking the exception is less noise. Expressing that needs a template change, so it was not taken.

Not an input: `itx-size` is a plain attribute (`sm` / `md` / `lg`) — see *Sizing* above.

`InteropFieldInput` adds: `type: string = 'text'`.
`InteropFieldTextarea` adds: `autoResize: boolean = false`, `rows: number | null = null`.

## Computed surface (for subclass / template use)

- `value` — internal signal; updated by CVA writeValue and `onInput`
- `focused` — boolean signal; set by `(focus)` / `(blur)` handlers
- `visibleErrors`, `hasVisibleErrors` — final error list and a convenience flag
- `normalizedNotes` — note input normalized to `string[]`
- `describedByIds`, `firstErrorId` — ARIA composition
- `noteId(i)`, `errorId(i)` — ID helpers

## CVA: setDisabledState is intentionally a no-op

The base's `setDisabledState` exists but does nothing — `[disabled]` input is treated as the authoritative source of truth. Programmatic `control.disable()` does NOT update the rendered `disabled` attribute today; consumers wanting that would need to push state via the input or wire it up explicitly. Worth flagging if a consumer hits this.

## What NOT to do

- **Don't add `provideFieldValueAccessor` to `InteropFieldInput` / `InteropFieldTextarea`.** They use self-injection (`inject(NgControl, { self: true })` + `valueAccessor = this`). Adding the `NG_VALUE_ACCESSOR` provider on top causes NG0200 circular dependency. The helper is exported only for consumers building external CVAs on `FieldBase`.
- **Don't apply `interop-field-prefix` / `interop-field-suffix` to `<button>` or `<a>`.** Devmode warns; AT meaning is broken because `aria-hidden` erases the accessible name.
- **Don't bypass the error resolution pipeline.** If you need bespoke error formatting, use `[errorMessages]` (per-field) or `INTEROP_ERROR_MESSAGES` (app-wide). New `*FieldError`-like inputs should plumb through `resolvedErrors`/`visibleErrors` so visibility gating still applies.

## Fixed in the Carbon borrow (round 10)

Five live bugs, all found by reading the stylesheets closely enough to restate them:

- **`pointer-events: none` on the disabled control** suppressed the `cursor: not-allowed` set on the input inside it, so the one affordance the disabled state had never appeared. Removed — the native `disabled` attribute already blocks interaction.
- **`--itx-field-notes-gap` was documented but never read.** Both `interop-field-notes` and `interop-field-errors` read `--itx-field-errors-gap`, so the notes token was a lever with nothing on the other end. Each container now reads its own.
- **`--itx-field-required-indicator` was documented but never implemented** — no rule, no template hook. See the note under *Inputs*.
- **`var(--itx-muted, #757575)` on the placeholder** shadowed a token with a hardcoded hex. The fallback was dead under `[interop-root]` and would have silently diverged from the theme anywhere else.
- **`field-sizing: content` on the textarea** was a second, silent auto-grow mechanism fighting the component's own `[autoResize]`, and it made `[rows]` a no-op in Chromium only. Removed; the design question is filed in `.agent/todo/field-textarea-autoresize.md`.

Also corrected: the dev-mode warning on `type="textarea"` pointed at `<interop-textarea-field>`, a selector that does not exist. The same stale names appear in the doc comments on `FieldBase` and were left alone (out of scope for that round).

## Known gaps

- **Not on the two-file CSS split** — see *Where the styles live* above. This is the largest piece of debt on the component.
- **`setDisabledState` no-op** — see above.
- **Focus ring is JS-driven.** The ring keys off a `.focused` class set by `(focus)`/`(blur)` handlers rather than `:focus-visible`. For a text control the two are equivalent (browsers always match `:focus-visible` on elements that expect keyboard input), so this is a tidiness issue, not a behaviour one — but it means the ring is one more thing that stops working for a CSS-only consumer.
- **No `<select>` variant** — the abstraction would extend cleanly; not done.
- **No prefix/suffix outside the field components** — these are field-only primitives. Buttons want their own (see `button.md` and the prefix/suffix design discussion).
- **ID uniqueness** — required, not validated. Consumers passing duplicates will silently break `<label for>` and ARIA wiring.
- **No character counter, no inline (side-by-side) label variant, no fluid variant, no password-visibility toggle.** All exist in Carbon; none has an Interop concept to attach to, so none was taken.
