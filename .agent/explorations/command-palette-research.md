# Command Palette — New-Component Research

Research output for `new-component-research.md` run on the **Command Palette**
(⌘K/Ctrl+K: a modal overlay with a filter input over a list of commands/nav
items; arrows move an active highlight, Enter runs it, Esc closes). Interop
ethos: native elements before ARIA, a11y non-negotiable, minimal styling,
signal-based Angular 21, light DOM, zero-specificity CSS.

**One-line verdict:** a command palette is an *editable combobox with a filtered
listbox popup, inside a modal dialog*. Interop's win is to **decline the fuzzy
ranking engine everyone else ships** and instead nail the thing they all botch —
**consumer-owned (controlled) filtering that stays keyboard- and screen-reader-
correct as async results stream in** — by *composing* primitives it already owns
(native `<dialog>`, a real `role=listbox`, `InteropActivation`, invoker commands).

---

## 1. Semantic Correctness & Accessibility

**Core pattern:** native `<dialog>.showModal()` (shell) → `<input type="text"
role="combobox">` (filter) → `<ul role="listbox">` / `<li role="option">`
(results). Virtual focus via **`aria-activedescendant`** — DOM focus stays on the
input; **never roving tabindex**. Add two things the raw combobox pattern lacks:
(1) modal focus-trap + focus-return (native `<dialog>` gives this), and (2) a
**polite `aria-live` announcer** for result count + empty state.

### Host elements

| Part | Host | Why |
|---|---|---|
| Modal shell | native `<dialog>` + `.showModal()` | Browser modal semantics, top-layer, backdrop, background `inert`, Esc-to-close — free. cmdk/Radix simulate this in JS only because React lacked `<dialog>` ergonomics; we don't need to. |
| Filter field | `<input type="text" role="combobox">` | MDN's recommended editable-combobox host; what cmdk emits. **Not `type="search"`** — its `searchbox` mapping + UA clear-button + Chrome's native Esc-clears-field fight our two-stage Esc, and it invites native search-history popups. Set `autocomplete/autocorrect/spellcheck` off. |
| Results | `<ul role="listbox">` / `<li role="option">` | listbox/option are **required** by the combobox pattern; `<ul>/<li>` carry no listbox semantics alone, so the roles are authored (honest, light-DOM). **Not `role=menu`** for v1 — different keyboard contract (roving, no text input); listbox is far more AT-tested. |

### ARIA matrix (required unless noted)

