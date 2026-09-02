# Workflow — Borrowing Visual Language from IBM Carbon

How to lift the *look* of a Carbon component into an Interop component accurately and repeatably, without importing Carbon's markup, functionality, or naming.

Carbon is Apache-2.0. We borrow proportions and paint, not code.

## What we take and what we leave

| Take | Leave |
|---|---|
| Heights, padding, gaps, radii | Their DOM structure |
| Type size / weight / line-height | Their class names and JS |
| Border presence and weight | Their ARIA and keyboard handling |
| Rest / hover / selected paint relationships | Their token *names* |
| Which variants exist and how they differ visually | Any variant we don't already express |

If Carbon documents a state, colour, or variant Interop has no concept of, skip it. Round one is UI cohesion, not feature parity.

## Step 1 — Get the real spec (don't use the website)

`carbondesignsystem.com` is a Gatsby app; fetching a component page returns an empty document. Go to the two sources of truth instead:

```
# The spec tables — sizes, heights, type tokens, anatomy
https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/components/<name>/style.mdx
https://raw.githubusercontent.com/carbon-design-system/carbon-website/main/src/pages/components/<name>/usage.mdx

# The shipped values — the actual CSS, variant by variant
https://raw.githubusercontent.com/carbon-design-system/carbon/main/packages/styles/scss/components/<name>/_<name>.scss
```

Read both. `style.mdx` gives the intent (a size table); the SCSS gives what actually ships (which variant has a border, what the hover token is). Where they disagree, the SCSS wins.

Carbon's component directory name is usually the singular noun — `tag`, `button`, `accordion`, `data-table`.

## Step 2 — Resolve Carbon's scale tokens to px

Carbon writes `$spacing-04`, not `12px`. Resolve before mapping.

### Spacing

| Carbon | px | Interop |
|---|---|---|
| `$spacing-01` | 2 | `--itx-spacing-0_5` |
| `$spacing-02` | 4 | `--itx-spacing-1` |
| `$spacing-03` | 8 | `--itx-spacing-2` |
| `$spacing-04` | 12 | `--itx-spacing-3` |
| `$spacing-05` | 16 | `--itx-spacing-4` |
| `$spacing-06` | 24 | `--itx-spacing-6` |
| `$spacing-07` | 32 | `--itx-spacing-8` |
| `$spacing-08` | 40 | `--itx-spacing-10` |
| `$spacing-09` | 48 | `--itx-spacing-12` |
| `$spacing-10` | 64 | `--itx-spacing-16` |
| `$spacing-11` | 80 | `--itx-spacing-20` |
| `$spacing-12` | 96 | `--itx-spacing-24` |
| `$spacing-13` | 160 | `--itx-spacing-40` |

Interop's scale is `N × 4px`, so any Carbon value divisible by 4 lands exactly. Carbon's own scale is 8px-based with 2/4/12 as escape hatches, so **the two grids agree almost everywhere** — which is why this borrow works at all.

When a Carbon value is *not* divisible by 4 (their 18px tag height is the known case), do not invent a half-step token. Round to the nearest 4px step and say so in a comment, or drop that step entirely.

### Type

| Carbon | px / line-height / weight | Interop |
|---|---|---|
| `$label-01` | 12 / 16 / 400 | `0.75rem`, `line-height: 1.3333` |
| `$helper-text-01` | 12 / 16 / 400 | same |
| `$body-compact-01` | 14 / 18 / 400 | `0.875rem`, `1.2857` |
| `$body-01` | 14 / 20 / 400 | `0.875rem`, `1.4286` |
| `$heading-01` | 14 / 18 / 600 | `0.875rem`, `1.2857`, `600` |
| `$body-compact-02` | 16 / 22 / 400 | `1rem`, `1.375` |

**Write component type as fixed rem, not as `--itx-font-size-*`.** Our role tokens are fluid `clamp()` values; a fluid label inside a fixed-height box overflows it. `button.css` already sets fixed rem per size — follow that precedent. Fluid type stays for prose.

