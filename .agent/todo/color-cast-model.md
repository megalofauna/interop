# Plan — collapse the color families into one ramp plus a cast

**Status:** plan, provisional. An adversarial review was commissioned in
parallel and its objections are NOT yet folded in — see §8.
**Raised:** 2026-08-18
**Supersedes the idea in:** the `--itx-colorway-contrast-*` parity proposal,
which this replaces entirely.

---

## 1. The requirement

`--itx-contrast-3` is the ONE canonical way to ask for a mark at that contrast
slot, neutral or brand. **A consumer must never name a colorway-specific token.**
Intent is declared separately from the request. CSS only, no JS.

---

## 2. What is wrong today

Two parallel vocabularies for the same idea:

```
neutral   --itx-contrast-1 … -6                    parametric, 6 steps
brand     --itx-colorway-{tint,on-tint,border,text,solid,on-solid}   6 nouns
status    the identical 6 nouns, x4 families
```

The neutral axis lets you say "rank 3." The brand axis makes you pick a noun
that someone else chose. The usage counts show what that costs:

| rung | call sites |
|---|---|
| `--itx-colorway-solid` | 55 |
| `-on-solid` | 12 |
| `-text` | 8 |
| `-tint` | 6 |
| `-border` | 6 |
| `-on-tint` | 5 |

`solid` outnumbers every expressive rung combined — not because it is usually
right, but because it is the only name anyone is confident about. That is why
five components shipped `-solid` on an edge or a mark (tabs, callout, listbox,
content, chip) and why, on the day this plan was written, an edit reached for
`--itx-colorway-solid-on-solid` (does not exist, declaration dead) and put
`-on-tint`, a label rung, on a border. **The misuse is not carelessness; it is
what a vocabulary too large to hold in your head produces.**

`tint` is also actively misleading: it tracks the current surface, so in dark
mode it is DARKER than `solid` (0.253 vs 0.780 at layer 0). In painting, a tint
is lighter. And `--itx-tint-light`/`-dark` already mean something else entirely —
the chroma+hue pack.

---

## 3. The finding that makes the collapse possible

**The lightness solve is very nearly cast-invariant.** At layer 0:

| | lightness | chroma |
|---|---|---|
| surface | 0.898 / 0.193 | — |
| neutral rank 1 | 0.860 / 0.243 | 0.006 |
| brand wash | 0.848 / 0.253 | 0.075 / 0.153 |

0.012 apart in light, 0.010 in dark. The expensive part of the system — a
per-layer, per-scheme contrast solve — does not need to exist twice.

Both families already compose identically: `oklch(<lightness> <chroma> <hue>)`.
The neutral case just bundles chroma+hue into one pack token. **The seam already
exists inside the generated CSS; this plan exposes it.**

> Load-bearing caveat: 0.012 L is small but a rank is a CONTRAST TARGET, and
> OKLCH lightness is perceptual while WCAG uses relative luminance — the two
> diverge further as chroma rises. Whether the shared ramp still hits every
> rank's ratio at brand chroma is the single question that decides this plan.
> See §8.

---

## 4. The model

**One lightness ramp. The cast is inherited data.**

```css
/* the rank: a lightness, composed with whatever cast is in scope */
--itx-contrast-3: oklch(var(--itx-rank-3-l) var(--itx-cast-mark-c) var(--itx-cast-h));

/* the secondary layer of intent */
:where([itx-cast="colorway"]) {
	--itx-cast-wash-c: …;   /* ranks 1–2 */
	--itx-cast-mark-c: …;   /* ranks 3–6 */
	--itx-cast-h: …;
}
```

A cast is three numbers per scheme, generator-solved per hue. Two chroma values
rather than one because a wash near white cannot hold mark chroma without
ceasing to be a wash (0.075 vs 0.190 in light).

Consumer surface, in full:

```html
<span interop-chip itx-cast="colorway">Brand</span>
<div interop-callout itx-cast="warning">…</div>
```

`chip.css` says `border-color: var(--itx-contrast-3)` and never learns that
brand exists.

### The composition rule — the part that breaks if done naively