- **dialog:** `role=dialog` (implicit), `aria-modal=true`, `aria-label`/`-labelledby` (required, one), `aria-describedby` (optional).
- **input:** `role=combobox`; `aria-expanded` (the only strictly-required combobox attr); `aria-controls`→listbox id; `aria-activedescendant`→active option id (empty when none); `aria-autocomplete=list` (recommended); `aria-label`/`-labelledby` (required name); `aria-haspopup` optional for a listbox popup.
- **listbox:** `role=listbox`, `aria-label` (recommended).
- **option:** `role=option`; **`aria-selected=true` on the active option** (VoiceOver won't announce it otherwise); `aria-disabled` (optional).

A combobox may control `listbox | tree | grid | dialog` popups, so a listbox
*inside* a dialog shell is well within spec ([MDN combobox role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role)).

### Keyboard model (APG combobox ⊕ dialog)

| Key | Action |
|---|---|
| printable / Backspace | type → re-filter |
| ArrowDown / ArrowUp | move active option; **wrap** (DS convention; APG leaves optional) |
| Home / End | first / last option |
| Enter | run active command → close → return focus |
| **Escape (two-stage, recommended)** | text present → clear text (stay open); empty → close + return focus. APG allows "closes popup, optionally clears"; Dialog says "closes dialog". Single-stage always-close is the simpler documented alternative. |
| Tab / Shift+Tab | trapped inside the dialog (often the input is the only tab stop → effectively inert). Diverges from Headless UI's non-modal "Tab selects + closes", which is wrong in a modal. |

Sources: [APG Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/),
[APG Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/),
[Headless UI Combobox](https://headlessui.com/react/combobox).

### Focus management (the load-bearing decision)

- **Initial focus → the input** (type immediately).
- **Modal trap + background `inert`** — native `<dialog>.showModal()` provides both; no JS focus-trap lib needed.
- **Focus return on close** — to the invoker. A ⌘K palette is summoned by a *hotkey*, not a click, so **capture `document.activeElement` at open, restore on close** (native return only works when opened from a real element).
- **`aria-activedescendant`, not roving tabindex.** Combobox keeps *real* DOM focus on the input and moves only a *virtual* highlight ([APG](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)). Roving would move `document.activeElement` onto options and the input would lose the ability to type. ([Sarah Higley — *aria-activedescendant is not focus*](https://sarahmhigley.com/writing/activedescendant/)).
- **Scroll-into-view** — `aria-activedescendant` doesn't auto-scroll; move the active option into view (`{block:'nearest'}`) on each step.

### Announcements — the known hotspot (WCAG 4.1.3, Level AA)

The listbox alone does **not** reliably tell an SR user how many results remain,
and `aria-activedescendant` support is uneven (VoiceOver especially). Add a
**visually-hidden `role=status` / `aria-live=polite`** region and push short
status strings: announce the **count only when it changes** ("12 results
available"); render a visible **"No commands found"** and mirror it into the live
region (empty state is the one worth being firmer about). React Aria built
exactly this because "VoiceOver's insufficient support for `aria-activedescendant`"
left counts unannounced ([Building a ComboBox](https://react-aria.adobe.com/blog/building-a-combobox));
**cmdk ships no live region at all** — a real gap Interop closes.
([Understanding SC 4.1.3](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html),
[Scott O'Hara — dynamic results](https://www.scottohara.me/blog/2022/02/05/dynamic-results.html)).

### Sensory / responsive

- **Reduced motion:** gate open/close + highlight transitions behind `prefers-reduced-motion` (instant/opacity-only). Little motion to begin with.
- **Forced colors:** active-option indicator must survive stripped backgrounds — use `Highlight`/`HighlightText` + an outline, not background-color alone.
- **RTL:** logical properties throughout; mirror leading glyph / trailing shortcut by logical placement.
- **Touch target:** option rows ≥ 24×24 CSS px (WCAG 2.5.8 AA; 44×44 AAA) — generous inline padding + comfortable min-height even when dense.

### Form participation — **neither CVA nor ElementInternals**

A palette is an **action launcher**, not a data-collection control: its input
collects an ephemeral *query* used only to filter, and its output is *running a
command*, not a name/value pair. So no CVA, no FACE. Guardrail: `Enter` must
`preventDefault()` and route to command activation (never form submit) — through
`InteropActivation`, not ngForm.

### Explicit divergence

- **Combobox nested in a modal dialog — valid?** Yes. Dialog is the container; the combobox's `aria-controls` targets the listbox; combobox popups may themselves be dialogs. cmdk ships this in production. → **proceed.**
- **listbox vs menu for results.** APG/cmdk/MDN → **listbox** (Camp A). React Aria → autocomplete-over-**menu/listbox** (Camp B), semantically tidier for pure actions but harder to hand-roll. → **v1: listbox** (best AT coverage).
- **How counts are announced.** cmdk → **nothing**; React Aria → **explicit polite live region**. → **follow React Aria** (WCAG 4.1.3).
- **`aria-activedescendant` AT gaps.** Real: VoiceOver/Safari can ignore it, mobile SRs "essentially ignore" it, **VoiceOver needs `aria-selected` on the active option to announce it** ([Higley](https://sarahmhigley.com/writing/activedescendant/), [WebKit 231724](https://bugs.webkit.org/show_bug.cgi?id=231724), [Headless UI #2129](https://github.com/tailwindlabs/headlessui/issues/2129)). → use `aria-activedescendant` (still correct) **belt-and-braces**: `aria-selected` on active + mirror active label/count into the live region.

**Recommended path:** native `<dialog>` → `input[role=combobox]` → `ul[role=listbox]`/`li[role=option]`, virtual focus via `aria-activedescendant` (never roving), `aria-selected` on active, visually-hidden polite announcer for changed counts + empty. Camp A hardened with Camp B's announcer. Out of forms; `Enter` through `InteropActivation`.

---

## 2. Pain Points in Existing Implementations

Angular Material ships **no** command palette, so the de-facto incumbent is
**cmdk** (React; Vercel/Linear/shadcn), plus what Angular devs cobble from
autocomplete + dialog + CDK overlay. Critical review:

### What cmdk gets right
Controlled input-driven filtering with default ranking; composable headless
primitives (`Command.Input/List/Item/Group/Empty`); coherent keyboard model with
`aria-activedescendant`; escape hatches (`shouldFilter={false}` + custom `filter`
returning 0–1); first-class `Command.Loading` / `Command.Empty`; portal-free
light-DOM you can style with plain CSS. ([cmdk README](https://github.com/pacocoursey/cmdk)).

### What it gets wrong
1. **A11y (biggest).** The pattern leans on `aria-activedescendant`, ignored by mobile SRs and flaky on VoiceOver; cmdk shipped silent arrow-nav on ChromeVox ([#253](https://github.com/pacocoursey/cmdk/issues/253)) and a `Command.Dialog` with no accessible name ([#393](https://github.com/pacocoursey/cmdk/issues/393)); no live region → counts unannounced. Endemic across the class ([Headless UI #2129](https://github.com/tailwindlabs/headlessui/issues/2129)).
2. **Identity via `textContent`.** `value` is inferred from text, so icons/dynamic labels corrupt filtering/selection unless you pass a stable `value`; non-unique values highlight two items as one ([#291](https://github.com/pacocoursey/cmdk/issues/291)).
3. **Keystroke-coupled filtering.** Async results arriving without a keystroke never re-rank; the shim is pinning `shouldFilter` to `!loading` ([discussion #169](https://github.com/pacocoursey/cmdk/discussions/169)). No built-in "pages"/nested commands.
4. **Fragility.** No virtualization (self-limits to ~2–3k items); racy scroll restoration ([#389](https://github.com/pacocoursey/cmdk/issues/389)).
5. **Motion/focus/mobile.** Palette-in-dialog breaks wheel-scroll of the list ([#272](https://github.com/pacocoursey/cmdk/issues/272)); kbar mirrors it — focus broken inside a MUI Dialog ([kbar #361](https://github.com/timc1/kbar/issues/361)), focus stolen from external inputs ([kbar #171](https://github.com/timc1/kbar/issues/171)).
6. **Grouping semantics** are yours to get wrong: kbar section headings counted as list items by SRs, closed wontfix ([kbar #269](https://github.com/timc1/kbar/issues/269)).

**Angular specifically:** no first-class palette, so teams port cmdk
([@ngxpert/cmdk](https://github.com/ngxpert/cmdk)) or cobble from
autocomplete + dialog + overlay — where the seams tear. mat-autocomplete's live
region is appended to `document.body`, so a dialog's `aria-hidden` wrapper
**mutes result announcements entirely** ([angular/material #10804](https://github.com/angular/material/issues/10804));
it "doesn't always announce when results changed" ([#21684](https://github.com/angular/components/issues/21684)),
leaves `aria-activedescendant` set after close ([#14453](https://github.com/angular/components/issues/14453)),
omits position-in-set ([#11742](https://github.com/angular/material/issues/11742)); and Esc is
ambiguous — a nested autocomplete's Esc either dismisses the panel or nukes the modal.

**Bottom line.** Every incumbent treats the palette as a *combobox in a portal*
and then discovers `aria-activedescendant` is a broken foundation on mobile/VO,
filtering is keystroke-coupled rather than state-driven, and identity is smuggled
through `textContent`. Interop should start from an explicit selection/paging
state machine with **stable item identity**, a live region that lives **inside the
modal** (so `aria-hidden` can't eat it), documented Esc semantics, and async +
virtualization as first-class — not escape hatches.

---

## 3. The Single Most-Requested Feature

**Consumer-owned (controlled) filtering & ranking for async/server-driven
results — where the palette hands filtering to you and *still* gets keyboard
nav, default active-item selection, and loading/empty/error states right.**

Every mature palette bakes a synchronous fuzzy-filter/auto-sort engine into the
core, and that engine *fights* async/server/externally-ranked data. The recurring
cross-ecosystem ask is "**let me own the list; you just render it correctly.**"

Evidence (ranked by engagement):
- **Radix — [#1342 "[New Primitive] Combobox"](https://github.com/radix-ui/primitives/issues/1342): 995 reactions**, open 2022 → closed 2025 without a first-party async-capable primitive. Filterable-async-list is its core motivation.
- **cmdk cluster at top of tracker:** [#264 sorting not restored (33 👍)](https://github.com/dip/cmdk/issues/264), [#374 filter scroll jump (32)](https://github.com/dip/cmdk/issues/374), **[#280 first item not selected when list is dynamic (25 👍, 19 comments)](https://github.com/pacocoursey/cmdk/issues/280) — *the* async-selection bug**, [#267 async items don't re-render](https://github.com/pacocoursey/cmdk/issues/267), [#269 empty+loading collide](https://github.com/pacocoursey/cmdk/issues/269), plus "control the ranking" asks [#74](https://github.com/dip/cmdk/issues/74)/[#124](https://github.com/dip/cmdk/issues/124)/[#375](https://github.com/dip/cmdk/issues/375). Documented workaround: `shouldFilter={false}` and DIY — proof the primitive is mis-scoped.
- **kbar — [#147 "async actions, loading states"](https://github.com/timc1/kbar/issues/147): labeled `enhancement` + `wontfix`.** Repo dormant.

**Already solved well** — only by generic **headless comboboxes**, not dedicated
palettes: [Ariakit Combobox](https://ariakit.com/reference/combobox) ("doesn't
dictate how you filter"), React Aria `useComboBox`, Downshift. But they make you
*assemble* the palette (dialog + ⌘K + groups + pages + shortcuts) yourself. **No
batteries-included palette combines "you own the data" with correct async
selection + a11y.** That white space is the differentiator.

**Ethos fit — strongly aligned.** Controlled filtering means the component ships
*less* opinion (renders what you give it) — the opposite of a baked-in fuzzy
scorer. The hard/valuable part is exactly the ARIA-correct async behavior these
libs botch. Light-DOM is required for the `aria-activedescendant` IDREF wiring.
The small, state-light surface is the most portable-to-web-components shape.
**The one trap: do not build a competing fuzzy-ranking engine** — that's where
cmdk drowns in bugs and fights async.

---

## 4. Killer Differentiator

> **The controlled, async-correct, semantically-honest command palette:** Interop
> declines the ranking engine and instead ships the thing every incumbent
> botches — consumer-owned filtering/data where **selection, keyboard, and screen-
> reader output stay correct as async results stream in** — composed from a *real*
> native `<dialog>` (true focus-trap + inert + return, not a JS simulation), a
> *real* `role=listbox` with **stable option IDs** (identity never smuggled through
> `textContent`), and an **in-modal polite live region** that announces result
> count + empty state where cmdk announces nothing and Angular's live region gets
> muted by `aria-hidden`.

This is the "finally" for anyone burned by cmdk's async desync (#280) and silent
screen readers. It's directly downstream of §2 (the failures) and §3 (the demand):
we win precisely where the field is weakest, and we do it by *not* competing on the
axis (fuzzy sorting) that generates the bugs.

Two supporting differentiators, anchored on Interop's structural advantages:

1. **Composition over reimplementation.** It's `interop-dialog` (native modal) +
   `interop-listbox` (already `aria-activedescendant`-correct, stable option ids,
   `SelectControl[]`) + `InteropActivation` (debounce the async query; guard
   command double-fire via reentrancy) + invoker commands (open). Consumers get
   zero-specificity CSS overrides (no `::ng-deep`), light-DOM IDREF wiring, and
   primitives they already know — where cmdk is a bespoke monolith.
2. **devMode a11y guards** for the exact failure modes the research documents:
   dialog/input with no accessible name; `aria-activedescendant` pointing at a
   missing/unrendered option; active option missing `aria-selected` (VoiceOver);
   live region placed outside the modal; command item with no stable id
   (textContent identity); `Enter` with no active item.

---

## 5. Summary & Implementation Plan

### Decision summary
- **Pattern:** modal combobox — native `<dialog>` shell + `input[role=combobox]` + `ul[role=listbox]`/`li[role=option]`; **`aria-activedescendant` virtual focus, never roving**; `aria-selected` on active (VoiceOver); **in-modal polite live region** for changed counts + empty (WCAG 4.1.3).
- **Controlled by default:** consumer owns filtering/ranking/data; component owns keyboard, selection, a11y, async states. **No built-in fuzzy engine.** (Uncontrolled client-side filter is an *opt-in* convenience, not the headline.)
- **Compose Interop primitives:** `interop-dialog` (trap/inert/return/Esc/backdrop), `interop-listbox` (options + active management), `InteropActivation` (debounce query emit; guard activation), invoker commands + a small ⌘K hotkey directive; `interop-kbd` for shortcut hints.
- **Async-first:** explicit loading / empty / error / results states; **default active = first result, and it survives streaming updates** (the #280 fix); announce count only on change.
- **Identity via stable id, never `textContent`.**
- **No form participation;** `Enter` always runs the active command (`preventDefault`).
- **Not this:** fuzzy ranking engine, roving tabindex, shadow DOM, live region outside the modal.

### Component tree
- **`dialog[interop-command-palette]`** — native `<dialog>`; applies **`interop-dialog` as a host directive** (playbook: host directives, not wrapper divs) for modal/trap/inert/return/Esc/backdrop. Provides `INTEROP_COMMAND_PALETTE_TOKEN` (`useExisting`).
  - **`input[interop-command-input]`** (directive) — wires `role=combobox`, `aria-expanded`, `aria-controls`→listbox, `aria-activedescendant`→listbox's active option id, `aria-autocomplete=list`; emits `(queryChange)`; routes ArrowUp/Down/Home/End to the listbox's active moves and `Enter` to activation.
  - **`ul[interop-listbox]`** (reused) — the results engine; already emits `aria-activedescendant`/active ids and renders `SelectControl[]` or projected `li[role=option]`. Palette bridges its active-option id up to the input.
  - **Command item** — reuse listbox option or a thin `[interop-command-item]`: `value` (stable id, required), label, optional leading icon, optional trailing `interop-kbd` shortcut, `disabled`, `keywords`.
  - **Content-projection slots:** input adornment, **empty**, **loading**, **error**, footer (shortcut legend).
  - **Visually-hidden `role=status`** announcer — inside the dialog.

### Angular architecture
- **Selector:** `dialog[interop-command-palette]` (identity attr on native dialog). `itx-*` for config axes (e.g. `itx-size`).
- **Coordination:** `INTEROP_COMMAND_PALETTE_TOKEN` (parent `useExisting`); input + items resolve active-descendant id + activation through it.
- **Signals:** `open` (two-way via interop-dialog); `(queryChange)` output (controlled); `[items]`/`[controls]` input (consumer-supplied, *already filtered*); `[loading]`/`[status]` inputs; `activeId` computed; `(command)` output fires the chosen item's id on Enter/click.
- **Services:** `InteropActivation` → debounce the query emit (`debounceMs`) and guard command activation (`reentrant:false`/`once`) against double-fire; `InteropAttribute` for ARIA presets; `InteropCollection` for the item collection if useful.
- **Hotkey:** ship a tiny reusable **`[interopHotkey]`** directive (⌘/Ctrl+K, platform-aware) — invoker commands are click-only, so the hotkey is the one unavoidable JS bit; broadly useful beyond the palette.

### CSS plan (two-file split, `.agent/css-strategy.md`)
- **Structural** `styles/components/command-palette.css` (`:where()`): dialog centering/top-layer sizing + max-inline-size, input row, scroll region (reuse `interop-scroll-area`), option layout, **forced-colors-safe** active indicator, empty/loading/error regions, footer, `prefers-reduced-motion`, RTL logical props. Reuse interop-listbox structural rules for the option list.
- **Theme** `styles/themes/protocol/components/command-palette.css`: `--itx-cmdp-*` tokens (surface bg, radius, shadow, max-inline-size, option padding, active-option bg/fg, muted meta, footer). Consumers own content via projection + zero-specificity overrides.

### devMode warnings
Dialog/input missing accessible name · `aria-activedescendant` unresolved ·
active option missing `aria-selected` · live region outside the modal · command
item with no stable `value` (textContent identity) · `Enter` with no active item.

### Demo page outline (`projects/demo/src/app/pages/command-palette/`)
- **Golden path — dogfood the demo's own ⌘K nav** (this closes task #4): filter the sidebar routes, arrow/Enter to navigate, `interop-kbd` "⌘K" hint.
- **Async, server-driven:** debounced query, loading/empty/error states, default-active survives streaming (the #280 case).
- **Grouping + recents/frequent.**
- **Per-item shortcuts** via `interop-kbd`.
- **Nested "pages"** (drill-in/back sub-commands) — the §3 nested-command demand.
- **A11y matrix:** VoiceOver announcement note, forced-colors, reduced-motion, RTL.

### Open questions (need user input)
1. **Controlled-only, or ship an opt-in uncontrolled client-filter mode too?** (Rec: controlled first-class; uncontrolled convenience opt-in.)
2. **Two-stage Esc (clear→close) or single-stage (always close)?** (Rec: two-stage, documented.)
3. **Reuse `interop-listbox` verbatim for results, or a palette-specific option directive?** (Rec: reuse listbox; bridge its active id to the input.)
4. **Nested "pages"/sub-commands in v1 or a fast-follow?** (Rec: v1 = flat controlled palette, but design the state to allow pages; ship pages next.)
5. **`[interopHotkey]` as a first-class library primitive, or demo-local for now?** (Rec: library primitive — keyboard invocation is a real gap in the invoker-commands story.)
6. **Make the demo's own ⌘K nav the golden-path example built on this component?** (Rec: yes — dogfood, and it retires task #4.)

---

## Sources

- **APG/spec:** [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) · [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) · [MDN combobox role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/combobox_role) · [WCAG SC 4.1.3](https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html) · [SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- **A11y writing:** [Sarah Higley — aria-activedescendant is not focus](https://sarahmhigley.com/writing/activedescendant/) · [React Aria — Building a ComboBox](https://react-aria.adobe.com/blog/building-a-combobox) · [Scott O'Hara — dynamic results](https://www.scottohara.me/blog/2022/02/05/dynamic-results.html) · [WebKit 231724](https://bugs.webkit.org/show_bug.cgi?id=231724)
- **cmdk:** [repo/README](https://github.com/pacocoursey/cmdk) · [#253](https://github.com/pacocoursey/cmdk/issues/253) · [#280](https://github.com/pacocoursey/cmdk/issues/280) · [#291](https://github.com/pacocoursey/cmdk/issues/291) · [#389](https://github.com/pacocoursey/cmdk/issues/389) · [#393](https://github.com/pacocoursey/cmdk/issues/393) · [#272](https://github.com/pacocoursey/cmdk/issues/272) · [discussion #169](https://github.com/pacocoursey/cmdk/discussions/169) · [#264](https://github.com/dip/cmdk/issues/264) · [#374](https://github.com/dip/cmdk/issues/374) · [#267](https://github.com/pacocoursey/cmdk/issues/267) · [#269](https://github.com/pacocoursey/cmdk/issues/269)
- **kbar / ninja-keys:** [kbar #147](https://github.com/timc1/kbar/issues/147) · [#361](https://github.com/timc1/kbar/issues/361) · [#171](https://github.com/timc1/kbar/issues/171) · [#269](https://github.com/timc1/kbar/issues/269) · [ninja-keys #9](https://github.com/ssleptsov/ninja-keys/issues/9)
- **Radix / headless:** [Radix #1342 (995 👍)](https://github.com/radix-ui/primitives/issues/1342) · [Radix Dialog](https://www.radix-ui.com/primitives/docs/components/dialog) · [Ariakit Combobox](https://ariakit.com/reference/combobox) · [Headless UI Combobox](https://headlessui.com/react/combobox) · [#2129](https://github.com/tailwindlabs/headlessui/issues/2129) · [React Aria Autocomplete](https://react-aria.adobe.com/Autocomplete)
- **Angular Material:** [material #10804](https://github.com/angular/material/issues/10804) · [components #21684](https://github.com/angular/components/issues/21684) · [components #14453](https://github.com/angular/components/issues/14453) · [material #11742](https://github.com/angular/material/issues/11742) · [@ngxpert/cmdk](https://github.com/ngxpert/cmdk)
