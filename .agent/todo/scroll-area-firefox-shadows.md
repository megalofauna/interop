# TODO — scroll area shadows in Firefox

**Status:** open, after the v1 release
**Raised:** 2026-10-11, while building the canonical scroll area
**Owner files:** `projects/interop/scroll-area/interop-scroll-area.structure.css`, `interop-scroll-area.base.css`

## The gap

The "more content" shadows are inset box shadows whose strength comes from scroll-driven
animations (`animation-timeline: scroll(self)`). Firefox does not support scroll-driven
animations, so the rules sit inside `@supports (animation-timeline: scroll())` and Firefox shows
no shadows. Keyboard access, naming and scrolling all work there.

Firefox users whose system hides scrollbars (macOS by default) get no cue that an area scrolls.

## Options

1. **Wait for Firefox.** Scroll-driven animations are on the Interop focus list. When they ship, the
   existing rules apply with no change. Check the web-features entry `scroll-driven-animations`.
2. **`background-attachment: local` covers.** CSS only and supported everywhere. A cover in the
   area's own background color scrolls with the content and slides off a fixed shadow. It needs the
   area to have a known, opaque background, and the shadow is revealed rather than darkened and
   grown. Use it only where `@supports not (animation-timeline: scroll())`.
3. **Script fallback in `bindScrollArea()`.** Set the four strength properties from a scroll
   listener when scroll-driven animations are missing. Behaves the same as the CSS, at the cost of
   per-frame script in one browser.

Prefer 1 if Firefox has shipped by the time this is picked up.
