# InteropBadge — Open Questions & Deferred Decisions

## [REVISIT] Linked badge variant (`href` input)

Should `interop-badge` support an `href` input that causes the badge to render as an `<a>`
(or otherwise become interactive), rather than leaving that entirely to the consumer?

Arguments for: convenience, correct focus behavior, no mystery wrapper div.
Arguments against: scope creep; consumer can always wrap; interactive badges are rare.

**Deferred during initial research phase. Revisit before finalizing the standalone badge API.**

---

## [REVISIT] Count transition animation

Should the overlay badge animate the count changing (flip, slide, crossfade)?
Does `prefers-reduced-motion` handling belong in the component or in a global token?

**Deferred. Revisit as part of animation strategy for the library generally.**

---

## [REVISIT] Interactive child discovery (overlay badge)

When `interop-overlay-badge` applies `aria-describedby` to the projected content,
what is the fallback when no interactive child is found?

Options:
- Warn in devMode and apply `role="img" aria-label="..."` to the wrapper container
- Silently apply the label to the wrapper regardless
- Require the consumer to explicitly mark the target with a directive

**Deferred. Revisit when implementing `interop-overlay-badge`.**
