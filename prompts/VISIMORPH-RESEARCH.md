# Visimorph → Control — Research Review

Review of `InteropVisimorph` and its three consumers (checkbox, radio, toggle)
in `projects/interop_deprecated`, run against
[new-component-research.md](new-component-research.md). The design that
replaces it is in [`.agent/components/control.md`](../.agent/components/control.md).

## Decision

The visual language and the shared `--itx-control-*` token family carry over.
The `<interop-visimorph>` element does not. The indicator is drawn on the
native `<input>` with `appearance: none` and `::before`/`::after`. State
comes from `:checked`, `:indeterminate`, `:disabled` and `:focus-visible`.

| Question | Decision |
|---|---|
| Name | `control` |
| Scope of input styling | Inputs inside `label[interop-checkbox]`, `label[interop-radio]`, `label[interop-toggle]` only. No opt-in attribute for bare inputs yet |
| Angular components | None. Markup + CSS is the API. A TS component ships only when a concrete need appears (CVA, a checkbox group) |

The deprecated controls mirror input state into a second element. Every
high-severity finding below is a case where the two copies disagree.

## 1. Platform features since the original research

| Feature | Status | Effect |
|---|---|---|
| `appearance: none` + `::before`/`::after` on checkbox/radio | All three engines. Firefox creates the pseudo-elements only when `appearance: none` is set ([CSSWG #9168](https://lists.w3.org/Archives/Public/public-css-archive/2023Aug/0162.html), [Firefox WPT](https://searchfox.org/firefox-main/source/testing/web-platform/tests/css/css-pseudo/pseudo-replaced-elements.html), [CSSWG #12876](https://lists.w3.org/Archives/Public/public-css-archive/2025Dec/0058.html)) | The indicator lives on the input. No decorative element |
| `:has()` | Baseline 2023 | Label shell states read the input |
| `:indeterminate`, `:focus-visible` | Baseline | Replace `data-indeterminate`, `data-focused`, and the focus-forwarding contract |
| `<input type=checkbox switch>` | Safari 17.4+ only. Other engines render a checkbox ([WebKit](https://webkit.org/blog/15054/an-html-switch-control/), [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox)) | Keep `role="switch"`. Selectors match `[role=switch], [switch]` |
| `accent-color` | Baseline 2022 | Consumers who want native controls tinted can skip the control styles |
| `forced-colors` + system colors | Baseline | Required. The deprecated CSS has no forced-colors rule |
| Angular `[indeterminate]` property binding | Works. The compiler DOM schema lists `!indeterminate` on `input` | The deprecated checkbox's stated reason to exist ("cannot be template-bound") is false |

## 2. Accessibility remediation list

| # | Issue | Severity |
|---|---|---|
| A1 | Visual state drifts from the input. Toggle and radio take `checked` as `input()`, so an unbound toggle does not move when clicked and an unbound radio shows no dot. The toggle's documented form example is visually broken. Also stale after `form.reset()`, bfcache and autofill restore, and `<fieldset disabled>` (the label gets `not-allowed`, the box does not dim). WCAG 1.3.1, 4.1.2 | High |
| A2 | Stale `aria-checked="mixed"`. A click clears `.indeterminate`; the `effect` re-runs only when the input signal changes, so AT announces "mixed" on a checked box and the dash stays. ARIA in HTML disallows `aria-checked` on a native checkbox, and browsers already map `.indeterminate` to mixed | High |
| A3 | Forced colors. The radio dot, toggle thumb and checked fills use `background-color`, which forced-colors mode overrides. The radio and toggle lose their visible state | High |
| A4 | The focused element is a 1px clipped input. VoiceOver/TalkBack focus rects and magnifier tracking follow it; the visible box is elsewhere | Medium |
| A5 | The focus ring depends on the parent wiring `[focused]`. `:focus-visible` is sampled once, on `focus` | Medium |
| A6 | Focus applies `scale(0.875)`. The indicator shrinks when focused (2.4.13) | Low |
| A7 | Unmeasured contrast: unchecked border (`role-edge`) on surface, check (`role-divider`) on accent, unchecked thumb (`text-quieter`) on track. Each needs 3:1 (1.4.11). A divider role used as foreground ink is a naming problem too | Verify |
| A8 | Reduced motion removes the focus scale only. Transitions still run | Low |

`CHECKBOX-COMPETITIVE-ANALYSIS.md` §6.2 called the parallel reactivity chain
sound. It is the bug class that section cites in Angular Material #27150 and
Mantine #8460/#8363.

## 3. Complexity

Removed:

- The Visimorph component: five inputs, host bindings, one extra node per
  control, Angular-only rendering.
- `data-selected` vs `data-checked`. `role="presentation"` on an empty
  `aria-hidden` element.
- Radio activation guardrails, `activationId`, `payload`, `attrsPreset`.
  `attrsPresetResolved` is computed and unused. The global-activation `effect`
  only logs.
- The required `id` input on all three controls. The label wraps the input,
  so implicit labeling works.
- Label surface tokens for `bg-image` and `backdrop-filter` across four
  states. `bg` and `border-color` stay.
- `.inline`, `.block`, `.reverse` classes. Layout variants use `itx-*`
  attributes if they return.
- `#ccc`, the commented-out declaration, the unfallbacked
  `--itx-control-toggle-border-color-checked`, and the foundation fallback
  chains (see [css layering contract](../.agent/css-strategy.md)).
- The toggle thumb's `4 * border` translate.

## 4. Carried over

1. The `--itx-control-*` token family. One override re-themes radio,
   checkbox and toggle.
2. The label shell as hit target, with states from `:has(input:…)`.
3. Pure-CSS indicators, now on the input's pseudo-elements.
4. Variant selection from input semantics: `[type=radio]`,
   `[type=checkbox]`, `[role=switch], [switch]`.
5. `role="switch"` on the toggle. No indeterminate on the toggle.
   Reduced-motion and contrast media queries. The dev audit label check.

## 5. Open

- App-level data passing (hand-rolled or a vendor add-on) is a later
  interest. It may be what first justifies a TS layer over the markup.
- A7 contrast measurements run when the theme file is written.
