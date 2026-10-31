# Protocol: Interop without a framework at its core

Interop is a platform-first UI system for the web. Its public API is HTML: elements, `interop-*`
attributes that name what a thing is, `itx-*` attributes that configure it, and CSS. Behavior the
platform lacks comes from framework-free functions in `interop`.

Protocol is the contract between Interop and a framework, and the packs that implement it:

- **The contract:** the attributes, the DOM events Interop fires, `configure()` and `startInterop()`.
- **A pack:** one per framework. It adds convenience (typed inputs, element references, function
  options, server rendering) and never behavior. A pack renders only markup that core defines, from
  core's pure functions. Delete a pack and the app still works by writing plain attributes.

The loader and `configure()` live in `interop`, because a page with no framework needs them too.

This is the second draft. The first was reviewed; the findings, measurements and answers are in
`.agent/records/protocol-review.md`.

## Where it stands

- `interop` (`projects/interop/src`) imports nothing from Angular in its source. Nine specs and
  `test-setup.ts` do.
- 10 entry points are CSS only. button, highlight and tabler are TypeScript without Angular.
- 19 entry points hold 23 Angular classes. 18 of them call a binder.
- 3 components render markup in Angular templates: badge, icon and code block. All three render on
  the server today.
- 9 binder options are functions: filter `match` and `message`, character count `message` and
  `tooLong`, validation `messages`, slider `format`, tags `removed`, tag input `added` and
  `rejected`. The invoker's `pendingAction` and a toast's `action.run` are functions too.
- All binders, `toast`, `announce` and `drawIcons` bundle to 11.6 kB gzip.
- `guardActivation` imports `audit.ts`, so about 11.8 kB of audit code ships to production.
- The slider repaints after every Angular render, because a value written by a binding or a form
  fires no event.

## Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Where the loader lives | `interop`: `startInterop(options)`, `discover(root)`, `stopInterop()`, `configure(element, options)` |
| D2 | The Angular pack | A separate workspace project, `projects/protocol-angular`, released on the same version as `interop`. Package name decided at publish; `@interop/angular` is the candidate |
| D3 | Configuration | `interop-<behavior>` turns a behavior on. `itx-*` configures it. A reference to another element is an ID, as with `commandfor` |
| D4 | Function options | `configure(element, options)`. Set before the first bind, they bind once. Set after, they reach the behavior's `update()`. Compared shallowly. Text has attribute templates for the common case (`itx-message="{count} left"`) |
| D5 | Loading | The full registry by default; `startInterop({ behaviors })` takes a smaller one. Lazy only for heavy modules, starting with the code block's highlighter |
| D6 | Branch | `protocol`, one pull request per phase. Ask before creating it |
| D7 | Server rendering | Core exports a pure render function for each behavior that draws markup (`badgeText()`, `iconMarkup()`, `paginate()`). A pack component renders with it; a server can call it. The client behavior skips a host that is already rendered |
| D8 | Locale | The nearest `lang` attribute, then `navigator.language`. A pack can pass its framework's locale through `configure()` |

## The contract

A behavior is a registry entry:

```ts
{
  selector: '[interop-tabs]',
  configures: ['itx-activation', 'itx-hash'],  // a change rebinds
  state: [],                                   // a change calls update()
  writes: [],                                  // attributes the behavior sets itself; the loader ignores them
  references: [],                              // attributes holding an ID
  bind(element, read) { … return { update?(changed) {}, cleanup() {} } },
}
```

- `bind` is a written wrapper. It reads attributes and `configure()` options through `read`, then
  calls the existing binder. Binders keep their current signatures.
- A behavior that needs descendants binds its host and finds them when it needs them. Page nav
  binds the `<nav>`, not its `<ul>`.
- State that must survive a rebind lives in the DOM (`aria-selected`, the native input) or in the
  behavior through `update()`.
- A reference is resolved when an event needs it where the binder allows. Otherwise the loader
  holds the element on a waiting list until an element with that ID appears.
