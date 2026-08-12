# TODO — 26 demo pages have no in-page nav

**Status:** deferred, mechanical sweep
**Raised:** 2026-08-12, while running the demo-page playbook against Progress

## The problem

`<demo-page>` is the page shell: it renders the `<article class="demo-page">`,
drops in an `<itx-page-nav>`, and runs the scroll-spy that highlights the
current section. `<demo-section>` self-registers with it, so the nav builds
from the sections already on the page.

Most pages skip the shell and open with a bare `<article class="demo-page">`,
which renders identically and silently has **no page nav**:

```
<demo-page> wrapper:            4 pages
bare <article class="demo-page">: 26 pages
```

`demo-section` injects the registry with `{ optional: true }`, so outside the
shell it just skips registering. Good for robustness, bad for noticing — no
error, no console warning, nothing visibly broken.

The workflow doc was itself teaching the bare `<article>` until 2026-08-12, so
every page written from it inherited the gap. That's fixed; the existing pages
are not.

## The fix, per page

1. `<article class="demo-page">` → `<demo-page>` (and the closing tag).
2. Add `DemoPage` to the component's `imports` array and import it from
   `../../components/demo-page/demo-page`.

That's it. Anchors default to a slug of the section heading, so pages that
never set `id` keep working; pages that do set it keep their explicit anchors.

## Notes

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
