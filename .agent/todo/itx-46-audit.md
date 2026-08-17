# ITX-46 — Library & demo audit

Four parallel read-only reviews (token naming, CSS practices, Angular/TypeScript,
quick wins), consolidated and deduplicated. **No code was changed.**

Every claim marked ✅ was re-verified independently after the reviewing agent
reported it — several did not survive that check, and those corrections are kept
in place rather than quietly dropped, because the same reasoning errors will recur.

**Codebase, for scale:** 181 hand-written TS files (21,973 lines) + 89 CSS files
(17,249 lines) in the library; 58 TS / 48 CSS / 44 HTML in the demo; 11 build
scripts (3,247 lines). Plus **18,431 generated icon files (74 MB)**, which are
99% of the repo's file count and should be mentally excluded from every figure.

---

## 1. The headline: one bug class, 16 sites, 3 confirmed bugs

**A CSS-wide keyword as a custom-property value never does what it looks like.**

```css
--itx-kbd-perspective: unset;   /* NOT "no perspective" */
--itx-button-corner-shape: unset;
--itx-button-background-hover: inherit;
```

`unset` / `inherit` / `initial` in a custom-property declaration apply **to the
custom property itself**, not to the property that later reads it. `unset` on an
inherited custom property means *inherit*; with nothing up the tree declaring it,
that resolves to guaranteed-invalid, and the reading declaration dies with it.

✅ **Proven in Chrome**, not inferred:

| construct | computed result |
|---|---|
| `--p: unset` → `transform: perspective(var(--p)) rotateX(20deg)` | **`none`** — whole transform dead |
| `--p: 12rem` → same declaration | real `matrix3d(…)` |
| `--bg: inherit` → `background-color: var(--bg)` | **`rgba(0,0,0,0)`** — transparent, *not* the parent's colour |
| `--cs: unset` → `corner-shape: var(--cs, initial)` | **`round`** — the intended value never applies |

✅ **16 declarations across 8 files.** Three are confirmed user-visible bugs:

- **`typography/kbd.css:38`** — the keycap 3D tilt has never rendered. `--itx-kbd-tilt: 20deg` is dead with it. *(I found this one earlier in the session and left it as a design call; it is unchanged.)*
- **`themes/protocol/components/button.css:56`** — `--itx-button-corner-shape: unset` means the "squircle" default has never rendered. The theme comment at `:271-276` explains at length why `itx-radius="full"` must switch to `round` "while every other radius keeps the squircle curve" — that override is protecting a state that does not exist.
- **`themes/protocol/rigs/toolbar.css:63-69`** — six declarations meant to neutralise button hover/active inside a toolbar. Because `unset`/`inherit` make the toolbar *inherit* the root's values, a button in a toolbar still gets the full `--itx-contrast-2` hover fill. The rig's stated "flat chrome" intent is not achieved. `--itx-button-font-family: inherit` at `:47` fails the same way.

The other 13 sites happen to land on the intended result because the property is
inherited anyway, or because the reading `var()` carries a matching literal
fallback. They are working by accident.

**This is the single highest-yield guard to add** — one regex,
`/^\s*--[\w-]+:\s*(unset|initial|inherit|revert|revert-layer)\s*;/m`, and it would
have caught all three bugs the day each was written.

---

## 2. Other confirmed silent failures

✅ **`--itx-contrast-6-on` does not exist** — `themes/protocol/components/visimorph/visimorph.css:33`, **0 declarations** repo-wide.

*Correction to the reviewing agent:* it claimed this makes `--itx-control-indicator`
guaranteed-invalid and that it "inherits as such into the whole subtree" — the
transparent-page failure mode from `.agent/color.md:20`. **It does not.** The read at
`components/visimorph/visimorph.css:78` is
`var(--itx-control-indicator, var(--itx-contrast-1, #ffffff))`, and a `var()` falls
back precisely when its property is guaranteed-invalid. The real effect: the
indicator resolves to `--itx-contrast-1` in **both** schemes. Light mode is
accidentally correct; **dark mode gets rank 1 — a *wash* — where rank 6 was
intended.** A near-invisible check stroke in dark mode, scoped to one component.

✅ **All ten `--itx-layout-gap-N` tokens are read and never declared** —
`directives/interop-layout/layout.types.ts:84-95`, 11 mentions, **0 declarations**.
Consumed as `gap: var(--itx-layout-gap, 0)`, so every gap variant silently
produces zero gap. *Unverified at runtime* (the directive has no live usage — see §6),
so this may be dead code failing rather than a user-visible bug.

