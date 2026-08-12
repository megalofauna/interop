# TODO — the built-in popover caret is not RTL-correct

**Status:** open, low priority
**Raised:** 2026-08-11, during the Carbon borrow round on Popover
**Owner file:** `projects/interop/src/lib/styles/components/popover.css`

## The bug

For `top*` / `bottom*` placements the caret is centred with:

```css
left: 50%;
transform: translateX(-50%);
```

`left` and `translateX` are both **physical**, which is fine — but the panel's
edges around them are described with logical properties (`border-inline`,
`border-block-end`), and the rest of the file is written logically. Mixing the
two is what makes this easy to miss.

The centring itself survives `direction: rtl` because `left: 50%` is still the
left edge and the -50% shift is symmetric. What does **not** survive is any
future move to `inset-inline-start`: `inset-inline-start: 50%` in RTL resolves
to `right: 50%`, which anchors the element's right edge at the centre line, and
`translateX(-50%)` then pushes it a further half-width left rather than
centring it.

Carbon hits the same thing and carries an explicit `:dir(rtl)` rule flipping
the translate sign for every placement — confirming the hazard is real and not
theoretical.

## The fix

Direction-agnostic centring, no `:dir()` fork needed:

```css
inset-inline: 0;
margin-inline: auto;
```

An absolutely-positioned box with both inline insets resolved and `auto` inline
margins gets the remaining space split evenly, which centres the border box —
including a zero-`width` box whose extent comes entirely from its borders.

The `left`/`right` placements have the mirror-image problem on the block axis,
but the block axis does not flip with `direction`, so they are only at risk
under a vertical `writing-mode`.

## Why it wasn't fixed in the borrow round

The existing physical form is correct in LTR and was left as-is to keep the
round's diff to the caret's *geometry* (Carbon's 12 × 6 box and its bordered
second triangle) rather than rewriting its positioning at the same time. Do
both placements in one pass when someone takes this.
