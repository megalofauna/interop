# TODO — legacy demo page sweep

**Status:** deferred, mostly mechanical
**Raised:** 2026-08-12, while running the demo-page playbook against Progress
**Grew:** 2026-08-12 — button variant hierarchy added as a second check

Two things to fix on the same pass, because both need a page-by-page visit and
neither is worth a separate one. Check both while you are in each file.

## Check 1 — the page nav

`<demo-page>` is the page shell: it renders the `<article class="demo-page">`,
drops in an `<itx-page-nav>`, and runs the scroll-spy that highlights the
current section. `<demo-section>` self-registers with it, so the nav builds
from the sections already on the page.

Most pages skip the shell and open with a bare `<article class="demo-page">`,
which renders identically and silently has **no page nav**:

```
<demo-page> wrapper:             13 pages
bare <article class="demo-page">: 20 pages
```

(Was 4 / 26, then 8 / 24. The Carbon rounds convert pages on their way past:
rounds 5–9 took button, table, toast, segmented control and progress; rounds
10–14 took badge, field, popover, slider and tabs.)

Still bare, as of 2026-08-13:

```
auto-render   chip          callout      checkbox    code-renderer
expansion-panel  content    dialog       kbd         icon
list          scroll-area   listbox      radio       stepper
tooltip       toggle        visimorph    tree        typography
```

Note that `chip`, `expansion-panel`, `list` and `tree` have **already had their
Carbon round** (1, 2, 4, 3) — those rounds predated the page-shell rule, so the
borrow landed without the page conversion. Don't assume a borrowed component
has a converted page.

`demo-section` injects the registry with `{ optional: true }`, so outside the
shell it just skips registering. Good for robustness, bad for noticing — no
error, no console warning, nothing visibly broken.

The workflow doc was itself teaching the bare `<article>` until 2026-08-12, so
every page written from it inherited the gap. That's fixed; the existing pages
are not.

### The fix, per page

1. `<article class="demo-page">` → `<demo-page>` (and the closing tag).
2. Add `DemoPage` to the component's `imports` array and import it from
   `../../components/demo-page/demo-page`.

That's it. Anchors default to a slug of the section heading, so pages that
never set `id` keep working; pages that do set it keep their explicit anchors.

### Notes

- Verify per page rather than trusting the build: this failure compiles and
  renders cleanly either way. The check is "does the page nav appear".
- Watch for pages whose top-level element carries extra classes or attributes
  beyond `class="demo-page"` — those need the attribute moved rather than the
  element swapped wholesale.
- Reference implementations already on the shell: `button`, `resizable`,
  `principles`, `amber-lab`, and now `progress`.
- Worth doing in one sweep rather than opportunistically — the value is a nav
  on *every* page, and a half-converted set is harder to reason about than
  either end state.

## Check 2 — button variant hierarchy in examples

`new-demo-page.md` now specifies that buttons *inside* an example carry the
hierarchy the action would really have: one button → `primary`; two → `primary`
+ `secondary`; three or more → add `tertiary`. Demo pages are the shop window,
so an example's buttons are themselves a demonstration, and a page of identical
bare buttons teaches that variant choice is arbitrary.

Legacy pages predate the rule and mostly use bare or `action` buttons. Align
them while converting the wrapper.

Two exemptions, both deliberate:

- **The button page itself** has to show every variant side by side; the rule
  cannot apply to a page whose subject is the variants.
- **Genuine peer actions** stay peers — `+10` / `Reset` on the progress demo, a
  size switcher, a set of equally-weighted toggles. Inventing a primary to
  satisfy the table is worse than the inconsistency.

Watch for `interop-button="action"` and `action-minus`, which appear throughout
the older pages. Confirm against the theme what they still resolve to before
swapping — the Carbon round reworked the variant vocabulary, and
`.agent/components/button.md` now lists the real set.
