# Library Catalog — Reference Set for Component Research

Representative set of component libraries and design systems to consult during
the **Pain Points in Existing Implementations** phase. Not exhaustive — these
are the priors. Skim the relevant subset for the component being researched,
and add others ad hoc when a library is known to ship something unusual for
the target component.

For each entry: known-for / watch-outs / when-to-check.

---

## Tier 1 — Angular ecosystem (primary comparison)

Interop is Angular; these are the libraries our consumers most often arrive
from. Issue trackers here are gold for "what burned me last time."

### Angular Material + CDK
https://material.angular.dev/ • https://material.angular.dev/cdk
- **Known for:** Google-maintained, strong a11y foundations via CDK
  (`@angular/cdk/a11y`, `@angular/cdk/overlay`, FocusTrap, ListKeyManager).
  CDK is reusable independent of Material visuals.
- **Watch-outs:** Heavy opinionated styling, deep customization walls (theming
  via SCSS mixins, `::ng-deep` workarounds), Material Design 3 migration churn,
  older API patterns lagging modern Angular signals/standalone in places,
  bundle weight.
- **When to check:** Always. Their issue tracker is the single best source for
  Angular-specific developer pain. CDK source is often the right reference for
  keyboard managers and overlay positioning even when we don't use Material.

### PrimeNG
https://primeng.org/
- **Known for:** Enormous component catalog including uncommon widgets
  (OrgChart, Galleria, DataView, Tree variants). Themeable via PrimeFlex.
- **Watch-outs:** A11y can be inconsistent across components, opinionated DOM
  shapes, frequent breaking changes between majors, occasional pattern
  deviations from APG.
- **When to check:** For exotic components Material doesn't cover, and to
  see how a kitchen-sink library handles edge cases — *and* what it gets wrong.

### Spartan/ng (spartan.ng)
https://www.spartan.ng/
- **Known for:** Angular port of shadcn philosophy. Unstyled primitives built
  on Angular CDK, copy-into-codebase model.
- **Watch-outs:** Younger project, smaller community, evolving API.
- **When to check:** For modern Angular composition patterns (signals,
  directives, host-driven APIs).

### Taiga UI
https://taiga-ui.dev/
- **Known for:** Large, polished Angular UI kit from Tinkoff. Strong on form
  controls, masking, date primitives. Heavy use of directives.
- **Watch-outs:** Russian-origin docs sometimes thin; opinionated visual style.
- **When to check:** Form-heavy components, input masking, date/time pickers.

### ng-bootstrap
https://ng-bootstrap.github.io/
- **Known for:** Bootstrap widgets in idiomatic Angular, no jQuery.
- **Watch-outs:** Bootstrap aesthetics; less rigorous a11y than CDK-based libs.
- **When to check:** For minimal-dependency Angular patterns and traditional
  Bootstrap widget shapes.

### NG-ZORRO
https://ng.ant.design/
- **Known for:** Ant Design for Angular. Enterprise/data-heavy components.
- **Watch-outs:** Ant Design opinionated visual language; Chinese-origin
  community split with English docs.
- **When to check:** Data table, tree, complex form, transfer-list patterns.

---

## Tier 2 — Headless / unstyled primitives (gold standard for a11y patterns)

These are where the best a11y patterns and composition APIs live. Even when
not using them, copying their behavior is usually correct.

### Radix UI (React)
https://github.com/radix-ui/primitives
- **Known for:** Composable headless primitives (Trigger/Content/Portal slot
  pattern), excellent a11y, careful focus management. The reference
  implementation for "compose your own design system on top."
- **Watch-outs:** React-only; styling is entirely on consumer.
- **When to check:** Always. Their component source is the single best
  reference for "how does a serious headless library handle X."

### React Aria / React Spectrum (Adobe)
https://react-spectrum.adobe.com/react-aria/
- **Known for:** Hook-based a11y primitives backed by Adobe's a11y research.
  Often *more* rigorous than APG. Comprehensive coverage of locale, RTL,
  pointer/keyboard parity.
- **Watch-outs:** API is hooks-heavy and React-idiomatic.
- **When to check:** Always. Their internal state machines (especially for
  Combobox, Select, DatePicker, NumberField) are the most thorough open
  reference available. Their docs explicitly document interaction
  decisions — extremely valuable.