- A missing reference is a dev warning, not an exception.
- The events Interop fires are listed with their names and `detail`.

The loader:

- One joined selector for discovery, run on start and on each added subtree.
- One MutationObserver: `childList` and `subtree`, plus an exact `attributeFilter` generated from
  every entry's `configures`, `state` and `references`, and `id`. No prefix filter exists, so no
  `itx-*` wildcard.
- A WeakMap from element to binding, so nothing binds twice.
- On removal it walks each removed subtree for bound elements, and unbinds one only if it is still
  disconnected when the observer reports, so a node that a framework moves keeps its state.
- `stopInterop()` unbinds every binding.
- Binding is synchronous inside the observer callback. Markup inserted by script is bound before
  the next paint. Parsed and server-rendered markup can paint before binding; it must work before
  any script runs.
- `startInterop()` also installs the document-wide guards, `guardActivation` and `scopeSelectAll`.
  Either can be turned off.
- Importing it without a `document` does nothing.
- A zone.js app starts it outside Angular's zone.

## Phase 0: Clear the ground

1. Delete the `protocol` and `build:protocol` scripts from `package.json`. The app they serve no
   longer exists. The Prime theme at `projects/interop_deprecated/src/lib/styles/themes/protocol/`
   stays: it is already inside the deprecated project.
2. Take the audit out of production. `guardActivation` stops importing `audit.ts`; the audit learns
   about guards some other way, such as reading the guard's own marker. Rule from here on: the audit
   may import the loader, never the reverse.
3. Add a size test with budgets, gzipped: `guardActivation` alone, the loader under 1.5 kB, the
   full registry under 12 kB. It fails the build when a budget is passed.

## Phase 1: Guardrail

4. Add `scripts/check-framework-free.mjs` to `npm run lint`. It fails on an `@angular` import in a
   non-spec source file under `projects/interop`.
5. The allowlist of the 19 files that import Angular today is generated by the script, not typed.
   Each phase shrinks it; the goal is empty.

## Phase 2: Contract, registry and loader

6. Write the contract in `.agent/protocol.md`, as above.
7. Build the registry and the loader. Specs on plain DOM, with no TestBed:
   - every exported binder is registered, document-level, or call-only (`bindPendingAction`,
     `toast`, `announce`);
   - configuration changes rebind, state changes call `update()`, a behavior's own writes are
     ignored;
   - a moved node keeps its binding; a removed subtree's bound descendants are unbound;
   - `stopInterop()` unbinds everything, including elements removed while it was stopped;
   - a reference whose target appears later binds when it appears;
   - `configure()` before and after the first bind, with a shallow-equal object that does nothing.
8. The demo starts the loader now, so later phases can remove directives without breaking it.
9. `watchInterop()` warns about an element with a behavior attribute that never bound. The audit
   ignores the loader's writes and runs at most once per frame.
10. A browser check in `scripts/cdp/`: for each behavior, whether parsed markup paints before it
    binds. The result goes in each behavior's card.

## Phase 3: Configuration moves into attributes, batches A and B

For each binder, in one commit: write its registry entry (configures, state, writes, references),
update its spec, card and demo markup, and delete its Angular directive or leave it for the pack.
One commit per binder means an element is never bound by both.

| Batch | Behaviors | Work |
|---|---|---|
| A, no configuration | drawer, toolbar, toasts, scroll area, segmented fit, color scheme, page nav, password toggle | Registry entries. The directives go |
| B, strings, booleans, plain references | tabs (`itx-activation`, `itx-hash`), steps (`itx-history`, indicator by ID), shortcut (`interop-shortcut="mod+k"`), tooltip (by ID), radio Home and End, select all (group by ID) | Attribute parsing, references |

## Phase 4: The Angular pack

11. Create `projects/protocol-angular`, with `interop` as a peer dependency and a source-first path
    mapping in `tsconfig`.
12. Directives: typed inputs that write `itx-*` attributes; element references and functions passed
    through `configure()`, with stable options objects.
