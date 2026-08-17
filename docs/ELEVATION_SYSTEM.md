# Elevation System

> **Superseded.** The "sliding window" described by earlier revisions of this
> document did not work and has been removed. The current model is two relative
> axes driven by `@container style()` queries — see `.agent/color.md` for the
> mental-model card and `scripts/generate-color-ladder.mjs` for the source of
> truth.

This page is kept for one reason: the mistake it made is easy to make again, and
expensive. Twice now, a design has been built on it.

---

## The claim that was wrong

Earlier revisions justified the mechanism like this:

> "Custom properties declared in the same rule block resolve against
> **inherited** (parent) values, not sibling declarations in the same block.
> There is no circularity."

**This is false.** CSS Custom Properties for Cascading Variables Level 1, §2:

> "Variables always draw from the computed value of the associated custom
> property **on the same element**."

Declarations in one rule block absolutely do see each other. `.agent/workflows/carbon-borrow.md`
had the rule stated correctly the whole time ("`--a: var(--b)` resolves `--b` at
the element where `--a` is declared"); the two documents contradicted each other,
and the shipped code followed the wrong one.

## What it cost

The sliding window shifted eleven `--_e-*` slots on each `[itx-raise]`:

```css
:where([itx-raise]) {
	--_e-0: var(--_e-p1);
	--_e-p1: var(--_e-p2);
	--_e-p2: var(--_e-p3);
	/* … */
}
```

Because every `var()` resolves on the same element, `--_e-0` chains all the way
to the topmost slot the block does not redeclare, and **every slot collapses to
that one colour**. In dark mode a single raise jumped L 0.22 → 0.55 instead of
0.27. In light mode it was invisible, because five consecutive slots were all
`neutral-1`.

Three of the six blocks were worse. They contained a literal self-edge:

```css
--_e-p3: var(--_e-p3); /* a cycle */
```

Cycles are _invalid at computed-value time_. For an unregistered custom property
that means the **guaranteed-invalid value**, which **inherits** — so
`background-color` computed to `transparent` and every descendant reading
`--itx-surface` broke with it.

And the depth counter never counted:

```css
--itx-elevation: calc(
	var(--itx-elevation) + 1
); /* self-cycle → parent's value */
```

Registered as `<integer>` with `inherits: true`, invalid-at-computed-value-time
resolves to the _inherited_ value. It was `0` at the root, so it was `0`
everywhere, forever.

None of this was noticed because `itx-raise` and `itx-lower` had **zero
consumers** — 154 lines of shipped, documented, dead API.

All of the above is pinned down in `projects/interop/src/lib/styles/tokens/elevation-legacy.spec.ts`,
which asserts the broken behaviour against the real old CSS.

## The generalisation

**An inherited custom property cannot increment itself, and a chain of slots
cannot shift itself.** Any scheme where an element consumes an inherited value
and republishes a shifted version under the same names is a cycle. `if(style())`
is closed off too, by css-values-5 §8.3. `toggle()` is exactly the right shape
and has roughly twenty years of spec with zero implementations.

The way out is `@container style()`: a container query is evaluated against the
nearest **ancestor** container, never the element itself, so no cycle exists.

See `.agent/color.md`.