✅ **Code-block tab hover paints the selected colour.**
`composites/code-block.css:95` — the `:hover` rule reads
`--itx-cb-tab-foreground-active` (rank 6), while `--itx-cb-tab-foreground-hover`
(rank 4) is declared at theme `:108` and **never read**. Hover is visually identical
to the selected tab. Root cause: this one component uses three state suffixes
(`-active`, `-hover`, `-current`) for two states.

✅ **Page-nav's current-item gradient is invalid syntax and never paints.**
`themes/protocol/composites/page-nav.css:81-85`:
`radial-gradient(circle at 0 0 25%, #ff9c56, transparent)`. Size must precede `at`,
and a three-value position is only legal in the keyword-plus-offset form. Compounding
it: `#ff9c56` is a raw light-only hex, and
`themes/protocol/components/command-palette.css:67` documents removing *this exact
colour for this exact reason* — the page-nav copy survived that sweep.

**Not caught by any guard**, because a hex is neither an elevation nor a contrast token.

---

## 3. The cascade-layer contract has a 16-component hole

✅ **16 components ship an unlayered per-component `styleUrl`** — ~2,894 lines.

Angular injects these into `<head>` at runtime, unlayered, and emulated
encapsulation adds `[_ngcontent-…]` for another `(0,1,0)`. Per the contract in
`interop.css:27-30`, **unlayered beats layered regardless of specificity** — so these
16 are the precise failure mode the entire layer architecture exists to prevent.

Worst cases: `interop-listbox` uses `ViewEncapsulation.None`, making its 199 lines
global *and* unlayered. Three components have a **layered theme half but an unlayered
structural half** — `terminal`, `progress`, `segmented-control` — which is the most
confusing possible state to debug. `segmented-control` also breaks the file-pairing
convention (`styles/components/segment.css` ↔
`themes/protocol/components/segmented-control.css`), making the pairing invisible to
tooling.

There is already a tracking note at `.agent/todo/styleurl-components-migration.md`.
The four named above are the cheapest to move, since their theme halves exist.

**Related:** `popover.css` ships 11 rules / 16 selectors at up to `(0,5,0)`
specificity, justified by a comment at `:157-160` that misreads the pseudo-element
rule. Only the pseudo-*element* must sit outside `:where()`; the compound before it
belongs inside. Eight other files do this correctly. Separately, 9 `@property`
registrations live in per-component stylesheets — `@property` is document-global and
cannot be encapsulated, so these are load-order-dependent global side effects, four of
them registering `--_`-prefixed *private* names globally.

---

## 4. Tooling: the formatters and linters are not installed

✅ **`prettier`, `stylelint`, `postcss-scss` and `eslint` are absent from
`node_modules` *and* undeclared in `package.json`.**

Consequences, in order of importance:

- **`.stylelintrc.json` has never run and cannot.** Its three rules are dead config.
  The project's own notes record that this config was *fixed* after a first run
  reported 6,451 spurious errors — that fix has never been exercised.
- **Formatting has measurably drifted**: `.prettierrc.json` declares `useTabs: true`;
  roughly a third of TS files are space-indented. Quote style splits similarly.
- **`npx prettier` still works**, because npx downloads an unpinned binary on demand.
  *This implicates my own work*: every `npx prettier --write` I ran across this session
  pulled prettier 3.9.6 from the network rather than a pinned dependency. The results
  were consistent, but they were not reproducible by anyone else.

Also broken: `npm run build`, `build:watch` and `test` all invoke bare `ng` commands,
but `angular.json` defines three projects and no `defaultProject`, so they error out.
`README.md:92-104` documents these plus a non-existent `npm run lint`, and describes
stylelint as enforcing `--ntr-*` naming — a prefix that appears nowhere.
`lint:boundaries` is never invoked by `lint:tokens`, so the composites
dependency-direction guard is silently skipped by the composite lint command.

---

## 5. Naming inconsistency, quantified

Nothing here is broken; all of it costs discoverability. Counts are the reviewing
agents' and are not individually re-verified.

