# TODO — Tabs: arrow keys track selection, not focus

**Status:** FIXED 2026-08-23. Kept as the record of the diagnosis; see the
closing note.
**Raised:** 2026-08-11, during the Carbon borrow (round 10, Tabs)
**Severity:** keyboard navigation is stuck after one step in `manual` mode

## The bug

`InteropTabs.onTablistKeydown` computes its starting index from the **selected**
panel:

```ts
const currentIdx = panels.findIndex((p) => p.key() === this.resolvedActive());
```

In `activationMode="auto"` that is harmless, because focus and selection move
together — every arrow press activates the target, so `resolvedActive()` is
always the tab you are standing on.

In `activationMode="manual"` they deliberately come apart: the arrow keys move
focus, and only Enter or Space commits. `resolvedActive()` therefore never
changes while you arrow, so `currentIdx` is pinned to the selected tab and
every ArrowRight computes the same `selected + 1`.

Concretely, with three tabs and the first selected:

| Press | Expected focus | Actual focus |
|---|---|---|
| ArrowRight | tab 2 | tab 2 |
| ArrowRight | tab 3 | tab 2 |
| ArrowRight | tab 1 (wrap) | tab 2 |

Focus cannot travel more than one tab from the selection. `Home` and `End`
still work, because they ignore `currentIdx` entirely — which is why the
failure looks intermittent rather than total.

## Why nothing caught it

`interop-tabs.spec.ts` covers manual mode with three tests, and all three press
a key exactly **once**:

- `ArrowRight does NOT activate in manual mode` — asserts on `resolvedActive()`,
  not on which button has focus.
- `Enter activates focused tab in manual mode` / the `Space` twin — dispatch
  straight at `buttons[1]` / `buttons[2]` rather than arrowing to them.

A single press is exactly the case the bug does not break.

## The fix

Track the focused index rather than the selected one. The tab buttons are
already available as `tabButtons()`, so `document.activeElement` can be
resolved against them without new state:

```ts
const buttons = this.tabButtons();
const focusedIdx = buttons.findIndex(
  (b) => b.nativeElement === document.activeElement,
);
const currentIdx =
  focusedIdx >= 0
    ? focusedIdx
    : panels.findIndex((p) => p.key() === this.resolvedActive());
```

The fallback matters: the handler is on the tablist, so it can also fire when
the tablist itself (not a button) holds focus.

## Second, smaller issue in the same place

The roving tabindex is bound to selection, not focus:

```html
[tabindex]="panel.isActive() ? 0 : -1"
```

The ARIA APG puts `tabindex="0"` on the tab **with focus** and `-1` on the
rest. With manual activation, focus can legitimately sit on an unselected tab,
which then has `tabindex="-1"` — focused but not tabbable. Tab out and back and
you land on the selected tab instead of where you left. Fixing the first bug
makes this one easy: the same focused index drives both.

## Tests to add alongside the fix

- Two consecutive `ArrowRight` presses in manual mode land on tab 3.
- `ArrowLeft` from tab 1 in manual mode wraps to the last tab.
- After arrowing in manual mode, the focused button carries `tabindex="0"`.

## Not fixed in the borrow round

Round 10 was a visual pass. Keyboard-model surgery is a behaviour change with
spec churn attached and belongs in its own commit. Surfaced there because
reading a component closely enough to restate its values is reading it closely
enough to find what was already wrong.

---

## Fixed, 2026-08-23

Both halves, as diagnosed. Focus is now its own signal, `focusedKey`, and a
`rovingKey` computed resolves it against the live panel keys and falls back to
the selection. The keydown handler counts from `rovingKey()`; the tab stop
binds to it.

Two departures from the sketch above. The fix reads a signal rather than
`document.activeElement` — the template needs the same value to drive
`tabindex`, and a DOM read is not reactive, so the signal was needed regardless
and reading it twice is better than having two sources. And `rovingKey`
re-validates against current keys, which the sketch's fallback did not: without
it, removing the focused panel leaves the tablist with no tab stop at all.

Four tests added. Two of them fail against the old code — verified by
reintroducing the bug — which is the point, since the three tests that existed
all pressed a key exactly once and a single press is the one case the bug did
not break. The other two guard behaviour that already worked (ArrowLeft wrap)
and the new re-validation path, and pass either way by design.