### Colour

Carbon's neutral ramp maps onto ours closely enough for structural work:

| Carbon (white theme) | hex | Interop |
|---|---|---|
| `$background` | `#ffffff` | `--itx-surface` |
| `$layer-01` | `#f4f4f4` | `--itx-surface-above`, or `--itx-role-background-control` on a control |
| gray-20 (`$tag-background-gray`) | `#e0e0e0` | `--itx-role-background-control` |
| gray-30 (`$tag-hover-gray`) | `#c6c6c6` | `--itx-role-background-interactive` |
| `$border-subtle` | `#e0e0e0` | `--itx-role-divider` |
| `$border-strong` | `#8d8d8d` | `--itx-role-edge` |
| `$text-secondary` | `#525252` | `--itx-role-text-quieter` |
| `$border-inverse` / `$text-primary` | `#161616` | `--itx-role-text` |
| `$text-inverse` | `#ffffff` | `--itx-role-text-inverse` |

Every role is already a `light-dark()` pair, so taking the light-theme mapping gets dark mode for free. Do **not** hand-map Carbon's dark theme.

Carbon names a value; we name a job. Where its ramp draws a distinction ours does not — `$layer-01` against gray-20, or `$border-subtle` against a second subtle grey — take the job, not the step. A raw palette step is a lint error, and there is no palette to pick one from.

Carbon's `$focus` is blue-60. We keep `--itx-colorway` for focus rings — focus is where our brand survives an otherwise neutral component.

## Step 3 — Write theme values only

**This is the rule that keeps the process repeatable.** A borrow touches:

```
src/lib/styles/themes/protocol/components/<name>.css     ← values go here
```

and nothing else. If you find yourself needing to edit `src/lib/styles/components/<name>.css`, stop: the structural model can't express the shape you're borrowing. That's a real architectural decision, not a paint job — make it deliberately, in its own commit, and note it. (The chip borrow hit this once: Carbon states height and padding directly, which the old `padding-step × sizing-multiplier` formula could not express. The formula was deleted.)

### The cascade constraint

`interop.css` declares `@layer interop.foundation, interop.theme`. **Theme always outranks foundation, at any specificity.** So:

- Theme sets tokens on `[interop-root]` — an ancestor. Elements *inherit* those values.
- Foundation sets tokens on the element itself for states (`:hover`, `[data-checked]`).
- An inherited value always loses to a declaration on the element → states work.

If theme writes a token **on a chip/button/etc. element**, it beats foundation's state rules for that same token and the state silently dies. When a variant needs different base paint, give it a named ancestor-level token (`--itx-chip-selectable-background`) and map it onto the element **in the foundation file**, before the state rules.

### The `var()` resolution gotcha

`--a: var(--b)` resolves `--b` **at the element where `--a` is declared**, then inherits the result. So this is broken:

```css
:where([interop-root]) { --itx-chip-remove-size: var(--itx-chip-height); }  /* freezes at 32px */
:where([itx-size="sm"]) { --itx-chip-height: 24px; }                        /* ignored downstream */
```

Either read the source token directly at the point of use, or declare the derived token at the same element the override lands on.

## Step 4 — Size axis

Interop's convention is the `itx-size` attribute (`itx-*` = system configuration). Size rules live in the **theme** file — `button.css` set the precedent.

Scope the selector to every shape *and every container* of the component, so one attribute sizes a whole group:

```css
:where(
	li[interop-chip-item][itx-size="sm"],
	ul[interop-chip-list][itx-size="sm"],
	fieldset[interop-chip-filter][itx-size="sm"]
) { --itx-chip-height: var(--itx-spacing-6); }
```

Sizes are per-component: chip `md` is 32px while button `md` is 40px. That's correct — don't force one height table across components.

**Don't take a Carbon size step that lands under 24px for anything interactive.** WCAG 2.2 SC 2.5.8 sets a 24×24 CSS px minimum target size. Carbon ships steps below it; we don't.

## Step 5 — Verify

