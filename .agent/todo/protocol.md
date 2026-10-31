# Protocol: Interop without a framework at its core

Interop is a platform-first UI system for the web. Its public API is HTML: elements, `interop-*`
attributes that name what a thing is, `itx-*` attributes that configure it, and CSS. Behavior the
platform lacks comes from framework-free functions in `interop`.

Protocol is the contract between Interop and a framework, and the packs that implement it:

- **The contract:** the attributes, the DOM events Interop fires, and the functions a framework
  calls: `startInterop()`, `configure()`, `refresh()`.
- **A pack:** one per framework. It adds convenience: typed inputs, element references, function
  options, server rendering. **Behavior lives only in core; a pack may call core.** A pack renders
  only markup that core defines, from core's pure functions. Delete a pack and the app still works
  by writing plain attributes.

The loader, `configure()` and `refresh()` live in `interop`, because a page with no framework needs
them too.

This is the third draft. Two critical reviews and the answers to them are in
`.agent/records/protocol-review.md`.

## Where it stands

- `interop` (`projects/interop/src`) imports nothing from Angular in its source. Nine specs and
  `test-setup.ts` do.
- 10 entry points are CSS only. button, highlight and tabler are TypeScript without Angular.
- 19 entry points hold 23 Angular classes. 19 of them call a binder.
- 3 components render markup in Angular templates: badge, icon and code block. All three render on
  the server today.
- 9 binder options are functions: filter `match` and `message`, character count `message` and
  `tooLong`, validation `messages`, slider `format`, tags `removed`, tag input `added` and
  `rejected`. The invoker's `pendingAction` and a toast's `action.run` are functions too.
- All binders, `toast`, `announce` and `drawIcons` bundle to 12.1 kB gzip.
- Nine binders create their own MutationObserver; scroll area also uses a ResizeObserver. Each
  tooltip and each shortcut adds its own document keydown listener.
- Icon drawing exists three times: `icon/icon.ts`, `src/draw-icons.ts` and `src/toast.ts`.
- The slider repaints after every Angular render, because a value written by a binding or a form
  fires no event.
- Five attributes are camelCase: `interopTooltip`, `interopFilter`, `interopShortcut`,
  `interopColorScheme`, `interopCustomValidity`. HTML lowercases them, and `attributeFilter`
  matches case-sensitively.
- Fixed in `3e37b085`: the activation guard no longer cancels clicks inside an `aria-busy` region,
  and no longer imports the audit (`guardActivation` alone: 11,782 B to 348 B gzip).

## Decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Where the loader lives | `interop`: `startInterop(options)`, `discover(root)`, `stopInterop()`, `configure(element, options)`, `refresh(element)` |
| D2 | The Angular pack | A separate workspace project, `projects/protocol-angular`, released on the same version as `interop`. Package name decided at publish; `@interop/angular` is the candidate |
| D3 | Configuration | `interop-<behavior>` turns a behavior on. `itx-*` configures it. A reference to another element is an ID. Attribute names are lowercase |
| D4 | Function options | `configure(element, options)`. Set before the first bind, they bind once. Set after, they reach the behavior's `update()`. Compared shallowly. Text has attribute templates for the common case (`itx-message="{count} left"`) |
| D5 | Loading | The full registry by default; `startInterop({ behaviors })` takes a smaller one. Lazy only for heavy modules, starting with the code block's highlighter |
| D6 | Branch | `itx-making-the-switch` |
| D7 | Who renders | One owner per host. In a framework app the pack's component owns its host: it renders core-defined markup with core's pure functions, calls core for behavior, and marks the host so the loader leaves it alone. On a page with no framework, the core behavior owns the host. Server rendering and hydration are the framework's own |
| D8 | Locale | The nearest `lang` attribute, then `navigator.language`. A pack can pass its framework's locale through `configure()` |
| D9 | Values written by code | The platform reports no programmatic write (`value`, `valueAsNumber`, `stepUp()`, a `max` clamp, `defaultValue`). Behaviors listen to `input`, `change` and the form's `reset`. Code that writes a value calls `refresh(element)`. The Angular pack calls it when a control's value changes |
| D10 | Tooltip trigger | No trigger attribute. The behavior is on `[interop-tooltip]`, and its triggers are the elements whose `aria-labelledby` or `aria-describedby` lists the tooltip's `id`. `interestfor` replaces most of the behavior once every engine ships it (Chromium only today) |

## The contract

A behavior is a registry entry:

```ts
{
  selector: '[interop-tabs]',
  configures: ['itx-activation', 'itx-hash'],  // a change rebinds
  state: [],                                   // a change calls update()
  references: [],                              // attributes holding an ID
  bind(element, read) { … return { update?(changed) {}, refresh?() {}, cleanup() {} } },
}
```

- `bind` is a written wrapper. It reads attributes and `configure()` options through `read`, then
  calls the existing binder. Binders keep their current signatures.
- **Inputs and outputs never overlap.** An attribute a behavior writes (`aria-selected`,
  `aria-current`, `hidden`) is never one of its inputs. It is read once at bind time and never
  watched. An app changes state through a declared state attribute or a function call.
