# interop-chip — Planning Notes

Research completed. Decisions and open items captured below.

---

## Decisions

- **Filter chips** → `<fieldset>/<legend>/<label>/<input type="checkbox">`. No ARIA. No CVA. Native form participation.
- **Input chips** → `<ul>/<li>/<button>` + `<input type="text">`. Correct backspace state machine per eBay MIND Patterns.
- **Display chips** → `<ul>/<li>/<button>` (delete button optional). No ARIA roles beyond native list.
- Filter chips will not support single-select / radio behavior. That use case belongs to `interop-segmented-control` or `interop-radio-group`.

## Build Order

1. `interop-chip-filter` + `interop-chip-option`
2. `interop-chip-list` + `interop-chip`
3. `interop-chip-input`
4. *(deferred)* Suggestion chips — see TODO below

---

## Real-World Use Cases (one per variant)

| Variant | Example |
|---|---|
| Display chips | Tags on a blog post ("Angular", "CSS", "Accessibility") |
| Filter chips | E-commerce size filter (S, M, L, XL — multi-select, narrows results) |
| Input chips | Gmail To: field — type address, Enter creates chip, Backspace focuses last chip |
| Suggestion chips | *(deferred)* |

---

## TODOs

<!-- TODO: interop-chip-input — Autocomplete / suggestions dropdown
     The v1 input chip supports free-form text entry only. Revisit adding a
     suggestions listbox (combobox pattern with role="combobox", aria-autocomplete,
     aria-controls → role="listbox") once the core chip primitives are stable.
     See eBay MIND Patterns "Chips Combobox" for the authoritative interaction model.
     Priority: medium. Unblocks: type-ahead tag entry, contact pickers. -->

<!-- TODO: interop-suggestion-chip — Suggestion / action chip variant
     Deferred. A suggestion chip is a <button type="button"> with chip styling.
     Consider whether this warrants a dedicated component or is sufficiently
     covered by a CSS utility class / token set applied to a plain button.
     Revisit after filter + input chip variants ship and real consumer needs emerge.
     Priority: low. -->
