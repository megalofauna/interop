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

## Known gaps

- **`setDisabledState` no-op** — see above.
- **No `<select>` variant** — the abstraction would extend cleanly; not done.
- **No prefix/suffix outside the field components** — these are field-only primitives. Buttons want their own (see `button.md` and the prefix/suffix design discussion).
- **ID uniqueness** — required, not validated. Consumers passing duplicates will silently break `<label for>` and ARIA wiring.