Every `[itx-layer]` re-declares all six ranks unconditionally. So a cast set
ABOVE a layer boundary is clobbered at that boundary, and a cast set BELOW one
arrives after the ranks were already resolved. `elevation.spec.ts` already
asserts this as a negative case for `--itx-surface`.

The fix is the co-declaration rule added to `css-strategy.md` on 2026-08-17 —
one more selector in the set:

```css
:where([interop-root], [itx-layer], [itx-sink], [itx-cast]) { /* the six ranks */ }
```

Ranks then re-resolve at cast boundaries AND layer boundaries, so the two axes
compose rather than fight. No combinatorial explosion: a cast is data, not a
set of blocks.

---

## 5. What survives, what dies

**Survives:** `--itx-contrast-1…6` (now the only mark vocabulary),
`--itx-surface*`, and `--itx-colorway-solid` / `-on-solid` / `-solid-hover` /
`-solid-active`. Solid is different in kind — fixed brand identity,
scheme-invariant, not a rank — and keeping it separate is what lets the ranks
stay coherent.

**Dies:** `--itx-colorway-{tint,on-tint,border,text}` and the whole of
`--itx-{warning,info,success,error}-{tint,on-tint,border,text}`. Four parallel
ramps become four cast definitions.

**`on-tint` disappears rather than being replaced.** A rank-1 wash sits ~0.05 L
off the surface, so text on it is `--itx-contrast-6` — exactly how the neutral
axis already works. One fewer paired concept to keep in sync. (Verify this holds
at every layer/scheme/hue before relying on it.)

---

## 6. Migration

~25 colorway call sites and ~26 status ones. `solid`'s 55 do not move.

Mechanical, per site: a named rung becomes a rank plus, where the element was
not already inside a cast scope, an `itx-cast` attribute on the nearest sensible
host. The interesting work is deciding the SCOPE of each cast, which is a design
judgement per component, not a rename.

---

## 7. Known costs

**Casting is total.** Inside a cast scope every rank goes brand, body text
included. The same mechanism supplies the escape (`[itx-cast="neutral"]`), but
it means casts want to be scoped to the parts that should carry them, not
wrapped around whole components. This is the main ergonomic risk and the thing
most likely to make the model unpleasant in practice.

**Gamut cannot become a consumer's problem.** "Blue holds .28 at L .50; teal
cannot exceed .146 anywhere" — the generator's own note. Cast chroma must stay
build-time solved per hue. A consumer who writes their own cast pack by hand can
produce out-of-gamut values that clip, which moves luminance and silently breaks
the rank's contrast target.

**Semantic loss.** `--itx-warning-border` says what it is. `--itx-contrast-3`
inside `[itx-cast="warning"]` says where it is. The meaning moves from the token
to its context — which is the point, and also a real readability cost when
scanning a stylesheet in isolation.

---

## 8. Open — the adversarial review

A hostile review was commissioned before any code, specifically to attack:

1. whether 0.012 L actually preserves every rank's WCAG target at brand chroma,
   including boundary cases where it could flip 2.9:1 against 3.0:1
2. whether a two-value chroma split is sufficient or chroma is genuinely per-rank
3. whether cast x layer composition survives real nesting, tested against the
   REAL generated CSS rather than reasoned about
4. whether "casting is total" is tolerable across real components in this repo
5. what today's system can express that this cannot — notably a brand border
   with neutral text on the SAME element
6. whether the simpler options win: parallel families renamed for parity, or
   doing nothing

**Nothing in this plan should be built until those land.** Item 1 is fatal if it
fails.

---

## 9. Sequence, if it survives

1. Fold the review's objections in; re-decide.
2. Generator: emit one lightness ramp + cast packs. Keep the old families
   emitting in parallel initially so nothing breaks mid-migration.
3. Spec the composition rule (cast above/below/on a layer boundary, nested
   casts, cast on the root) against the real generated CSS.
4. Migrate call sites, component by component, deciding each cast's scope.
5. Delete the old families; extend `check-color-axes.mjs` to the new shape and
   confirm it is not blinded by the collapse.
6. Regenerate the token reference and the color demo page.