| concept | competing spellings | counts |
|---|---|---|
| corner radius | `-border-radius` vs `-radius` | 24 vs 29; expansion-panel and code-block each use **both** |
| easing | `-transition-timing-function` / `-transition-easing` / `-transition-timing` / bare `-easing` | 7 / 3 / 2 / 2 (+8 `-enter`/`-exit-easing`); expansion-panel uses two |
| text colour | `-color` vs `-foreground` | 76 vs 29; **7 components use both** |
| background | `-background` / `-background-color` / `-bg` | 36 / 9 / 12; page-nav has all three in circulation, two of them fictional |
| state position | suffix (documented) vs infix | ~9 infixed, e.g. `--itx-tab-active-background` alongside `--itx-tab-background-hover` in one file |

**Phantom documented surface: 45 `--itx-*-outline-*` names, 0 read.** When
`tokens/focus.css` landed, focus tokens were renamed to `-focus-*`; the old
`-outline-*` names survive in component header comments and — worse — in the demo's
public token tables (`button-page.ts:451-457`, `chip-page.ts:265-311`,
`tabs-page.ts:327-354` and four more). A consumer copying any of them gets silence.
The demo also reads **7 tokens that exist nowhere** (`--itx-text`, `--itx-radius-pill`,
`--itx-primary`, `--itx-line-height-body-lg`, …), each a no-fallback `var()` that
silently drops its declaration.

**Prefix split has an undocumented second axis.** The stated rule is `interop-*` =
identity, `itx-*` = configuration. But four *element tag names* — `itx-page-nav`,
`itx-code-block`, `itx-inline-code`, `itx-terminal` — are pure identity wearing the
config prefix. The dividing line is exactly components-vs-composites, which is real
but undocumented. Meanwhile `angular.json` declares `prefix: "itx"` for a library
where 60 selectors use `interop-` and 4 use `itx-`, so the CLI's prefix lint is
enforcing nothing. The demo declares `dtx` and uses no prefix at all.

---

## 6. Dead code and quick wins

✅ Individually verified unless noted.

| finding | size | risk |
|---|---|---|
| `Working-Iconset-Files/` + `tools/gen-phosphor-icons.ts` — superseded icon pipeline | **1,516 files, 6.0 MB**, 232 lines, and the *only* consumer of `fast-xml-parser` | none |
| `lib/attrs/` — orphaned duplicate of the shipped `InteropAttribute` service | 3 files, 415 lines, **0 imports** | **see caveat below** |
| `set-class.directive.ts` — not in `directives/public-api.ts`, no template uses `[setClass]` | 244 lines | none |
| `utilities/axis-rule.css` — **0 imports**, but present in `dist/interop/styles/utilities/` | 79 lines **shipping to consumers** | none |
| `interop-layout/layout.scss`, `interop-tooltip.scss` — referenced by nothing | 68 lines | none |
| `marked` in `dependencies`; used only by an app | 1 dep reclassified | none |
| Root `package.json` `main`/`module`/`types`/`files` point at paths that do not exist | 4 keys | none |
| `walk()` duplicated across 6–7 build scripts, 4 byte-identical | ~40–50 lines | none |
| 14 theme tokens declared and never read (page-nav 8, code-block 5, toast 1) | 14 decls | none |
| Duplicate declaration in one block — `code-block.css:80` dead, `:84` wins | 1 line | none |

*Found independently by two agents*, which raises confidence: the duplicate
declaration, `axis-rule.css`, and the `walk()` duplication.

### Caveat on `lib/attrs/` — the code is dead, the documentation is not

Raised from memory during review, and worth recording because the flat "delete it"
recommendation was misleading.

The **feature** is live. `attrsPreset` is a public input on **three** components —
`interop-list`, `interop-checkbox`, `interop-radio-control` — resolved through
`attrsPresetResolved` and applied by `ManageAttributesDirective` via `hostDirectives`.
`Presets.ListPassive` is exactly the "keep list semantics when the host is not a
`<ul>`" mechanism:

```ts
":host": { role: "list" },
':host > :not([data-interop-managed="false"])': { role: "listitem" },
```

✅ What is dead is only the **`lib/attrs/` copy of it**. Nothing imports that
directory; all three components import from `services/interop-attribute.service.ts`,
and I diffed the presets — the config objects are byte-identical.

But the line-count difference between the two is **JSDoc**, and the orphan is where
it lives: worked examples (`<interop-list [setAttrs]="Presets.ListPassive">`, the
spread-and-override pattern for `aria-labelledby`) plus a 153-line `USAGE.md`. The
live service carries terse inline comments instead.

**So: salvage before deleting.** Move the JSDoc onto the service's `Presets` and
either fold `USAGE.md` into `.agent/services/` or keep it beside the service. Then
delete the directory. Deleting first loses the only real documentation of a published
API.