### Headless UI (Tailwind Labs — React + Vue)
https://github.com/tailwindlabs/headlessui
- **Known for:** Small, focused set of unstyled primitives designed to pair
  with Tailwind. Clean API.
- **Watch-outs:** Limited scope (~10 components); less comprehensive than
  Radix or React Aria.
- **When to check:** For minimal/ergonomic API ideas on the components they
  do cover (Menu, Combobox, Dialog, Disclosure, Switch, Tabs).

### Ariakit (React)
https://ariakit.org/
- **Known for:** Composable React primitives with strong a11y, more granular
  than Radix in some places (e.g. Composite, MenuBar).
- **Watch-outs:** Smaller mindshare than Radix.
- **When to check:** For composite-widget patterns (toolbars, menubars,
  grid widgets) where Radix is thinner.

### Base UI (MUI's headless)
https://base-ui.com/
- **Known for:** Unstyled primitives extracted from MUI; modern API.
- **Watch-outs:** Newer, evolving.
- **When to check:** When comparing how a major DS company is restructuring
  toward headless.

---

## Tier 3 — Styled React libraries (for popular patterns + pain points)

### Material UI (MUI)
https://mui.com/
- **Known for:** Mature Material implementation, large component surface.
- **Watch-outs:** Heavy bundle, complex theming, runtime style overhead
  (Emotion/sx), performance complaints, frequent breaking changes between
  majors.
- **When to check:** For pain-point research — MUI's issue tracker is
  enormous and surfaces real developer frustrations.

### Mantine
https://mantine.dev/
- **Known for:** Comprehensive React DS, good DX, hooks library, strong
  defaults.
- **Watch-outs:** Tied to Mantine's own styling approach.
- **When to check:** For ergonomic API design and component variant scope.

### Chakra UI
https://github.com/chakra-ui/chakra-ui
- **Known for:** Ergonomic style-prop API, accessible by default, themable.
- **Watch-outs:** Runtime style-prop overhead has drawn perf complaints; v3
  is a significant rewrite.
- **When to check:** For props-driven styling APIs and theming ergonomics.

### Ant Design
https://ant.design/
- **Known for:** Enterprise/data-dense components, broad component set,
  strong for back-office UIs.
- **Watch-outs:** Opinionated visual identity; a11y historically uneven.
- **When to check:** Tables, transfer lists, descriptions, statistic
  displays, anything "admin panel."

### NextUI / HeroUI
https://github.com/nextui-org/nextui (now branded HeroUI: https://heroui.com/)
- **Known for:** Modern aesthetic React DS built on React Aria + Tailwind
  Variants. Inherits React Aria's a11y rigor.
- **Watch-outs:** Newer; recent rebrand churn.
- **When to check:** For modern styling integration on top of React Aria.

### shadcn/ui
https://github.com/shadcn-ui/ui
- **Known for:** Not a library — a *catalog of copy-paste React components*
  built on Radix + Tailwind. Code-ownership model. Has dramatically influenced
  how the React ecosystem thinks about DS distribution.
- **Watch-outs:** No install / no versioning; updates require re-copying.
- **When to check:** For the distribution-as-source philosophy, and as a
  curated set of "this is what most React app teams ship today."

### Aceternity UI
https://ui.aceternity.com/components
- **Known for:** Tailwind + Framer Motion components, animation-forward,
  marketing/visual flair. Often pairs with shadcn.
- **Watch-outs:** Less rigorous on a11y; visual-first.
- **When to check:** Animation patterns and "delight" affordances — *not* a
  source of truth for a11y.

---

## Tier 4 — Vue ecosystem (cross-framework patterns)

### Vuetify
https://vuetifyjs.com/
- **Known for:** Largest Vue Material-style suite.
- **Watch-outs:** Similar critique to Material — heavy, opinionated, custom
  CSS hard.

### PrimeVue
https://primevue.org/
- **Known for:** Vue twin of PrimeNG; same catalog breadth.
- **Watch-outs:** Same as PrimeNG.

### Naive UI
https://www.naiveui.com/
- **Known for:** Lightweight, themable Vue DS with strong DX reputation.

### Element Plus
https://element-plus.org/
- **Known for:** Vue 3 successor to Element UI; popular in Asia.

### Headless UI (Vue) — see Tier 2 above

