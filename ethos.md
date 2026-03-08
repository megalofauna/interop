# Interop Ethos

This document captures the values and standards that drive every decision in this library — from API design to CSS architecture to which Angular features we adopt and when. It's a living document, not a mission statement. Read it when you're deciding between two approaches.

---

## 1. Developer Experience Is the Product

The components are not the product. The *experience of using them* is.

A developer's first hour with Interop should feel like discovery, not archaeology. APIs should be guessable. Defaults should be right. Error messages — where we can provide them — should tell you what to do next, not just what went wrong. The docs should show what the component *does*, not just list its inputs.

This goes beyond surface ergonomics. It means:

- **Thinking in author intent, not implementation detail.** If a developer has to understand how the component is built in order to use it, the API is wrong.
- **Reducing the blast radius of mistakes.** Sensible defaults, opt-in complexity, forgiving inputs where precision isn't required.
- **Being consistent in ways that compound.** Patterns learned from `InteropButton` should transfer immediately to `InteropTabs`. A developer should be able to predict an API they've never seen before.
- **Respecting the consumer's architecture.** Interop does not dictate how you manage state, organize your DI tree, or structure your templates. It slots in.

The bar: a developer tries Interop, it clicks immediately, and they tell someone about it. If that's not happening, something in the experience is wrong — not the developer.

---

## 2. Angular-Forward, Without Apology

Interop targets the latest stable Angular release and takes full advantage of it. We don't carry polyfills for yesterday's API surface, and we don't treat new language features as experimental curiosities.

That means:

- **Signals are the reactive primitive.** Not `BehaviorSubject`, not `ChangeDetectorRef`, not `@Input()` with manual diffing. Signal-based components with `OnPush` are the baseline, not the aspiration.
- **Standalone everywhere.** No `NgModule` wrappers, no module-based entry points, no backwards-compatibility shims for module-based consumers.
- **New control flow syntax** (`@if`, `@for`, `@switch`) over structural directives.
- **Host directives, `inject()`, `effect()`, `contentChildren()`** — all used idiomatically, not as escape hatches.

When Angular ships something that changes how components should be written, Interop updates to reflect it. The library is, partly, a demonstration of what Angular looks like when you use all of it.

The corollary: Interop does not support legacy Angular versions. The version floor is set at whatever enables the features we use. We document this clearly and move forward.

---

## 3. Performance Is Designed In, Not Bolted On

Performance in a component library isn't mostly about runtime speed — it's about what gets shipped to the browser in the first place.

Interop is built around the assumption that consumers will use some components and not others. That means:

- **Everything is tree-shakeable by default.** If you import `InteropButton`, you do not pay for `InteropTable`. Public API barrels are opt-in, not opt-out.
- **No side-effecting top-level imports.** Nothing should execute just because a file was imported.
- **CSS tokens over runtime style injection.** Custom properties are inherited by the browser's cascade machinery, not by our JavaScript. No CSS-in-JS, no style tag injection at runtime.
- **Signals over subscriptions.** Computed signals are lazily evaluated and memoized. We don't push updates through chains of operators unless necessary.
- **Lazy-loadable heavy dependencies.** Anything with real weight — syntax highlighting grammars, icon sets, i18n data — should be loadable on demand, not bundled by default.

Code should be readable. "Advanced" does not mean "clever" — it means we understand the platform well enough to use it correctly and efficiently, without workarounds that obscure intent. The goal is code that a thoughtful Angular developer reads and thinks: *yes, obviously, that's how you do it.*

---

## 4. HTML-First, Platform-Forward

HTML is not a limitation to route around. It is the most battle-tested, accessible, interoperable UI specification in existence — shaped by decades of real-world use, browser optimization, and hard-won accessibility semantics. Interop treats it as a foundation to build on, not a substrate to replace.

This is most visible in how components are invoked. Where another library might ask you to write `<my-button>`, Interop asks you to write `<button interop-button>`. The attribute selector is not a quirk — it's a statement. The `<button>` element brings keyboard interaction, focus management, ARIA role, form participation, and browser-native behavior that no custom element can fully replicate without re-implementing the browser. We don't re-implement the browser.

In practice, this means:

- **Attribute selectors are the default invocation pattern.** Components attach to the appropriate native element. The element's semantics are preserved and extended, not replaced.
- **Native behavior is never recreated if the platform already provides it.** Click handling, form submission, keyboard navigation, scroll behavior — if the browser does it correctly, we let it. We only intervene when the default is wrong or insufficient.
- **Accessibility comes from correct HTML, not from ARIA patches.** ARIA is a repair tool for when semantics can't be expressed in markup. Interop uses it sparingly and correctly, as a last resort — not as a shortcut around using the right element.
- **The component's footprint is additive.** Interop adds styling, behavior, and enhanced semantics on top of what's already there. Removing an Interop component from an element should leave that element in a reasonable state, not a broken one.

"Platform-forward" extends this to the web platform broadly: CSS cascade, custom properties, container queries, `popover`, `dialog`, `details` — these exist for reasons. When the platform ships something that solves a problem Interop was solving in JavaScript, we migrate to the platform solution. We follow the web, not ahead of it, not behind it.

The guiding question: *does this require us to fight the browser, or work with it?* If the answer is fight, reconsider the approach.

---

## On Trade-offs

These four principles occasionally pull against each other. When they do:

- A worse DX that's meaningfully more performant is worth discussing. The reverse rarely is.
- An Angular feature that improves both DX and performance is a clear yes. One that only adds complexity for framework-forward cred is a clear no.
- "Readable but advanced" means we don't simplify code to the point of inefficiency, and we don't optimize to the point of illegibility. The default is clarity; performance wins when it matters.
- When HTML-first and DX tension arises — e.g., `<button interop-button>` is slightly more verbose than `<interop-button>` — the platform-native choice wins. Verbosity is not a meaningful cost. Losing native semantics is.

When in doubt: write the thing a developer would *want* to find when they open the source.