13. The invoker directive moves here: it sets `commandForElement` and `popoverTargetElement`, which
    Angular templates cannot bind, and takes `[pendingAction]`.
14. `provideInterop()` starts the loader outside Angular's zone as an app initializer. Without the
    pack, an app calls `startInterop()` in `main.ts`.

## Phase 5: Batch C and values written by code

| Batch | Behaviors | Work |
|---|---|---|
| C, references, text and functions | filter, tags, tag input, character count, validation and custom validity (`itx-custom-validity` as state) | IDs, message templates, `configure()` |
| Values | slider, character count | The behavior wraps its input's `value` property so a write from any source repaints |

15. Specs: Angular `FormControl.setValue` updates the slider fill and the character count, with no
    pack behavior. The `value` wrapper is checked in Chrome, WebKit and Firefox. If it proves
    fragile, the fallback is an `interop-update` event that a pack fires after writing.

## Phase 6: Rendering

16. Icon: core exports a pure render function and registers `drawIcons`, watching `name` and `size`
    as state. The pack's icon component renders with the pure function, so it renders on the server
    and hydrates.
17. Badge: core exports `badgeText({ count, max, label, locale })` for the shown and spoken text,
    and a behavior that draws it, keeps `announce` working through `update()` with the previous
    count, hides at zero and applies a custom `itx-color`. `count` is state. The pack's badge
    component renders with `badgeText()`.
18. Code block: the source stays as `<pre><code>` children. The behavior adds colors with
    `interop/highlight`, loaded lazily. Plain text shows at once and without JS.
19. The client behavior skips a host that is already rendered.

## Phase 7: The demo and the docs

20. The demo imports directives and components from the Angular pack.
21. Each demo page shows plain attributes first, with an Angular note for the typed directive.
22. Update the playbook, the component cards, `imports.md`, `.agent/README.md` (it still calls
    Interop a component library) and `projects/interop/README.md`, which gets the identity
    statement.

## Phase 8: Proof without Angular

23. One plain HTML page per behavior loads the built `interop` and `interop.css` and calls
    `startInterop()`. `npm run test:pages` checks them (axe, reflow, focus ring, forced colors),
    with key presses for each behavior.
24. The allowlist from phase 1 is empty.
25. Sketch a React pack without shipping it. More than a day's work means something
    framework-specific is still in `interop`.

## Phase 9: The paginator

26. `paginate({ page, total, siblings })` in `interop`: a pure function that also runs on a server.
27. The markup: `<nav interop-pagination>` around a list of links, with `aria-current="page"`,
    previous, next and gaps.
28. A behavior on `[interop-pagination]`: `itx-page` and `itx-total` as state, `itx-href="?page={n}"`
    as configuration. It clones a static `<template>`. Labels come from attribute templates. It fires
    `interop-page` and follows the link unless the event is cancelled.
29. The demo shows three uses: server-rendered links with no script, the behavior, and Angular
    rendering `paginate()` with `@for`.

## Later

- Core specs on plain Vitest.
- Building `interop` without ng-packagr.
- Loading strategies (`visible`, `idle`) once a heavy behavior needs them.
- A build-time scan for preload hints.
- WICG custom attributes ([#1029](https://github.com/WICG/webcomponents/issues/1029)). If they
  ship, the loader becomes a thin layer over them and the behaviors stay.

## Risks

| Risk | Answer |
|---|---|
| An element bound twice during the migration | Binder and directive change in the same commit; the WeakMap guards too |
| A rebind loses state | Configuration and state attributes are declared separately; state goes through `update()` |
| Observer cost in a busy app | An exact generated filter; one joined selector. Measured: +2.9 ms to insert 22k nodes |
| Wrapping a native `value` property | Specs in three engines; the `interop-update` event as fallback |
| A configuration typo fails silently | `watchInterop()` warnings and the typed pack |
| Message templates grow unwieldy | `configure()` covers the rest; review after batch C |
| Size creep | The size test from phase 0 |