Also worth knowing: **no consumer sets `attrsPreset` anywhere in the repo.** The only
non-library hit is the demo's API *table* on the list page (`list-page.ts:126`), which
documents the input rather than using it. The feature ships, is undocumented outside
the orphan, and is demonstrated nowhere — which is a plausible reason it had faded
from memory as "the thing list uses".

**Needs a judgement call, not a sweep:** `InteropLayoutDirective` (~470 lines + a
248-line README) has no template usage anywhere — its only live consumer is the
`LayoutCapable` marker type — but it *is* published API, and that README reads like a
roadmap rather than an abandonment. Same shape for `IconScopeDirective` (35 lines).
Removing either is breaking for consumers.

**Angular-side quick wins:** ✅ 7 `allowSignalWrites` flags that are no-ops and log a
console warning on every effect creation — I confirmed the deprecation warning exists
in the installed `@angular/core` 21.2.20. A dead `effect()` in `interop-toolbar.ts:133`
that reads no signals (so it runs once and never again), and an untorn-down
subscription at `:150` — the only unmanaged subscription in the library. 138 redundant
`standalone: true` declarations.

*Correction to the reviewing agent:* it reported `CommonModule` as unused in **7**
components. It is unused in **5** — ✅ `interop-table.html:107` and `interop-list`
both use `*ngTemplateOutlet` and would break. For those two the right fix is narrower
than removal anyway: import `NgTemplateOutlet` alone rather than the barrel, which is
what the project's own import convention prescribes.

---

## 7. Guards worth adding, ranked by bug-yield

The existing six guards are good and none of the findings above duplicate them. These
are the gaps, ordered by how many real bugs each would have caught:

1. **CSS-wide keyword as a custom-property value** — one regex, 16 hits, **3 confirmed bugs**. §1.
2. **State token read without a `var()` fallback** — 42 hits. This is the mechanism that let `--itx-cb-tab-foreground-hover` be renamed out from under its read with no visible failure.
3. **Theme token declared but never read** — 14 hits. `generate-token-reference.mjs` already parses both halves; this is a `--check` mode away.
4. **A `--itx-*` read with no fallback that is declared nowhere** — 12 hits, and it covers §2's three worst findings as one rule.
5. **Hex or named colour anywhere under `styles/components|composites|rigs`** — 8 hits plus the page-nav gradient; a two-line extension to `check-color-axes.mjs`.
6. **File under `styles/` not reachable from a manifest** — 1 hit, and it would have caught `axis-rule.css` the day it landed.
7. **Literal border-width outside a radius declaration** — 12 hits. `.agent/css-strategy.md:301` already forbids these; `check-shape.mjs` enforces only the radius half, so four `1px` hairlines silently ignore `prefers-contrast`.

---

## 8. Suggested sequencing

Cheap and mechanical first, so the substantive changes are not buried:

1. **Install and pin the tooling** (`prettier`, `stylelint`, `postcss-scss`), add `format` / `format:check` / `lint:css` scripts, run the formatter once as its own commit. Everything else is easier to review afterwards, and it stops the drift permanently.
2. **Delete the confirmed dead weight** — the icon pipeline (6 MB), `lib/attrs/`, `set-class.directive.ts`, `axis-rule.css`, the two orphan stylesheets. One commit, no behaviour change.
3. **Fix the CSS-wide-keyword class and add its guard** — three real bugs, and the guard prevents recurrence. Decide the kbd tilt and the button squircle as design questions while you are in there.
4. **Fix the four other silent failures** — `--itx-contrast-6-on`, the code-block hover token, the page-nav gradient, the layout-gap family.
5. **Angular mechanicals** — `allowSignalWrites`, the toolbar's dead effect and leaked subscription, `CommonModule` in the 5 files where it is genuinely unused.
6. **Then the judgement calls** — naming convergence (radius / easing / colour / background), the prefix question, the 16 unlayered `styleUrl` components, and whether `InteropLayoutDirective` is roadmap or deprecation.

## What was not determined

- Whether the rank-4-as-border cases (6) are deliberate Carbon-borrow decisions or typos.
- Whether the 4 `itx-` composite tags vs 60 `interop-` components is intentional signal.
- Runtime confirmation of the layout-gap bug — the directive has no live usage to observe.
- Bundle impact of the demo's 45 root-barrel imports; no production build was run.
- `ignore_for_now/`, `dist/`, `docs/` and `examples/` were not audited.