1. `npx prettier --use-tabs --write <files>` — the repo has **no** prettier config and uses tabs. Bare `prettier --write` will silently convert to spaces.

   **CSS, TS and HTML only.** Do NOT run prettier over `.agent/*.md`: it repads every markdown table to full width and reindents code fences, turning a small additive diff into a whole-file rewrite and leaving the card out of step with its siblings. It also flattens Angular control-flow blocks (`@for`, `@if`) in templates, which its HTML parser does not understand — reindent those by hand if it touches them.
2. Confirm every `var()` read resolves. Foundation carries no fallbacks (see `css-strategy.md`), so a token you renamed and forgot leaves the property unset rather than falling back:

```bash
node -e '
const fs=require("fs"),path=require("path");
function walk(d,a=[]){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);
  e.isDirectory()?walk(p,a):e.name.endsWith(".css")&&a.push(p)}return a}
const declared=new Set();
for(const f of walk("projects/interop/src/lib/styles"))
  for(const m of fs.readFileSync(f,"utf8").matchAll(/(--itx-[a-z0-9_-]+)\s*:/g))declared.add(m[1]);
for(const f of process.argv.slice(1))
  for(const m of fs.readFileSync(f,"utf8").matchAll(/var\(\s*(--itx-[a-z0-9_-]+)/g))
    if(!declared.has(m[1]))console.log("UNDECLARED:",m[1],"in",f);
' <foundation-file> <theme-file>
```

3. Check the reverse direction too — a rewrite that removes fallbacks tends to strand the tokens those fallbacks used to read. Anything declared but never read is now dead weight, and any doc line describing it is now a lie:

```bash
node -e '
const fs=require("fs"),strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,"");
const files=process.argv.slice(1), decl=new Map(), read=new Set();
for(const f of files){const s=strip(fs.readFileSync(f,"utf8"));
  for(const m of s.matchAll(/(--itx-[a-z0-9_-]+)\s*:/g))decl.set(m[1],f);
  for(const m of s.matchAll(/var\(\s*(--itx-[a-z0-9_-]+)/g))read.add(m[1]);}
for(const [t,f] of decl) if(!read.has(t)&&t.startsWith("--itx-<component>"))
  console.log("ORPHAN:",t,"declared in",f);
' <foundation-file> <theme-file>
```

4. Look at it in the demo app. There is no browser tooling in this repo — a human has to open the page.

## Step 6 — Update the paperwork

- `.agent/components/<name>.md` — token table and sizing section
- The demo page's CSS-tokens table (`projects/demo/src/app/pages/<name>/<name>-page.ts`)
- Add a row to the ledger below

## Ledger

Rounds are logged here. When several borrows run in parallel, the agent doing
the work does NOT edit this table — one writer, appended centrally, or the
ledger is the one guaranteed merge conflict in an otherwise disjoint set of
changes.

