# Interop — Typography

Type is **token-defined** (library `tokens/`) and **applied** to bare prose
elements in exactly one place — `styles/typography/prose.css` — under a single
opt-in root. Components size their own text from the font-size roles; flowing
prose gets the full treatment (size + line-height + rhythm + measure) by
inheritance. No component owns a private prose scale, and no app re-derives one.

## Layers

1. **Fluid font-size ramp** — `tokens/primitives.css`, `--itx-fs-*` (wtf…micro),
   each a `clamp()` between a 320px and 1280px viewport. Base ≈16px, capped 17.
2. **Semantic roles** — `tokens/typography.css`, `--itx-font-size-*` (display,
   heading-lg, heading, subheading, body-lg, body, label, caption, fine-print).
   **Consume these; never the raw `--itx-fs-*` primitives.**
3. **Line-height** — one staked, fluid, inverse expression, `--itx-line-height`.
4. **Rhythm + measure** — `--itx-rhythm(-loose/-tight)`, `--itx-measure`.
5. **Application** — `styles/typography/prose.css`, under `[interop-typography-root]`,
   imported by `interop.css`.

## Line-height — staked, clamped, inverse

```css
--itx-line-height: clamp(
  calc(var(--itx-lh-tight) * 1em),  /* floor  — display/headings (1.15)    */
  1em + var(--itx-lh-leading),       /* constant leading over element size  */
  calc(var(--itx-lh-loose) * 1em)    /* ceiling — captions/fine print (1.7) */
);
```

Leading (`--itx-lh-leading`, 0.5rem) is a **fixed absolute** space added over
the element's own `font-size` (`1em`), so the *ratio* loosens as text shrinks —
the legibility rule, for free — bounded top and bottom. Because it reads `1em`,
it is applied **on each text element** (prose.css does this), recomputes per
element, and rides the fluid font-size automatically.

Resulting ratios (approx): display **1.15** · subheading 1.33 · body **1.47** ·
caption 1.62 · fine-print **1.7**. Three knobs: `--itx-lh-tight/-loose/-leading`.
Keep `--itx-lh-loose` **above** `--itx-lh-tight` — if loose ≤ tight, `clamp()`
collapses to a flat line-height and the inverse curve is lost.

Weights are tokens too: all headings share `--itx-font-weight-heading` (500);
body text is `--itx-font-weight-body` (400).

This satisfies "font-size and line-height staked" + "both as clamps" + "smaller
font ⇒ looser leading" in a single expression, with zero per-role line-height
tokens.

## Rhythm — owl flow (doublets)

`margin-block-start` on adjacent block siblings under the root:

| pair | token | intent |
|---|---|---|
| `* + *` | `--itx-rhythm` (16px) | default flow, incl. p → p |
| `* + heading` | `--itx-rhythm-loose` (32px) | open a new section |
| `heading + *` | `--itx-rhythm-tight` (8px) | bind a heading to its body |
| `li + li`, `dd + dt` | `--itx-rhythm-tight` | list/definition flow |

No trailing margins, no `:last-child` cleanup; the first child gets no top
margin automatically. The "doublets" (p+p, h2+p, …) are these three rules — not
a per-pair table.

## Usage

```html
<article interop-typography-root>
  <h1>Title</h1>
  <p>Body…</p>
</article>
```

Everything inside is sized, leaded, spaced, and measure-capped. prose.css owns
**structure only** — never colour (inherited from theme/app). Every rule is
zero-specificity `:where()`; override any token on any ancestor.

Both the protocol app (markdown → `[interop-typography-root]` div) and any
consumer get this by importing the library CSS. The demo's `<interop-content>`
component predates this and still runs its own `--interop-content-*` prose — the
**next reconciliation** is to fold it onto this base.

## Deliberately not here
- No modular/ratio or `cqi` container scale (an earlier attempt; removed).
- No per-role line-height tokens — the one staked expression covers every size.
- No prose colour — that belongs to the theme/app, not the type system.
