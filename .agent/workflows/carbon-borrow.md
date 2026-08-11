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
| `$background` | `#ffffff` | `--itx-neutral-1` |
| `$layer-01` | `#f4f4f4` | `--itx-neutral-2` |
| gray-20 (`$tag-background-gray`) | `#e0e0e0` | `--itx-neutral-4` |
| gray-30 (`$tag-hover-gray`) | `#c6c6c6` | `--itx-neutral-5` |
| `$border-subtle` | `#e0e0e0` | `--itx-neutral-4` |
| `$border-strong` | `#8d8d8d` | `--itx-neutral-8` |
| `$text-secondary` | `#525252` | `--itx-neutral-9` |
| `$border-inverse` / `$text-primary` | `#161616` | `--itx-neutral-12` |
| `$text-inverse` | `#ffffff` | `--itx-neutral-1` |

Our `--itx-neutral-*` are already `light-dark()` pairs, so taking the light-theme mapping gets dark mode for free. Do **not** hand-map Carbon's dark theme.

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

| Round | Carbon component | Interop component | Date | Notes |
|---|---|---|---|---|
| 1 | Tag | Chip | 2026-08-11 | 2 of 3 sizes (32/24); dropped the border on presentational + dismissible; selectable took Carbon's inverse-fill selected state; colour variants deferred; 208px truncation deferred (needs a label wrapper span) |
| 2 | Accordion | Expansion Panel | 2026-08-11 | Header IS the button (Carbon's `__heading` model) — the panel now styles `button[interop-expansion-trigger]` itself instead of delegating to `interop-button`. Full-width 40px row, `$layer-hover` fill behind `@media (any-hover: hover)`, all backgrounds transparent, expanded state no longer restyles the frame. Chevron and the sm/lg steps not taken. |
| 3 | TreeView | Tree | 2026-08-11 | Filled-triangle caret (borders on a zero-size box) replacing the stroked chevron; selected/current fuses Carbon's two states — low tint **plus** a 4px colorway-8 bar at the inline-start edge, drawn as an inset box-shadow so it costs no layout. Backgrounds already transparent. Guide rails kept (Carbon has none). Carbon's `$layer-01` tree fill deliberately NOT taken — transparent goes further, consistent with round 2. |

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
