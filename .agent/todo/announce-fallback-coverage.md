# Announce — decide whether the badge and code block need a fallback

**Raised:** 2026-10-15, with `ec2d6f8d` ("Announce with ariaNotify() instead of
hand-written live regions").

## The gap

`announce()` calls `ariaNotify()`, which is Baseline newly available as of
Safari 27 (2026-09-14). In older browsers it writes to a `status` element if
it is given one, and otherwise says nothing.

| Caller | Fallback in older browsers |
|---|---|
| `bindTags`, `bindTagInput`, `bindCharacterCount` | The consumer's optional `status` element |
| Badge with `announce` | None. Count changes are silent |
| Code block copy button | None. "Copied" and "Couldn’t copy" are silent |

The visible state still changes in every case: the badge's number, the copy
button's check icon.

| Browser | `ariaNotify()` from |
|---|---|
| Chrome, Edge | 141 |
| Firefox | 150 |
| Safari | 27 |

## To decide

1. Check usage share for browsers below those versions: caniuse and
   StatCounter, and the screen reader population specifically if data exists
   (WebAIM screen reader survey: browser and screen reader pairs).
2. Check that `ariaNotify()` is actually spoken: NVDA and JAWS with Chrome and
   Firefox, VoiceOver with Safari 27 on macOS and iOS.
3. Choose:
   - **Leave it.** The share is small, and the fallback retires about March 2029
     anyway, when `ariaNotify()` is Baseline widely available.
   - **Restore a fallback in the two components.** The code block keeps a
     visually hidden `role="status"` span and passes it as `status`. The badge
     needs its region to exist before the count changes, so it would also bring
     back staying visually hidden, not `hidden`, at zero.
   - **Restore it only where it costs nothing:** the code block's span, not the
     badge's.

Whatever is chosen, record it in the badge and code block cards, and in the
`announce` row of the playbook's helpers table.
