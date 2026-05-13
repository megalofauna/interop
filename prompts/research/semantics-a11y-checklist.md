# Semantic Correctness & Accessibility Checklist

Reference checklist for the **Semantic Correctness & Accessibility** phase of
new-component research. Walk every section before settling on an implementation
approach. Where the spec and reality diverge, say so explicitly and recommend a path.

Authoritative sources:
- [W3C WAI-ARIA 1.2](https://www.w3.org/TR/wai-aria-1.2/)
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [HTML Accessibility API Mappings (AAM)](https://www.w3.org/TR/html-aam-1.0/)
- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Open UI](https://open-ui.org/) (for newer/standardizing primitives: popover, dialog, anchor positioning, invokers)
- AT support reality: [a11ysupport.io](https://a11ysupport.io/), [Accessibility Support](https://accessibilitysupport.io/)

---

## 1. Host element & DOM

- What is the **most semantically correct native element** to host this component?
  Prefer native semantics over `role=`. Examples: `<dialog>`, `<details>`/`<summary>`,
  `<button>`, `<input type=range>`, `<output>`, `<progress>`, `<meter>`, `<fieldset>`/`<legend>`.
- If the native element has known caveats (styling limits, dismissal behavior,
  AT bugs), is there a documented case for diverging? What is lost?
- Is the element a **labelable element** (per HTML spec)? If not, what is the
  consequence for `<label for>` and click-to-focus behavior?
- Can the element be a **form-associated custom element** (ElementInternals + FACE)?
  Is form participation in scope?
- Does the chosen element have **interactive content** constraints (e.g. no
  nested interactives inside `<button>`)? Does the API force consumers to violate this?
- What is the element's **default display** and how does it interact with
  layout (flow vs flex/grid item, inline vs block)?
- Does the component need to project content into the **light DOM** (consumer
  styling/queries) or shadow DOM (encapsulation)? Interop default: light DOM.

## 2. ARIA — roles, properties, states

- Does the native element already convey the right **implicit role**?
  Adding `role=` redundantly is an anti-pattern. Only add when host element
  cannot be changed and semantics must be overridden.
- For each ARIA **role** considered: what does the role **require** vs **support**?
  (See WAI-ARIA "Required States and Properties" per role.)
- Which **states** are mandatory: `aria-expanded`, `aria-selected`, `aria-checked`,
  `aria-pressed`, `aria-disabled`, `aria-invalid`, `aria-busy`, `aria-current`?
- Which **relationships** apply: `aria-controls`, `aria-owns`, `aria-describedby`,
  `aria-labelledby`, `aria-activedescendant`, `aria-details`?
- Is `aria-hidden` ever needed? Beware: `aria-hidden=true` on focusable
  descendants is invalid. Prefer `inert` for subtree removal from a11y tree + focus.
- Does the component need to **announce dynamic changes**? `aria-live`,
  `aria-atomic`, `aria-relevant`, or a dedicated live-region utility?
- Is there a **valid name** path? Accessible name MUST come from one of:
  content, `aria-label`, `aria-labelledby`, `<label>`, `title` (last resort).
  Does the component require devMode warnings if no name is computable?
- Are there state combinations the spec forbids (e.g. `aria-pressed` on `role=link`)?
- For composite widgets: does the role pattern require **`aria-activedescendant`**
  (single tab stop) or **roving tabindex** (focus moves)? When is each appropriate?

## 3. Keyboard interaction

Cross-reference the [APG pattern](https://www.w3.org/WAI/ARIA/apg/patterns/)
for this widget. Note where APG's "ideal" differs from real-world DS behavior.

- **Activation keys:** Space, Enter, both, neither? `<button>` activates on both;
  `<a>` only on Enter; custom widgets must replicate manually if not on native.
- **Directional navigation:** Arrow keys — which directions? Wrapping behavior?
  Does orientation (horizontal/vertical) matter (`aria-orientation`)?
- **Boundaries:** Home, End, PageUp, PageDown — what do they do?
- **Typeahead:** Does the pattern call for typeahead search (Listbox, Menu,
  Tree, Combobox)? Reset interval? Multi-char buffering?
- **Selection modifiers:** Shift+Arrow for range, Ctrl/Cmd+Click for multi-select?
- **Dismiss:** Escape — what does it dismiss and where does focus return?
- **Submit:** Enter behavior inside forms — does it trigger form submit, or
  is `preventDefault()` required?
- **Tab key:** Single tab stop (composite) or multiple (group of independents)?
- **Modifier conventions** differ by OS: don't hardcode Ctrl; use a platform check
  or accept either modifier where a Mac user would expect Cmd.
- **RTL flip:** Do arrow keys swap (LeftArrow ≠ "previous" in RTL)?

## 4. Focus management

- **Initial focus** on open/mount: where does focus land? Most-destructive option
  (first interactive) vs least-destructive (container) — APG often recommends
  the container or the primary action.
- **Focus trap:** Is the component modal (dialog, blocking sheet) and therefore
  requires a trap? Or non-modal (popover, menu) and explicitly should NOT trap?
- **Focus return** on close/dismiss: back to the triggering element, by reference.
  What if the trigger no longer exists in the DOM?
- **Roving tabindex vs `aria-activedescendant`:** Roving moves DOM focus
  (better for screen-reader virtual cursor); `aria-activedescendant` keeps a
  single tab stop (better for inputs with auxiliary lists, e.g. Combobox).
- **Focus visibility:** `:focus-visible` for keyboard-only rings. In this repo,
  for form controls inside the visimorph pipeline, use
  `element.matches(':focus-visible')` in `(focus)` bindings; for buttons,
  use the CSS pseudo-class directly. (See `feedback_focus_visible.md`.)
- **Skip-link compatibility:** Does the component break skip-link targets
  (e.g. by trapping focus when it shouldn't)?
- **`inert` on background** vs custom trap: native `<dialog>` does this for
  free; non-`<dialog>` overlays must manage it.
- **Scroll containment:** Should focusing an offscreen item scroll it into view?
  `scrollIntoView({ block: 'nearest' })` is usually correct.

## 5. Labeling & description

- **Accessible name source priority** (per AccName spec):
  `aria-labelledby` > `aria-label` > native labeling (`<label for>`, `alt`,
  `<caption>`, `<legend>`, `<summary>`) > content > `title`.
- Does the component **require** an accessible name by spec? (Many do —
  Button, Link, Input, Dialog with `aria-modal=true`, etc.)
- Should the component **emit a devMode warning** when no name is computable?
- **Description:** When is `aria-describedby` appropriate vs `title`?
  `title` shows on hover/focus but has known AT issues — usually wrong.
- **Group labeling:** `<fieldset>`/`<legend>`, `aria-labelledby` on a container,
  or `role=group` + label?
- **Required/optional indicators:** how are they conveyed in the accessible
  name vs visually? `aria-required=true` and `required` attribute.
- **Error messaging:** `aria-invalid` + `aria-describedby` pointing at the
  error node. When does the error get announced (on blur, on submit, on type)?

## 6. Visual / sensory / responsive

- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` — what
  animations should be disabled, replaced, or shortened? Never just *speed up*.
- **Forced colors / high contrast:** `@media (forced-colors: active)`. Use
  system color keywords (`Canvas`, `CanvasText`, `LinkText`, `ButtonFace`,
  `Highlight`, etc.). Avoid background images/SVG icons that disappear.
- **Color scheme:** `color-scheme` property; dark mode token coverage.
- **RTL:** logical properties (`inline-start`, `block-end`, `margin-inline-start`)
  rather than physical (`left`, `right`). Test directional iconography.
- **Touch target size:** WCAG 2.2 SC 2.5.8 — min 24×24px (AA), 44×44px AAA.
  Spacing exceptions apply.
- **Zoom / reflow:** content must reflow to 320 CSS px without horizontal scroll
  at 400% zoom (WCAG 1.4.10).
- **Text spacing:** must survive WCAG 1.4.12 overrides (line-height 1.5,
  paragraph spacing 2× font size, letter-spacing 0.12em, word-spacing 0.16em).
- **Pointer + hover dependence:** SC 1.4.13 — hover-revealed content must be
  dismissable, hoverable, persistent.

## 7. Form participation

- Does this component participate in a `<form>`? If so:
  - Does it need to be a **form-associated custom element** (ElementInternals)?
  - Does it implement Angular's **`ControlValueAccessor`**?
  - Both? CVA handles Angular forms; FACE handles native forms.
- How does it report **validity**? `setValidity()` on internals, or custom?
- How does it serialize? Single value, FormData entries, complex object?
- Reset behavior: what happens on `form.reset()`?
- Submit behavior: does Enter inside it submit the form?
- Disabled propagation: does `fieldset[disabled]` affect it?

## 8. Spec divergence — where to deviate, where to hold the line

For each material decision, note the camps:

- **W3C / ARIA spec letter** — what the standard says.
- **ARIA APG** — the recommended pattern; sometimes idealized.
- **AT reality** — what NVDA / JAWS / VoiceOver / TalkBack / Orca actually do.
  APG sometimes assumes AT support that lags.
- **Mainstream DS behavior** — what Material, Radix, React Aria, Headless UI
  actually ship. Pragmatic, but sometimes wrong.

When these disagree, **say so explicitly** in the research output, name the
camps, recommend a path with reasoning. Don't paper over the disagreement.

Common divergence hotspots to expect:
- `aria-activedescendant` vs roving tabindex (Combobox especially)
- `role=dialog` + `aria-modal` vs `<dialog>` native (focus trap semantics differ)
- Tooltip on focus only vs hover+focus, dismiss behavior, `aria-describedby` vs name
- Menu vs Listbox vs Tree — which pattern fits "select from a list"
- Disclosure vs Accordion vs Tabs — when does each apply
- "Form" controls that aren't really form controls (Switch vs Checkbox)

---

## Output expectations

When the research output covers this section, it should produce:

- A clear statement of the chosen host element and **why**
- Required + optional ARIA matrix (role, properties, states, relationships)
- Keyboard model table (key → action), with APG citation
- Focus management decisions (initial, trap, return, tabindex strategy)
- Name + description sources, including devMode warning recommendations
- Reduced-motion / forced-colors / RTL plan
- Form participation decision (CVA, FACE, both, neither) with rationale
- An **explicit divergence section**: where Interop will differ from spec
  letter, APG, or mainstream DS, and why