| Round | Carbon component | Interop component | Date | Notes |
|---|---|---|---|---|
| 1 | Tag | Chip | 2026-08-11 | 2 of 3 sizes (32/24); dropped the border on presentational + dismissible; selectable took Carbon's inverse-fill selected state; colour variants deferred; 208px truncation deferred (needs a label wrapper span) |
| 2 | Accordion | Expansion Panel | 2026-08-11 | Header IS the button (Carbon's `__heading` model) — the panel now styles `button[interop-expansion-trigger]` itself instead of delegating to `interop-button`. Full-width 40px row, `$layer-hover` fill behind `@media (any-hover: hover)`, all backgrounds transparent, expanded state no longer restyles the frame. Chevron and the sm/lg steps not taken. |
| 3 | TreeView | Tree | 2026-08-11 | Filled-triangle caret (borders on a zero-size box) replacing the stroked chevron; selected/current fuses Carbon's two states — low tint **plus** a 4px colorway-8 bar at the inline-start edge, drawn as an inset box-shadow so it costs no layout. Backgrounds already transparent. Guide rails kept (Carbon has none). Carbon's `$layer-01` tree fill deliberately NOT taken — transparent goes further, consistent with round 2. |

| 4 | Contained List | List (`itx-variant="contained"`) | 2026-08-11 | 48px ruled rows, horizontal rules only, transparent, hover → surface-above. Built as a VARIANT, not a change to the base: Carbon keeps List and Contained List apart for the same reason — the base still has to serve prose lists. |
| 5 | Progress Bar | Progress | 2026-08-12 | Squared (Carbon defines no radius), track → $border-subtle, 1400ms→1000ms indeterminate, sm size step. Rewrote the fill as a gradient driven by a published percentage — see the round 5 note. |

| 6 | Button | Button | 2026-08-12 | Squared (radius 0), 1px borders, Carbon's flat type ramp — 14px at EVERY size, replacing Interop's 12/14/16/20/22 scale. Secondary became a dark solid, tertiary a colorway outline that fills on hover, icon buttons lost their circle. Default size stayed md/40 rather than Carbon's lg/48. |
| 7 | Data Table | Table | 2026-08-12 | 48px rows via `block-size` on `tr` (Carbon sizes the row, not the cell), sm/md/lg/xl density on `itx-size`, one 1px hairline language. DECLINED Carbon's grey header slab — emphasis moved into 600-weight type — to stay consistent with rounds 2/3/4. |
| 8 | Notification | Toast | 2026-08-12 | Squared 288px panel, 3px status bar kept as `border-inline-start` (not the tree's box-shadow — see note), 14/18 600-over-400 type pair, description un-dimmed. |
| 9 | Content Switcher | Segmented control | 2026-08-12 | Inverted selected pill (Carbon's high-contrast default; Interop's previous look was effectively Carbon's low-contrast variant), transparent hairline-framed track, equal-width segments, sm/md/lg 32/40/48. |
| 10 | Badge Indicator | Badge | 2026-08-13 | 16px count bubble / 8px dot, both round — Carbon names the radius, so this is the one component the house doesn't square off. Paint moved off a hardcoded `#d32f2f` onto `--itx-danger`/`--itx-on-danger`, so it follows `itx-status-palette` and dark mode for the first time. Offset 4px → 0 (corner-centred). SC 2.5.8 does not reach it: the indicator is `aria-hidden` and non-interactive, which is why 16px is legitimate here where chip stops at 24. |
| 11 | Text Input + Text Area | Field | 2026-08-13 | Fill-plus-underline: filled slab, single 1px neutral-8 bottom rule, no other borders, squared. sm/md/lg 32/40/48 on `itx-size`; 12/16 label above, helper below; 2px inset rings for focus (colorway) and invalid (danger). Error glyph drawn as a CSS mask on `::after` — no template change. Fill polarity INVERTED to `--itx-surface-above`: Carbon recesses the field below a white page, our elevation model raises it. Declined Carbon's xs step (24px, on the SC 2.5.8 floor) and its gray-40 placeholder (a known contrast failure). |
| 12 | Popover | Popover | 2026-08-13 | Squared 368px panel, 16px padding, `$body-01` 14/20 (the type was previously undeclared), Carbon's 12 × 6 caret rebuilt as two stacked triangles so the 1px frame runs continuously around it. Foundation stripped of all fallbacks — three had drifted from the theme — and the arrow colours moved to point-of-use derivation, fixing a live `var()` freeze. DECLINED Carbon's 2px radius to stay in one voice with tooltip, and its `filter: drop-shadow` (no wrapper to hang it on; `filter` would make the panel a containing block). |
| 13 | Slider | Slider | 2026-08-13 | 2px squared track, near-black fill (`$layer-selected-inverse`, not the brand hue), 14px round thumb growing to 20px, focus turns thumb AND fill colorway. Carbon's 14px thumb is under SC 2.5.8, so the painted circle and the 24px hit target were separated: growth is a transparent-border-width change, not Carbon's `scale()`, which would scale the target too. Found the round 5 mechanism bug a second time — see the note below. |
| 14 | Tabs | Tabs | 2026-08-13 | `line` flavour only; `contained` declined outright (filled slabs, against rounds 2/3/4/7). 40px tab — Carbon's `line` default is `md`, not the 48px `contained` step. Selection is a 2px colorway bar sitting IN the list rule rather than stacked on it, so selection reads as the rule turning colorway for that span. That bar-not-fill relationship is what keeps tabs legibly apart from round 9's segmented control; the house hover fill was declined for the same reason. |
| 15 | Progress Indicator | Stepper | 2026-08-13 | Narrow round — the shape already agreed (2px connector, round indicator, label beneath), so this was mostly a bug sweep. Fixed a live `--itx-on-neutral` read that never resolved and painted the current step's numeral white on a light surface (1.23:1 in light mode); moved step label and numeral off fluid role tokens onto fixed rem; squared the menu popover. Isolated the step list from prose rhythm, which had been offsetting every step after the first by 16px. DECLINED Carbon's brand-blue connector for current/complete — neutral structure, consistent with rounds 2/3/4 — and its 16px indicator, which holds an icon where ours holds a numeral. |

### Round 6–9 note — what four parallel borrows found

Run as four concurrent agents, one per component, each owning exactly its two
CSS files. That worked: zero collisions, because the file sets are disjoint.
The ledger is the one shared file, so agents were told not to touch it.

Every one of the four found a **live bug** in the component it was borrowing
into, none of which were visual:

- **toast** — `--itx-toast-font-size` was a fluid `clamp()`; and `max-width`
  ignored the padded border-box viewport, so a "25rem" panel rendered ~256px.
- **table** — `padding: 2rem var(--itx-table-cell-padding, 1rem)` where the
  inner token is itself two values, silently producing a three-value shorthand
  with the wrong sides; focus ring on a light-only `--itx-colorway-8`.
- **segmented control** — the theme set `--itx-rule-color: transparent` on
  `[interop-root]`, stomping the global `<hr itx-rule>` utility invisible
  **app-wide**; a duplicate `border-radius` declaration where the second won.
- **button** — a missing semicolon voiding two declarations; a token declared
  singular and read plural, so it had never once applied; `gap: none`, invalid.

The lesson worth keeping: **a borrow is a code review that happens to be about
colour.** Reading a component closely enough to restate its values is reading
it closely enough to find what was already wrong. Budget for that — the visual
diff is not the whole diff.

Corollary on scope: two of the four needed foundation changes to express the
borrow at all (table's row `block-size`, segment's `line-height`), both because
a dimension the borrow depends on was an emergent side-effect rather than a
declared property. That is the same finding as round 1's `--itx-chip-height`,
now three times over — when a component has no token for its own height, that
is the bug, and the borrow is just what surfaces it.

### Rounds 10–14 note — the global-token stomp is now a standing check

Three rounds have now found the same bug, and it is always the same shape: a
**component** theme file declaring a **global** token on `:where([interop-root])`
because it wanted that value for itself.

- Round 9 — `segmented-control.css` set `--itx-rule-color: transparent`,
  making the standalone `<hr itx-rule>` utility invisible app-wide.
- Round 12 — `dialog.css` set `--itx-border: var(--itx-neutral-3)` to lighten
  its own edge. `foundation.css` declares the same token on the same selector
  in the same layer, and dialog is imported later, so dialog won: every
  component reading `--itx-border` got neutral-3 (oklch 0.93, a 0.03 delta
  against the page) instead of the declared neutral-5.

That second one is why round 7's table rules were invisible, and the diagnosis
at the time — "Carbon can afford a fainter rule than we can" — was only half
right. The rule was not faint by design; it was being overwritten by a dialog.

**The check, before you write a value:** if the token you are about to declare
does not start with `--itx-<your-component>-`, you are writing someone else's
token. Three ways out, in order of preference:

1. The component almost always already has its own token for this
   (`--itx-dialog-border-color` existed and read `var(--itx-border)`). State the
   value on that instead — the component looks identical, nothing else moves.
2. If the family is genuinely shared (`--itx-rule-*`, `--itx-indicator-*`),
   declare it on a **component-scoped selector**, not on `[interop-root]`. See
   the "Control-scoped values" block in `segmented-control.css`.
3. If the global value is actually wrong for everyone, change it in
   `foundation.css` deliberately, in its own commit.

It is silent in every direction: no error, no warning, and the component that
caused it looks correct. Grep is the only detector —
`grep -rn -- "--itx-<token>\s*:" styles/` and check for more than one home.

### Round 13 note — the round 5 mechanism bug, a second time

Round 5 found that vertical progress bars filled horizontally because the fill
was delegated to `::-webkit-progress-value`, which sizes along the *physical*
inline axis and cannot be reoriented by `writing-mode`.

Slider had the identical class of bug, arrived at differently: the track was
sized with **`height`** — a physical property — on a pseudo-element inheriting
`writing-mode: vertical-lr`, where `height` is the track's *length*. A vertical
slider drew a 6px stub instead of an 8rem track. Firefox never received the
gradient-direction patch WebKit had, and the marks directive hard-coded
`to right`, painting ticks across a vertical track.

The fix was the same shape as round 5's, which is the point: every cross-axis
dimension became a **logical** property, and the axis became a published token
(`--itx-slider-axis`) that the marks directive reads too, so ticks cannot
disagree with the fill about which way "along" is. The vendor forks and the
per-orientation overrides deleted themselves.

**Generalised: an orientation axis built on physical properties is a bug
waiting for someone to rotate it.** When a component has a vertical mode, the
question is not "are the values right" but "is any dimension stated
physically". Two rounds, two components, same answer.

### Round 3 note — prose leaking into component internals

A globally-declared `interop-typography-root` turns `prose.css`'s bare element
selectors into de-facto global element styles. It reads `<li>` as running text;
a tree reads it as a row. The collision is quiet because it lands on properties
the component never declared — a `max-inline-size: var(--itx-measure)` cap on a
full-bleed row, `li + li` rhythm margins between rows, a fluid `font-size` on a
fixed-height control.

Fixed generally rather than per-component: `interop-typography-isolate` on any
element stops prose at that subtree, implemented as one `revert` rule at the
foot of `prose.css`. Components that own their own layout set it as a static
host attribute. **Check this first** when a borrowed component looks subtly
wrong in ways the component's own CSS doesn't explain — anything built from
`li`, `p`, `dt`/`dd`, or a heading is exposed.

### Round 2 note — when a borrow legitimately needs the foundation

Step 3 says a borrow should touch the theme only, and that needing the foundation is a signal to stop and decide deliberately. Round 2 hit it: "make the header *be* the button" isn't a value, it's a question of which stylesheet owns the element. The panel had been delegating trigger paint to `interop-button` via contextual `--itx-button-*` re-assignment, so a bare `<button interop-expansion-trigger>` — what the demo actually used almost everywhere — rendered as an unstyled UA button.

The rule of thumb that came out of it: **if the component's own markup contract demands an element, that component styles it.** The file already made this argument for the guest heading; the trigger is the same case and had been missed.


### Round 5 note — when the borrow exposes a mechanism bug

Progress had a standing bug: vertical bars filled horizontally. The cause was
not a wrong value but a wrong mechanism — the fill was delegated to
`::-webkit-progress-value`, which sizes itself along the *physical* inline axis
and therefore cannot be reoriented by `writing-mode` at all.

The fix was to stop delegating: the component publishes its percentage as
`--itx-progress-percent`, and the stylesheet paints track and fill as one
gradient along a `--_axis` token. Orientation became a single declaration, and
the `::-webkit-` / `::-moz-` fork, the RTL reversal, and the per-axis keyframes
all deleted themselves.

The general lesson for these rounds: **when a visual pass keeps needing
per-case rules to stay correct, the mechanism is wrong, not the values.** A
borrow is a good moment to notice, because you are already reading the
component closely enough to see it.