- A behavior that needs descendants binds its host and finds them when it needs them. Page nav
  binds the `<nav>`, not its `<ul>`.
- State that must survive a rebind lives in the DOM or in the behavior through `update()`.
- A reference is resolved when an event needs it where the binder allows. Otherwise the loader
  holds the element on a waiting list until an element with that ID appears.
- A missing reference is a dev warning, not an exception.
- The events Interop fires are listed with their names and `detail`.

The loader:

- **Discovery:** one joined selector, run on start and on each added subtree.
- **Observation:** one MutationObserver with `childList` and `subtree`, and an exact, lowercase
  `attributeFilter` generated from every entry's `configures`, `state` and `references`, plus `id`,
  `aria-labelledby` and `aria-describedby`.
- **Each batch, in order:** removals, then additions, then attribute records. Attribute records are
  ignored for an element bound in the same batch. Configuration and state changes to one element in
  one batch cause one rebind.
- **Bindings:** a Map from element to binding, and a Set of bound elements. A removal sweeps the Set
  for elements no longer connected (measured: 0.3 ms for 2000 removed rows, against 5.5 ms querying
  each removed subtree). A node a framework moves is still connected and keeps its binding.
- **Waiting list:** when it is not empty, each batch looks up the waiting IDs, because an element
  inserted with its `id` already set produces no attribute record. An entry is dropped when its
  waiting element is unbound. An ID still missing after a while is a dev warning. Duplicates
  resolve to the first in the document, as `getElementById` does.
- **Scope:** the document. Shadow roots are out of scope, as Interop is light DOM.
- **Owned hosts:** an element the pack marks is never bound.
- `stopInterop()` unbinds every element in the Set.
- Binding is synchronous inside the observer callback. Markup inserted by script is bound before
  the next paint. Parsed and server-rendered markup can paint before binding; it must work before
  any script runs.
- `startInterop()` installs `guardActivation` and `scopeSelectAll`. Either can be turned off.
- Importing it without a `document` does nothing.
- A zone.js app starts it outside Angular's zone.

## Phase 0: Clear the ground

1. Delete the `protocol` and `build:protocol` scripts from `package.json`. The app they serve no
   longer exists. The Prime theme at `projects/interop_deprecated/src/lib/styles/themes/protocol/`
   stays: it is inside the deprecated project.
2. Add a size test with budgets, gzipped, rechecked against measurements when this phase starts:
   loader 1.5 kB (a prototype measured 1.4 kB), the two document guards 0.5 kB counted separately,
   full registry 13 kB (today 12.1 kB). Dev warnings are stripped from production and not counted.
   Every new behavior states its cost.
3. Tooltip and shortcut share one document keydown listener each, in place of one per instance.

## Phase 1: Guardrail

4. Add `scripts/check-framework-free.mjs` to `npm run lint`. It fails on an `@angular` import in a
   non-spec source file under `projects/interop`.
5. The allowlist of the 19 files that import Angular today is generated by the script. Each phase
   shrinks it; the goal is empty.

## Phase 2: Contract, registry, loader and browser harness

6. Write the contract in `.agent/protocol.md`, as above.
7. Build the loader with an empty registry. The registry spec allows "not yet migrated" through a
   list that shrinks to nothing; every other exported binder is registered, document-level or
   call-only (`bindPendingAction`, `toast`, `announce`).
8. Loader specs on plain DOM, with no TestBed: batch order and coalescing; configuration rebinds,
   state updates; outputs never trigger anything; a moved node keeps its binding; the removal
   sweep; `stopInterop()`; a reference whose target appears later, including one inserted with its
   `id` set; `configure()` before and after the first bind; owned hosts skipped.
9. A browser runner for what jsdom cannot test: Playwright with Chromium and WebKit, for paint
   timing, ResizeObserver, popover and `commandfor`, `:focus-visible` and `ariaNotify`. Firefox
   needs `npx playwright install firefox`; ask before downloading it.
10. In the browser runner: measure the order in which Angular inserts nodes and sets bound
    attributes in the demo; benchmark 500 tooltips (listeners and observers per instance); record
    for each behavior whether parsed markup paints before it binds, in its card.
11. The demo starts the loader. Its own `guardActivation()` call in `main.ts` goes in the same
    commit, as `startInterop()` installs the guard.
12. `watchInterop()` warns about an element with a behavior attribute that never bound. The audit
    ignores the loader's writes and runs at most once per frame.

## Phase 3: Configuration moves into attributes, batches A and B

For each binder, in one commit: write its registry entry, take it off the "not yet migrated" list,
update its spec, card and demo markup, and delete its Angular directive or leave it for the pack.

| Batch | Behaviors | Work |
|---|---|---|
| A, no configuration | drawer, toolbar, toasts, scroll area, segmented fit, color scheme (`interop-color-scheme`), page nav, password toggle | Registry entries. The directives go |
| B, strings, booleans, references | tabs (`itx-activation`, `itx-hash`), steps (`itx-history`, indicator by ID), shortcut (`interop-shortcut="mod+k"`), tooltip (D10), radio Home and End, select all (group by ID) | Attribute parsing, references, the camelCase renames |

