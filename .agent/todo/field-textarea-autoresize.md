# TODO — field textarea has two auto-grow mechanisms

**Status:** one half removed, the design decision still open
**Raised:** 2026-08-11, during the Carbon borrow (round 10, Field)

## What was there

`interop-field-textarea.scss` declared `field-sizing: content` on the
`<textarea>`, while `interop-field-textarea.ts` also ships an `[autoResize]`
input whose `resizeToFit()` writes `element.style.height` on every `(input)`.

Two mechanisms for one behaviour, and they interact badly:

1. **They fight.** `field-sizing: content` makes the browser size the control
   intrinsically; `resizeToFit()` then sets an inline `height`, which is a
   used-value override. The inline value wins, so `field-sizing` was doing
   nothing whenever `[autoResize]` was on, and doing everything whenever it
   was off — the input read as a no-op in one direction and as a duplicate in
   the other.
2. **`[rows]` silently stopped working.** `field-sizing: content` overrides
   `rows` in the browsers that support it. So `[rows]="3"` was honoured in
   Firefox and Safari and ignored in Chrome, with nothing in the markup to
   explain the difference.
3. **Support is uneven.** `field-sizing` is Chromium-only at time of writing,
   so the default rendering of the component differed by browser.

Carbon's text area does not use it; it sizes on `rows` and lets the user
resize.

## What was done

The `field-sizing: content` declaration was removed. `[rows]` and
`[autoResize]` are now the only sizing levers, and they behave the same in
every browser.

## What is still open

`field-sizing: content` is the better mechanism — it is declarative, it costs
no JS, it handles paste and programmatic value changes that `(input)` never
sees, and it does not thrash layout on every keystroke. The right end state is
probably:

- make `[autoResize]` set a class (or a token) that turns `field-sizing:
  content` on, rather than running `resizeToFit()`,
- delete `resizeToFit()` and the `#textareaEl` viewChild with it,
- keep a JS fallback only if the Safari/Firefox gap still matters by then,
- document that `[rows]` and `[autoResize]` are mutually exclusive, because
  they are.

That is a behaviour change to a public input, so it did not belong in a visual
round. Whoever picks it up should check the demo page's textarea examples,
which exercise both inputs.