### Radix Vue / Reka UI
https://reka-ui.com/
- **Known for:** Vue port of Radix patterns. Recently rebranded Reka UI.
- **When to check:** Cross-framework verification of Radix patterns.

---

## Tier 5 — Web Components / framework-agnostic

Useful for understanding patterns that translate beyond React/Angular.

### Shoelace (now Web Awesome)
https://shoelace.style/ • https://backers.webawesome.com/
- **Known for:** Polished framework-agnostic web components with attention
  to a11y. Lit-based.
- **When to check:** Always — Shoelace's source is exceptionally readable
  and a great cross-check on behavior.

### Adobe Spectrum Web Components
https://opensource.adobe.com/spectrum-web-components/
- **Known for:** WC implementation of Spectrum, mirrors React Aria patterns.
- **When to check:** For Adobe's a11y rigor in web-component form.

### FAST / Fluent UI Web Components (Microsoft)
https://learn.microsoft.com/en-us/fluent-ui/web-components/
- **Known for:** Microsoft's WC system.
- **Watch-outs:** Strategy has shifted multiple times; Fluent vs FAST
  branding confusing.

### Material Web (Google)
https://github.com/material-components/material-web
- **Known for:** Google's WC implementation of Material 3.
- **When to check:** Cross-reference with Angular Material.

### Lion (ING)
https://lion-web.netlify.app/
- **Known for:** White-label headless web components from ING with strong
  a11y; designed to be extended into branded systems.
- **When to check:** Form controls especially.

---

## Tier 6 — CSS-only / visual systems

Useful for the "minimal opinionated styling" angle Interop occupies.

### DaisyUI
https://github.com/saadeghi/daisyui
- **Known for:** Tailwind component classes; no JS. CSS-variable themes,
  framework-agnostic.
- **Watch-outs:** Purely visual — a11y and behavior are on you. Treat as
  a *visual reference*, not a behavioral one.
- **When to check:** Theming approaches, CSS variable structure, visual
  variant taxonomies.

### Pico CSS
https://picocss.com/
- **Known for:** Classless / minimal-class CSS framework styling native
  elements. Aligns philosophically with Interop's "native first" ethos.
- **When to check:** For "what does this component look like when it's
  *just* the native element styled well."

### Open Props
https://open-props.style/
- **Known for:** CSS custom-property design tokens — no opinions on
  components, just a values layer.
- **When to check:** Token taxonomy ideas (gradients, easings, sizes).

---

## Tier 7 — Reference / spec implementations

These are *patterns*, not products. The behavioral source of truth.

### W3C ARIA APG examples
https://www.w3.org/WAI/ARIA/apg/patterns/
- **Always check first.** Canonical pattern + keyboard model + ARIA
  attribution. Sometimes idealized vs AT reality — flag the gap.

### USWDS — U.S. Web Design System
https://designsystem.digital.gov/
- **Known for:** Government-grade a11y rigor, plain-spoken docs.
- **When to check:** Forms, alerts, banners, accessible defaults.

### GOV.UK Design System
https://design-system.service.gov.uk/
- **Known for:** Probably the most researched DS on the planet for
  forms/content components. Strong user-research backing for decisions.
- **When to check:** Forms, error patterns, summary lists, prose-heavy
  components. Their "Research" sections per component are gold.

### Open UI
https://open-ui.org/
- **Known for:** Cross-vendor effort to standardize newer primitives
  (`<selectlist>`/`<selectedoption>`, popover, anchor positioning,
  invokers). Tracks where the platform is heading.
- **When to check:** Whenever a component might be eaten by a future
  platform primitive — don't paint yourself into a corner.

### Apple HIG & Material 3
https://developer.apple.com/design/human-interface-guidelines/ •
https://m3.material.io/
- **Known for:** Behavioral norms users already have intuitions for.
- **When to check:** For interaction norms (gestures, motion, sizing)
  and "what users expect on iOS/Android."

---

## How to use this catalog in research

1. Identify which tiers are most relevant to the target component
   (form control? overlay? composite widget? primitive?).
2. For each chosen library, look for:
   - The component's docs/source
   - Open issues + recently-closed issues filtered by the component
   - Common complaints in their Discord/Discussions
3. Synthesize: what burns developers consistently across libraries?
   What customization walls recur? What a11y bugs recur?
4. Map those failures back to design decisions Interop can make to avoid them.
