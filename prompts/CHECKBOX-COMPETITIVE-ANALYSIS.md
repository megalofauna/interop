# InteropCheckbox — Competitive Analysis Report

> **Date:** July 2025
> **Scope:** InteropCheckbox & InteropCheckboxGroup vs. Angular Material, PrimeNG, Radix UI, Headless UI, Ark UI, Kobalte, and Mantine
> **Verdict:** InteropCheckbox is ahead of the field on the things that matter most — semantic correctness, accessibility by default, and group-level orchestration. There are a handful of targeted gaps worth closing, but the foundation is strong.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Methodology](#2-methodology)
3. [Feature Matrix](#3-feature-matrix)
4. [Deep-Dive: Where InteropCheckbox Wins](#4-deep-dive-where-interopcheckbox-wins)
5. [Deep-Dive: Where Competitors Win](#5-deep-dive-where-competitors-win)
6. [Cross-Library Pain Points (User Complaints)](#6-cross-library-pain-points-user-complaints)
7. [Recommendations](#7-recommendations)
8. [Appendix: Per-Library Notes](#8-appendix-per-library-notes)

---

## 1. Executive Summary

InteropCheckbox makes several architectural choices that are **genuinely differentiated** in the Angular ecosystem and competitive even against the best React/Solid headless libraries:

| Strength | Why it matters |
|---|---|
| `label[interop-checkbox]` selector | Structurally impossible to ship a checkbox without a label. Eliminates the #1 accessibility complaint across every competitor. |
| Full `InteropCheckboxGroup` with select-all | Angular Material, Radix, Headless UI, and Kobalte all **lack** a checkbox group component. This is a real gap users complain about. |
| Correct indeterminate handling (`input.indeterminate` + `aria-checked="mixed"`) | PrimeNG sets neither. Angular Material has a known sync bug (#27150). Radix uses `button[role=checkbox]` which sidesteps the problem differently. |
| Shared visual layer via `InteropVisimorph` | No other library shares a single visual component across radio, checkbox, and toggle with CSS custom property theming. |
| Select-all with disabled-item preservation | The `toggleAll()` logic correctly preserves disabled items' selection state — a subtle detail most libraries get wrong or don't attempt. |

The gaps that exist are **targeted and fixable** — they don't require architectural changes:

| Gap | Severity | Effort |
|---|---|---|
| No `ControlValueAccessor` on individual checkbox | Medium | Low |
| No built-in required validation (`NG_VALIDATORS`) | Medium | Low |
| No `focus()` convenience method | Low | Trivial |
| No `aria-describedby` / error message support | Medium | Medium |
| Content projection mode in group doesn't wire state | Low-Medium | Medium |
| No `disabledInteractive` pattern (for tooltips on disabled checkboxes) | Low | Low |

**Bottom line:** InteropCheckbox is in a strong position. The work needed is incremental hardening, not course correction.

---

## 2. Methodology

### Libraries Analyzed

| Library | Ecosystem | Type | Version Context |
|---|---|---|---|
| **Angular Material** (`MatCheckbox`) | Angular | Styled (MDC/M3) | v19.x (MDC-based) |
| **PrimeNG** (`p-checkbox`) | Angular | Styled (Design tokens) | v19/20.x |
| **Radix UI** (`Checkbox`) | React | Headless | v1.x / 2.x primitives |
| **Headless UI** (`Checkbox`) | React | Headless | v2.x |
| **Ark UI** (`Checkbox`) | React/Vue/Solid | Headless (Zag.js) | v4.x |
| **Kobalte** (`Checkbox`) | Solid.js | Headless | v0.13.x |
| **Mantine** (`Checkbox`) | React | Styled | v7.x |
| **Shadcn/ui** | React (wraps Radix) | Styled (Tailwind) | Latest |

### Research Sources

- GitHub source code for each library's checkbox implementation
- GitHub Issues filtered by "checkbox" (sorted by comments, votes, recency)
- Stack Overflow questions tagged with each library + "checkbox" (sorted by votes)
- Official documentation for API surface and accessibility claims
- WAI-ARIA Checkbox Pattern specification (W3C APG)

---

## 3. Feature Matrix

### Individual Checkbox Control

| Feature | Interop | Angular Material | PrimeNG | Radix | Headless UI | Ark UI | Kobalte | Mantine |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Native `<input type="checkbox">`** | ✅ | ✅ | ✅ | ❌ `<button>` | ❌ `<span>` | ❌ Hidden | ✅ | ✅ |
| **Enforced `<label>` wrapper** | ✅ selector | ❌ separate | ❌ external | ❌ external | ❌ `<Field>` | ✅ root=label | ❌ separate | ❌ wrapper div |
| **`indeterminate` → DOM property** | ✅ | ✅ (buggy) | ❌ | N/A (button) | N/A (span) | N/A (hidden) | ✅ | ✅ (had bugs) |
| **`aria-checked="mixed"`** | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **ControlValueAccessor** | ❌ | ✅ | ✅ | N/A | N/A | N/A | N/A | N/A |
| **Built-in validation** | ❌ | ✅ `NG_VALIDATORS` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`focus()` method** | ⚠️ via `getInputElement()` | ✅ | ✅ | ✅ native button | ✅ native | ✅ | ✅ | ✅ via ref |
| **`disabled` + still interactive** | ❌ | ✅ `disabledInteractive` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **`aria-describedby`** | ❌ | ✅ | ❌ | ❌ | ✅ via `Description` | ✅ via `Field` | ✅ `Description` | ❌ (broken) |
| **`readonly` support** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Size variants** | ⚠️ CSS var only | ❌ (major complaint) | ✅ sm/lg | ❌ | ❌ | ❌ | ❌ | ✅ xs–xl |
| **Custom icons** | ❌ (Visimorph CSS) | ❌ (SVG hardcoded) | ✅ template | ✅ children | ✅ children | ✅ Indicator | ✅ Indicator | ✅ icon prop |
| **`prefers-reduced-motion`** | ✅ | ✅ | ❌ | ❌ (no CSS) | ❌ (no CSS) | ❌ (no CSS) | ❌ (no CSS) | ✅ |
| **`prefers-contrast: high`** | ✅ (Visimorph) | ✅ (cdk) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **CSS custom property theming** | ✅ `--itx-control-*` | ⚠️ SCSS tokens | ✅ `dt()` tokens | ❌ (no CSS) | ❌ (no CSS) | ❌ (no CSS) | ❌ (no CSS) | ✅ Styles API |

### Checkbox Group

| Feature | Interop | Angular Material | PrimeNG | Radix | Headless UI | Ark UI | Kobalte | Mantine |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Group component exists** | ✅ | ❌ | ❌ | ❌ (requested) | ❌ | ✅ | ❌ (PR pending) | ✅ |
| **Select-all checkbox** | ✅ built-in | N/A | N/A | N/A | N/A | ⚠️ documented | N/A | ❌ manual |
| **Auto indeterminate derivation** | ✅ | N/A | N/A | N/A | N/A | ❌ manual | N/A | ❌ manual |
| **Disabled items preserved in toggleAll** | ✅ | N/A | N/A | N/A | N/A | ❌ | N/A | ❌ |
| **ControlValueAccessor** | ✅ `T[]` | N/A | N/A | N/A | N/A | N/A | N/A | N/A |
| **Fieldset + legend (hands-off)** | ✅ | N/A | N/A | N/A | N/A | ❌ | N/A | ❌ |
| **Attribute selector (custom mode)** | ✅ | N/A | N/A | N/A | N/A | ❌ | N/A | ❌ |
| **Collection/async data source** | ✅ | N/A | N/A | N/A | N/A | ❌ | N/A | ❌ |
| **`maxSelectedValues`** | ❌ | N/A | N/A | N/A | N/A | ✅ | N/A | ✅ |
| **Content projection** | ✅ (no state wiring) | N/A | N/A | N/A | N/A | ✅ (context) | N/A | ✅ (context) |

---

## 4. Deep-Dive: Where InteropCheckbox Wins

### 4.1 Structural Accessibility via Selector Enforcement

```
// InteropCheckbox
selector: "label[interop-checkbox]"
```

This is the single most consequential design decision in the entire component. Every other library requires the developer to _choose_ to associate a label:

- **Angular Material**: `<mat-checkbox>Label</mat-checkbox>` — renders a separate `<label for="...">` internally, but the outer element is a `<div>`, and the label/input association depends on auto-generated IDs that can break in edge cases.
- **PrimeNG**: Removed the built-in `label` input in v17+. Consumers must manually create `<label for="inputId">`. The official docs didn't even include `aria-label` in examples ([#18925](https://github.com/primefaces/primeng/issues/18925), still open).
- **Radix**: No label included at all. You must provide `htmlFor` on a separate `<label>`.
- **Headless UI**: Requires wrapping in `<Field>` + `<Label>` for auto-association.

**Why this matters**: Missing form labels is the [most common accessibility defect](https://webaim.org/projects/million/) found in automated audits. By making the label the host element itself, InteropCheckbox makes it _structurally impossible_ to create an unlabeled checkbox. The dev-mode warning for non-label hosts is a nice additional guard, but the selector does the heavy lifting.

The `<label>` wrapping pattern also means click-to-toggle works automatically via browser-native behavior — no synthetic click handlers needed, no event.stopPropagation bugs, no TalkBack issues (which Angular Material still has: [#18005](https://github.com/angular/components/issues/18005)).

### 4.2 Indeterminate State Done Right

InteropCheckbox handles indeterminate state with an `effect()` that:
1. Sets `input.indeterminate = true` on the native DOM element
2. Sets `aria-checked="mixed"` for screen readers
3. Removes `aria-checked` when not indeterminate (letting the browser infer from `checked`)

This is textbook-correct per the WAI-ARIA specification. Here's how competitors compare:

| Library | `input.indeterminate` | `aria-checked="mixed"` | Known bugs |
|---|---|---|---|
| **InteropCheckbox** | ✅ via effect | ✅ | None known |
| **Angular Material** | ✅ via `_syncIndeterminate()` | ✅ | **#27150**: Tri-state out of sync on toggle. Still open (P3). |
| **PrimeNG** | ❌ **Never set** | ❌ **Never set** | Indeterminate is purely visual (SVG minus icon). Screen readers announce checked/unchecked, never "mixed." |
| **Mantine** | ✅ via `useEffect` | ✅ via `data-indeterminate` | **#8460**: Check mark fails to appear on indeterminate→checked transition. **#8363/#8385**: `data-indeterminate` not cleaned up correctly. All fixed, but the history shows fragility. |

PrimeNG's approach is particularly concerning — they render a minus icon but never inform assistive technology. A screen reader user interacting with a "select all" checkbox in PrimeNG has no way to know it's in a mixed state. This is a WCAG failure.

### 4.3 The Checkbox Group Nobody Else Has

The checkbox group landscape is barren:

| Library | Group Component | Select-All | Auto Indeterminate |
|---|---|---|---|
| **InteropCheckboxGroup** | ✅ Full featured | ✅ Built-in | ✅ `isAllSelected()` / `isPartialSelected()` |
| **Angular Material** | ❌ **Does not exist** | N/A | N/A |
| **PrimeNG** | ❌ Bind multiple to same ngModel | N/A | N/A |
| **Radix** | ❌ [#3696](https://github.com/radix-ui/primitives/issues/3696) requested | N/A | N/A |
| **Headless UI** | ❌ | N/A | N/A |
| **Kobalte** | ❌ [PR #502](https://github.com/kobaltedev/kobalte/issues/502) open since Oct 2024 | N/A | N/A |
| **Ark UI** | ✅ | ⚠️ Documented pattern | ❌ Manual |
| **Mantine** | ✅ | ❌ Manual | ❌ Manual |

InteropCheckboxGroup's specific advantages:

- **Automatic select-all with derived indeterminate**: `[selectAll]="true"` and you're done. The `isAllSelected()` and `isPartialSelected()` computeds derive the correct state. No manual wiring.
- **Disabled-item-aware toggleAll**: When toggling all, disabled items' selection state is preserved. The implementation explicitly filters enabled values and merges with existing disabled selections.
- **Dual structural modes**: Element selector (`<interop-checkbox-group>`) for hands-off fieldset + legend, or attribute selector (`<div interop-checkbox-group>`) for custom containers. No other library offers this.
- **Collection service integration**: Async data sources (observables, promises) are first-class via `InteropCollectionService`.
- **`aria-controls` on select-all**: The select-all checkbox has `[attr.aria-controls]="controlledIds()"` listing all controlled checkbox IDs. This is a WAI-ARIA requirement that even Ark UI's documented select-all pattern doesn't include.

### 4.4 Shared Visual Layer (Visimorph)

The `InteropVisimorph` component is architecturally unique. It serves as the visual indicator for radio, checkbox, and toggle controls simultaneously:

- **Single source of truth** for visual appearance across all form controls
- **CSS custom property theming** via `--itx-control-*` variables — override at any ancestor scope
- **Pure CSS implementation** — checkmark is a rotated L-shape via borders, indeterminate is a horizontal dash, no SVG or icon fonts required
- **`aria-hidden="true"` + `role="presentation"`** — correctly excluded from accessibility tree
- **Data attribute driven** — `data-checked`, `data-indeterminate`, `data-disabled`, `data-focused` for clean CSS state selectors

This means a consumer can write:
```css
.my-section {
  --itx-control-accent: hotpink;
  --itx-control-size: 1.25rem;
}
```
and every checkbox, radio, and toggle within that section updates. Angular Material requires SCSS mixins and a build step. PrimeNG requires design token configuration. Radix ships no CSS at all.

### 4.5 Media Query Coverage

InteropCheckbox and Visimorph cover both key accessibility media queries:

- `@media (prefers-reduced-motion: reduce)` — disables transitions
- `@media (prefers-contrast: high)` — increases border widths and focus ring thickness

Angular Material has this via CDK. Nobody else does. Radix, Headless UI, Ark UI, and Kobalte ship zero CSS, so it's entirely on the consumer. Mantine has reduced-motion but not high-contrast.

---

## 5. Deep-Dive: Where Competitors Win

### 5.1 ControlValueAccessor on the Individual Checkbox

**Gap severity: Medium**

Angular Material's `MatCheckbox` implements both `ControlValueAccessor` and `Validator`:

```ts
// Angular Material
providers: [
  { provide: NG_VALUE_ACCESSOR, useExisting: MatCheckbox, multi: true },
  { provide: NG_VALIDATORS, useExisting: MatCheckbox, multi: true },
]

// Built-in required validation:
validate(control: AbstractControl<boolean>): ValidationErrors | null {
  return this.required && control.value !== true ? { required: true } : null;
}
```

InteropCheckbox has **no CVA or validator** on the individual control. Only `InteropCheckboxGroup` implements `ControlValueAccessor`. This means a standalone checkbox cannot participate in reactive forms without additional wrapping:

```html
<!-- This doesn't work with InteropCheckbox today: -->
<form [formGroup]="myForm">
  <label interop-checkbox id="agree" formControlName="acceptTerms">
    I accept the terms
  </label>
</form>
```

The `model()` input on `checked` provides two-way binding via `[(checked)]`, which covers most use cases. But for reactive forms with validation, there's a gap.

### 5.2 `disabledInteractive` Pattern

**Gap severity: Low**

Angular Material introduced `disabledInteractive` which keeps a disabled checkbox in the tab order and interactive for hover/focus (so tooltips work) while preventing value changes:

```ts
// Angular Material: disabled but still shows tooltip on hover/focus
<mat-checkbox [disabled]="true" [disabledInteractive]="true" matTooltip="Requires admin">
  Admin settings
</mat-checkbox>
```

When `disabledInteractive` is true:
- The native input is NOT actually `disabled` (stays in tab order)
- `aria-disabled="true"` is set instead
- Click interactions are silently suppressed
- Tooltips and other hover/focus interactions still work

This is a genuine accessibility pattern for providing explanatory information about why a control is disabled. InteropCheckbox doesn't support this.

### 5.3 `aria-describedby` / Error & Description Support

**Gap severity: Medium**

Kobalte provides `Checkbox.Description` and `Checkbox.ErrorMessage` sub-components that are automatically wired via `aria-describedby`. Ark UI does the same through its `Field` integration. Angular Material forwards `aria-describedby` to the native input.

InteropCheckbox provides no mechanism for description or error text association. When a checkbox has validation errors or help text, the consumer must manually manage `aria-describedby` on the native input — but they can't even do that without accessing the element via `getInputElement()`.

Note: Mantine also claims to support this but **it's actually broken** — `aria-describedby` is not set on the input ([#8526](https://github.com/mantine-dev/mantine/issues/8526), still open as of July 2025). So even trying to implement this is error-prone.

### 5.4 Content Projection Mode Gap in Group

**Gap severity: Low-Medium**

When using `InteropCheckboxGroup` in content projection mode (no `[controls]` array), the group provides no mechanism to wire projected checkboxes to the group's value state:

```html
<!-- Content projection: the group can't manage these checkboxes' state -->
<interop-checkbox-group [(value)]="selectedValues">
  <label interop-checkbox id="a" value="a">Option A</label>
  <label interop-checkbox id="b" value="b">Option B</label>
</interop-checkbox-group>
```

Ark UI and Mantine solve this via React Context — child checkboxes automatically inherit group state. In Angular, this would require either:
- `ContentChildren` query to discover projected `InteropCheckbox` instances
- A shared service/injection token for parent-child communication

This is a common pattern in Angular (see `MatRadioGroup` + `MatRadioButton`).

### 5.5 `maxSelectedValues`

**Gap severity: Low**

Both Ark UI and Mantine support `maxSelectedValues` on their checkbox groups, which auto-disables unchecked items when the limit is reached. This is useful for "choose up to N" patterns. InteropCheckboxGroup doesn't have this.

### 5.6 Custom Icon Support

**Gap severity: Low**

PrimeNG, Radix, Ark UI, Kobalte, and Mantine all allow custom icons for checked/indeterminate/unchecked states. InteropCheckbox's visual layer is entirely CSS-driven via Visimorph, which means:

- ✅ Consistent, performant, zero-dependency visuals
- ❌ No way to use custom SVG icons or icon libraries for the checkbox indicator

This is a deliberate trade-off that favors consistency and performance. The CSS approach (rotated L-shape for checkmark, horizontal line for indeterminate) is visually clean and avoids icon font/SVG dependencies.

---

## 6. Cross-Library Pain Points (User Complaints)

### 6.1 🔴 Missing Labels (The #1 Complaint)

This is the single most common accessibility complaint across all checkbox libraries:

| Library | Complaint |
|---|---|
| **PrimeNG** | [#10974](https://github.com/primefaces/primeng/issues/10974), [#18925](https://github.com/primefaces/primeng/issues/18925) — WAVE flags "missing form label." Docs don't show `aria-label` in examples. Label input was removed in v17+. |
| **Angular Material** | [#10954](https://github.com/angular/components/issues/10954) — Label doesn't line-wrap. [#31816](https://github.com/angular/components/issues/31816) — Screen reader announces "Blank" in table context. |
| **Radix** | No label included. Every consumer must manually provide `htmlFor` + `<label>`. |
| **Headless UI** | [#3658](https://github.com/tailwindlabs/headlessui/issues/3658) — Links inside `<Label>` intercepted. Label click handler too aggressive. |
| **Ark UI** | [#3824](https://github.com/chakra-ui/ark/issues/3824) — `aria-labelledby` points to non-existent elements when no label is rendered. |

**InteropCheckbox's position**: This problem is structurally eliminated. The `label[interop-checkbox]` selector means the checkbox IS a label. There is no way to render an unlabeled checkbox without deliberately misusing the API.

### 6.2 🔴 Indeterminate State Bugs

Indeterminate is the #1 source of _bugs_ (as opposed to missing features) across libraries:

| Library | Issues |
|---|---|
| **Angular Material** | [#27150](https://github.com/angular/components/issues/27150) — Tri-state visual/component state desync on toggle. P3, still open. |
| **Mantine** | [#8460](https://github.com/mantine-dev/mantine/issues/8460) — Checkmark fails to appear on indeterminate→checked. [#8363](https://github.com/mantine-dev/mantine/issues/8363), [#8385](https://github.com/mantine-dev/mantine/issues/8385) — `data-indeterminate` attribute not cleaned up. (All fixed, but 3 separate PRs needed.) |
| **PrimeNG** | Never sets `input.indeterminate` or `aria-checked="mixed"`. The indeterminate state is invisible to assistive technology. |
| **Kobalte** | [#214](https://github.com/kobaltedev/kobalte/issues/214) — Indeterminate state simply didn't work initially. |

**Root cause**: `HTMLInputElement.indeterminate` is a DOM property, not an HTML attribute. It cannot be set via template binding in any framework. Libraries must bridge the gap between the DOM property, the ARIA state, and the visual presentation. When these three get out of sync, bugs result.

**InteropCheckbox's position**: The `effect()` approach is clean and correct — it syncs both the DOM property and the ARIA attribute in a single reactive callback. The Visimorph visual layer reads from `data-indeterminate` which is set by the host binding, creating a separate but parallel reactivity chain. This separation of concerns (effect handles DOM/ARIA, host binding handles visual) is architecturally sound.

### 6.3 🔴 No Checkbox Group

| Library | Status |
|---|---|
| **Angular Material** | Does not exist. No `<mat-checkbox-group>`. Users manage group state manually. |
| **Radix** | [#3696](https://github.com/radix-ui/primitives/issues/3696) — Requested, not available. Internal to Radix Themes but not extracted to primitives. |
| **Headless UI** | Does not exist. |
| **Kobalte** | [PR #502](https://github.com/kobaltedev/kobalte/issues/502) — Open since October 2024, still not merged. |
| **PrimeNG** | No dedicated component. Multiple `p-checkbox` bound to same `ngModel` array. |

**InteropCheckbox's position**: Having a full-featured group is a genuine differentiator. The combination of select-all, auto indeterminate, fieldset/legend, and CVA integration is not matched by any competitor.

### 6.4 🟡 Sizing Difficulty

| Library | How sizing works |
|---|---|
| **Angular Material** | No size input. Users resort to `transform: scale()` hacks. Major SO complaint. |
| **PrimeNG** | `size` input with `'small'` and `'large'` presets. |
| **Mantine** | `size` prop with `xs` through `xl`. |
| **Radix/Headless/Ark/Kobalte** | No CSS shipped — consumer controls everything. |

**InteropCheckbox's position**: Sizing is possible via `--itx-control-size` custom property, which is powerful (any value, any scope). But there's no high-level `size` input for quick presets. This is a reasonable trade-off — CSS custom properties are more flexible than preset enums — but preset shortcuts could be a nice DX improvement.

### 6.5 🟡 Hidden Input Scroll Bugs

Libraries that visually hide a native input can trigger unexpected page scrolling when the input receives focus:

| Library | Issue |
|---|---|
| **Kobalte** | [#452](https://github.com/kobaltedev/kobalte/issues/452) — Clicking checkbox scrolls page. Fix requires `preventScroll` on focus. |
| **Radix** | [#3588](https://github.com/radix-ui/primitives/issues/3588) — Hidden input causes scroll area to expand in forms with relative positioning. |

**InteropCheckbox's position**: The `.interop-sr-only` class uses `clip: rect(0,0,0,0)` and `position: absolute` with `width: 1px; height: 1px`. This is the standard screen-reader-only pattern and shouldn't cause scroll issues. However, it's worth testing this specific scenario.

### 6.6 🟡 Forms Integration Edge Cases

| Library | Issue |
|---|---|
| **PrimeNG** | [#2906](https://github.com/primefaces/primeng/issues/2906) — Template-driven vs. reactive forms produce different value shapes. |
| **Headless UI** | [#3419](https://github.com/tailwindlabs/headlessui/issues/3419) — Boolean form values incorrect in hidden input serialization. |
| **Kobalte** | [#473](https://github.com/kobaltedev/kobalte/issues/473) — `required` constraint validation doesn't trigger on submit. |
| **Mantine** | Uncontrolled form support requires `hiddenInputValuesSeparator` workaround. |

**InteropCheckbox's position**: The group's CVA emits a proper `T[]` array, which is clean. The individual checkbox lacking a CVA means reactive forms integration requires manual wiring. Since Angular's forms system is central to most Angular apps, this is a meaningful gap.

---

## 7. Recommendations

### Priority 1: Should Do (High Impact, Low Effort)

#### 7.1 Add `ControlValueAccessor` + `Validator` to Individual Checkbox

The individual `InteropCheckbox` should implement `ControlValueAccessor` (emitting `boolean`) and `NG_VALIDATORS` (for `required` validation). This enables:

```html
<form [formGroup]="form">
  <label interop-checkbox id="terms" formControlName="acceptTerms">
    I accept the terms
  </label>
</form>
```

Angular Material does this and it's one of the most natural integration patterns. The `model()` on `checked` already provides the internal state management — the CVA just needs to bridge it to the forms API.

The built-in `required` validator (return `{ required: true }` when `required === true && checked !== true`) is especially valuable for "accept terms" patterns.

**Effort**: Low. The plumbing already exists — `checked` is a `model()`, `disabled` and `required` are inputs. Just wire up the providers and interface methods.

#### 7.2 Add `focus()` Convenience Method

Replace or supplement `getInputElement()` with a direct `focus()` method:

```ts
focus(options?: FocusOptions): void {
  this.inputElement.nativeElement.focus(options);
}
```

Every competitor exposes this. It's trivial to implement and improves DX.

### Priority 2: Should Do (Medium Impact, Medium Effort)

#### 7.3 Add Description / Error Message Support

Provide inputs for wiring `aria-describedby` on the native input:

```html
<label interop-checkbox id="newsletter" [ariaDescribedBy]="'newsletter-help'">
  Subscribe to newsletter
</label>
<p id="newsletter-help">We'll send at most one email per week.</p>
```

This could be as simple as an `ariaDescribedBy` input that's forwarded to the native `<input>`. A more complete approach would be sub-components (like Kobalte's `Description` / `ErrorMessage`), but even the simple input would close the gap.

Note: Get this right. Mantine has had `aria-describedby` broken for months ([#8526](https://github.com/mantine-dev/mantine/issues/8526)). Ark UI generates broken `aria-labelledby` references ([#3824](https://github.com/chakra-ui/ark/issues/3824)). The safest approach is the simplest — let the consumer provide the ID string directly rather than auto-generating it.

#### 7.4 Wire Content Projection in Group

Add parent-child communication so projected checkboxes participate in the group's value state. In Angular, this typically means:

1. The group provides itself via an injection token
2. Child `InteropCheckbox` instances optionally inject the parent group
3. When a child toggles, it notifies the parent; when the parent's value changes, children react

This would make the content projection mode actually useful for state management, not just layout.

### Priority 3: Nice to Have (Low Impact or Niche)

#### 7.5 `disabledInteractive` Pattern

Add support for `aria-disabled` instead of `disabled` when the checkbox should be non-functional but still focusable (for tooltip access):

```html
<label interop-checkbox id="admin"
       [disabled]="true"
       [disabledInteractive]="true"
       interop-tooltip="Requires admin role">
  Admin settings
</label>
```

#### 7.6 `maxSelectedValues` on Group

Add a `maxSelected` input to `InteropCheckboxGroup` that auto-disables unchecked items when the limit is reached:

```html
<interop-checkbox-group [controls]="options" [maxSelected]="3" [(value)]="selected" />
```

#### 7.7 `readonly` Support

Add a `readonly` input that prevents changes while keeping the checkbox focusable and its value submittable. This is distinct from `disabled` — `readonly` checkboxes participate in form submission, `disabled` ones don't.

#### 7.8 `prefers-contrast: high` on Individual Control CSS

The main branch's `interop-checkbox-control.css` has `prefers-reduced-motion` but not `prefers-contrast: high`. The Visimorph CSS covers the visual indicator, but the control's hover background and label area don't adapt. Consider adding high-contrast overrides to the control CSS as well.

### Priority 4: Monitor / No Action Needed

#### 7.9 Custom Icons

The CSS-only visual approach via Visimorph is a strength, not a weakness. It's performant, consistent, and dependency-free. Custom icon support would add complexity for a niche use case. Monitor demand but don't add proactively.

#### 7.10 Hidden Input Scroll Bug

Test the `.interop-sr-only` pattern for the scroll-on-focus issue that affects Kobalte and Radix. If it reproduces, add `preventScroll: true` to any programmatic focus calls. The `clip: rect(0,0,0,0)` approach should be safe, but it's worth verifying.

---

## 8. Appendix: Per-Library Notes

### Angular Material (`MatCheckbox`)

- **Selector**: `mat-checkbox` (element)
- **Native input**: Yes, `<input type="checkbox" class="mdc-checkbox__native-control">`
- **Visual**: MDC Web classes + SVG checkmark + CSS mixedmark div
- **Encapsulation**: `ViewEncapsulation.None`
- **Key unique feature**: `disabledInteractive` — keeps disabled checkboxes in tab order for tooltip access
- **Key gap**: No `MatCheckboxGroup`. Users build group logic manually.
- **Biggest complaint**: Indeterminate tri-state sync bug ([#27150](https://github.com/angular/components/issues/27150)) — visual state desyncs from component state when toggling from indeterminate.
- **Sizing**: No API. Users hack with `transform: scale()`. Multiple SO questions about this.
- **Theming**: SCSS mixins in M2, `overrides()` mixin + CSS custom properties in M3. Heavy build-time dependency.
- **Animation**: CSS class-based transitions between states, cleaned up via `setTimeout` outside NgZone.

### PrimeNG (`p-checkbox`)

- **Selector**: `p-checkbox, p-checkBox, p-check-box` (three for backward compat)
- **Native input**: Yes, but transparent overlay (`opacity: 0`, `z-index: 1`) over a styled div
- **Indeterminate**: ❌ Does NOT set `input.indeterminate` or `aria-checked="mixed"`. Purely visual via SVG minus icon. **This is a WCAG failure.**
- **Label**: Removed built-in label in v17+. External `<label for>` required. Docs don't demonstrate accessible patterns.
- **Key unique feature**: `trueValue`/`falseValue` for custom checked/unchecked values (e.g., `"Y"`/`"N"`)
- **Key gap**: No checkbox group component. No `aria-checked="mixed"`.
- **Biggest complaint**: Accessibility — historically used `<div role="checkbox">` instead of native input ([#9758](https://github.com/primefaces/primeng/issues/9758)). Fixed, but missing label support and broken indeterminate a11y remain.
- **Theming**: Design token system via `dt()` function, shared across PrimeNG/PrimeVue/PrimeReact.

### Radix UI (`Checkbox`)

- **Element**: `<button type="button" role="checkbox">` — not a native checkbox input
- **Hidden input**: Conditional `<input type="checkbox">` for form participation (only when `name` is set). Uses a clever prototype descriptor trick to dispatch synthetic events.
- **Indeterminate**: First-class — `checked` accepts `boolean | 'indeterminate'`. Clean tri-state enum on `data-state`.
- **Key unique feature**: `asChild` pattern for render delegation. Zero CSS — pure behavior primitive.
- **Key gap**: No `CheckboxGroup` in primitives ([#3696](https://github.com/radix-ui/primitives/issues/3696)). Hidden input positioning causes scroll area bugs ([#3588](https://github.com/radix-ui/primitives/issues/3588)).
- **Shadcn/ui wrapping**: Flattens Root + Indicator into one component. Hardcodes Lucide `CheckIcon`. Does NOT render a different icon for indeterminate state.

### Headless UI (Tailwind Labs)

- **Element**: `<span role="checkbox">` — no native input by default
- **Hidden input**: `<input type="hidden">` only when `name` is provided. Not a real checkbox input.
- **Key unique feature**: Data attributes designed for Tailwind's `data-*` modifier system. `Field` + `Label` + `Description` composition.
- **Key gap**: No `CheckboxGroup`. No form reset support. `onChange` fires before state updates in uncontrolled mode ([#3760](https://github.com/tailwindlabs/headlessui/issues/3760)). Links inside `<Label>` are intercepted ([#3658](https://github.com/tailwindlabs/headlessui/issues/3658)).

### Ark UI (Chakra team / Zag.js)

- **Architecture**: State machine-driven (Zag.js). Compound component with 6 sub-parts.
- **Root element**: `<label>` — similar philosophy to InteropCheckbox
- **Key unique feature**: Full `Checkbox.Group` with `maxSelectedValues`. Rich data attributes including `data-focus-visible`. State machine guarantees consistent transitions.
- **Key gap**: `aria-labelledby` points to non-existent elements when label is omitted ([#3824](https://github.com/chakra-ui/ark/issues/3824)). Over-engineered for simple use cases.

### Kobalte (Solid.js)

- **Native input**: Yes, real `<input type="checkbox">` as an explicit sub-component (`Checkbox.Input`)
- **Key unique feature**: `Checkbox.Description` and `Checkbox.ErrorMessage` with automatic ARIA wiring. `validationState` prop. Native form reset support.
- **Key gap**: No `CheckboxGroup` — PR open since October 2024 ([#502](https://github.com/kobaltedev/kobalte/issues/502)). Hidden input focus causes page scroll ([#452](https://github.com/kobaltedev/kobalte/issues/452)).

### Mantine

- **Native input**: Yes, real `<input type="checkbox">` with `ref` access
- **Key unique feature**: `Checkbox.Card` for rich selectable cards. `Checkbox.Group` with `maxSelectedValues`. Full Styles API with named selectors. Size variants xs–xl.
- **Key gap**: `aria-describedby` not set on checkbox input — screen readers don't announce error messages ([#8526](https://github.com/mantine-dev/mantine/issues/8526), still open). Multiple indeterminate state bugs in recent history.

---

_End of report._