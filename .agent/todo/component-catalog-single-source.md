# TODO — the residue after the catalog extraction

**Status:** the extraction is DONE; two small things are left
**Raised:** 2026-08-12, building the Components landing page
**Resolved (mostly):** 2026-08-12 — `demo-nav.catalog.ts`

## What was fixed

The component list existed in three places that had to agree by hand. It is now
in `projects/demo/src/app/components/demo-nav/demo-nav.catalog.ts` — a plain
data module with no Angular imports — read by both:

- `demo-nav.ts` → sidebar labels + routes
- `pages/components/components-page.ts` → directory cards, via `directoryGroups()`

The directory's list is **derived**, not maintained: `directoryGroups()` filters
to routable, non-`navOnly` entries and drops groups left empty. An entry cannot
be in the sidebar and missing from the directory.

## What is left

### 1. `app.routes.ts` is still a separate list

It cannot be generated from the catalog without moving the `loadComponent`
thunks into it, and a data module holding dynamic imports is no longer a data
module — every page would be pulled into whatever imports it, defeating the
reason the catalog exists.

So one invariant is still held by hand: **a route in `app.routes.ts` has an
entry in the catalog.** That is one pairing to check instead of three, and a
miss is now visible rather than silent — a routed page with no catalog entry is
absent from the directory.

Worth a `scripts/` check if it drifts again. This one-liner finds both
directions:

```bash
node -e '
const s=require("fs").readFileSync("projects/demo/src/app/components/demo-nav/demo-nav.catalog.ts","utf8");
const routes=[...s.matchAll(/route:\s*"([^"]+)"/g)].map(m=>m[1]);
const r=require("fs").readFileSync("projects/demo/src/app/app.routes.ts","utf8");
const paths=[...r.matchAll(/path:\s*"([^"*]+)"/g)].map(m=>"/"+m[1]).filter(p=>p!=="/");
console.log("catalog only:", routes.filter(x=>!paths.includes(x)));
console.log("routed only:", paths.filter(p=>!routes.includes(p)));
'
```

### 2. `/content` is an orphan

The first run of that check found `path: "content"` — routed, reachable, and in
neither the nav nor the catalog. It documents the **djot** content pipeline,
which has since been ruled out in favour of markdown + iA Writer, so it was
deliberately not added to the directory: listing it would advertise an approach
we abandoned.

Decide one of:

- delete the page and its route, or
- move it under **Experiments** in the catalog, relabelled so it reads as a
  historical exploration rather than a current recommendation.

Leaving it as-is is the status quo — it was already invisible before the
catalog existed, so nothing regressed; it is just now *known* to be invisible.

## Also still true

`Code Block` is in the catalog with no `route`, so it renders as a sidebar
placeholder and is omitted from the directory. The fix is a demo page for it,
not a greyed-out card.