## Phase 4: The Angular pack

13. Create `projects/protocol-angular`, with `interop` as a peer dependency and a source-first path
    mapping in `tsconfig`.
14. Directives: typed inputs that write `itx-*` attributes; element references and functions passed
    through `configure()`, with stable options objects. A tooltip input that takes an element
    writes the trigger's `aria-labelledby` or `aria-describedby`.
15. The invoker directive moves here: it sets `commandForElement` and `popoverTargetElement`, which
    Angular templates cannot bind, and takes `[pendingAction]`.
16. `provideInterop()` starts the loader outside Angular's zone as an app initializer. Without the
    pack, an app calls `startInterop()` in `main.ts`.

## Phase 5: Batch C and values written by code

| Batch | Behaviors | Work |
|---|---|---|
| C, references, text and functions | filter (`interop-filter`), tags, tag input, character count, validation and custom validity (`itx-custom-validity` as state) | IDs, message templates, `configure()` |
| Values | slider, character count | `input`, `change` and `reset` listeners, and `refresh()` (D9). The slider's per-render hook goes |

17. Specs: after Angular's `FormControl.setValue` and a signal form's `valueAsNumber` write, the
    pack's `refresh()` call updates the slider fill and the character count. A plain-JS spec calls
    `refresh()` after `stepUp()`.

## Phase 6: Rendering

18. Icon: one function, `iconParts(name)`, returns the view box and paths. `drawIcons`, the toast and
    the pack's icon component all draw from it, with no `innerHTML`. `name`, `size`, `aria-label`
    and `aria-labelledby` are state.
19. Badge: core exports `badgeText({ count, max, label, locale })` for the shown and spoken text,
    and an announce helper that takes the previous and next count. The core behavior draws a badge
    on a page with no framework. The pack's badge component renders with `badgeText()` and calls
    the announce helper. `count` is state.
20. Code block: the markup is the template. The author writes the figure, caption, copy button and
    `<pre><code>`. A separate behavior, `interop-copy`, copies. The code-block behavior adds colors
    with `interop/highlight`, loaded lazily, and line numbers. Plain text shows at once and without
    JS. The pack's component renders the same markup.

## Phase 7: The demo and the docs

21. The demo imports directives and components from the Angular pack.
22. Each demo page shows plain attributes first, with an Angular note for the typed directive.
23. Update the playbook, the component cards, `imports.md`, `.agent/README.md` (it still calls
    Interop a component library) and `projects/interop/README.md`, which gets the identity
    statement. The tooltip card records `interestfor` as its exit path.

## Phase 8: Proof without Angular

24. One plain HTML page per behavior loads the built `interop` and `interop.css` and calls
    `startInterop()`. `npm run test:pages` checks them (axe, reflow, focus ring, forced colors),
    with key presses for each behavior.
25. The phase 1 allowlist is empty.
26. Sketch a React pack without shipping it. More than a day's work means something
    framework-specific is still in `interop`.

## Phase 9: The paginator

27. `paginate({ page, total, siblings })` in `interop`: a pure function that also runs on a server.
28. The markup: `<nav interop-pagination>` around a list of links, with `aria-current="page"`,
    previous, next and gaps.
29. A behavior on `[interop-pagination]`: `itx-page` and `itx-total` as state, `itx-href="?page={n}"`
    as configuration. It clones a static `<template>`. Labels come from attribute templates. It fires
    `interop-page` and follows the link unless the event is cancelled.
30. The demo shows three uses: server-rendered links with no script, the behavior, and Angular
    rendering `paginate()` with `@for`.

## Shipping

Nothing ships before the branch merges. Every pull request keeps the demo working. Rolling back a
phase is a revert of its pull request.

## Later

- Core specs on plain Vitest.
- Building `interop` without ng-packagr.
- Loading strategies (`visible`, `idle`) once a heavy behavior needs them.
- A build-time scan for preload hints.
- WICG custom attributes ([#1029](https://github.com/WICG/webcomponents/issues/1029)) and
  `interestfor`. As they ship, the loader and the tooltip behavior get thinner.

## Risks

| Risk | Answer |
|---|---|
| An element bound twice during the migration | The "not yet migrated" list; binder and directive change in the same commit; the Map guards too |
| A rebind loses state | Configuration and state are declared separately; state goes through `update()` |
| A rebind recreates a binder's own observers and listeners | Counted per behavior in the browser runner; shared document listeners for tooltip and shortcut |
| Observer cost in a busy app | An exact generated filter, one joined selector, ordered batches. Measured: +2.9 ms to insert 22k nodes |
| A value written by code leaves a stale display | `refresh()`, called by packs and documented for plain JS |
| Two renderers on one host | One owner per host, marked by the pack |
| A configuration typo fails silently | `watchInterop()` warnings and the typed pack |
| Message templates grow unwieldy | `configure()` covers the rest; review after batch C |
| Size creep | The size test from phase 0 |
