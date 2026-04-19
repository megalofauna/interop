# Elevation System

Design exploration for an automatic, cascade-driven surface elevation system.

---

## The Problem

UI layers stack. A card sits on a page. A popover sits on a card. An inset well sits _into_ a card. Each layer needs a distinct surface color to communicate depth, but manually picking the right stop at every nesting level is tedious and error-prone. Nesting two raised surfaces means the inner one has no obvious next step — the system tops out.

We want:

- A 7-stop ramp: `deboss-3 → deboss-2 → deboss-1 → page → emboss-1 → emboss-2 → emboss-3`
- Automatic, compound depth tracking through nesting — no manual bookkeeping.
- A single consumer token (`--itx-surface`) that always resolves to the correct color for the current depth.
- Opt-in. Nothing changes unless the author says "raise" or "lower."

---

## The Sliding Window

### Mental model

Picture the 7-stop ramp as a physical strip of colored tiles. A window frame sits over the strip with a center slot and three slots visible on each side:

```
┌───────────────────────────────────────────────────────────────────┐
│ deboss-3 │ deboss-2 │ deboss-1 │ PAGE │ emboss-1 │ emboss-2 │ emboss-3 │
└───────────────────────────────────────────────────────────────────┘
                                   ▲
                               WINDOW CENTER
```

When a surface _raises_, the strip slides one position to the left under the window. What _was_ `emboss-1` now sits under center. Every named position still exists, but they all point to the next color up. The consumer never slides the strip — they say "raise" or "lower," and the window shifts.

### Why it works (the CSS mechanic)

Custom properties declared in the same rule block resolve against **inherited** (parent) values, not sibling declarations in the same block. There is no circularity. The browser sees seven independent assignments, each reading an inherited value and writing a local one. The result: every slot in the subtree shifts by one step.

Because the shifted slots _themselves_ inherit, a nested raise inside a raise shifts again — reading the already-shifted parent values and sliding one more step. The compounding is free. You get automatic depth tracking through pure cascade.

---

## Implementation

### 1. Root setup

Seven absolute color tokens (theme-supplied, static) and seven internal sliding slots that shadow them:

```scss
:where([interop-root]) {
  /* ─── The absolute ramp (theme-supplied, static) ──────────────────── */
  --itx-deboss-3: /* darkest  */;
  --itx-deboss-2: /* ...      */;
  --itx-deboss-1: /* ...      */;
  --itx-page:     /* baseline */;
  --itx-emboss-1: /* ...      */;
  --itx-emboss-2: /* ...      */;
  --itx-emboss-3: /* lightest */;

  /* ─── Internal sliding slots (inherit down the tree) ──────────────── */
  --_e-n3: var(--itx-deboss-3);
  --_e-n2: var(--itx-deboss-2);
  --_e-n1: var(--itx-deboss-1);
  --_e-0:  var(--itx-page);
  --_e-p1: var(--itx-emboss-1);
  --_e-p2: var(--itx-emboss-2);
  --_e-p3: var(--itx-emboss-3);

  /* ─── The consumer API ────────────────────────────────────────────── */
  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
  --itx-elevation:     0;
}
```

### 2. Shift classes

Each class reassigns every slot to its neighbor's inherited value:

```scss
/* ─── Raise by 1 ────────────────────────────────────────────────────── */
:where([itx-raise]) {
  --_e-n3: var(--_e-n2);
  --_e-n2: var(--_e-n1);
  --_e-n1: var(--_e-0);
  --_e-0:  var(--_e-p1);   /* center ← one step up  */
  --_e-p1: var(--_e-p2);
  --_e-p2: var(--_e-p3);
  --_e-p3: var(--_e-p3);   /* clamp at ceiling      */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}

/* ─── Lower by 1 ────────────────────────────────────────────────────── */
:where([itx-lower]) {
  --_e-p3: var(--_e-p2);
  --_e-p2: var(--_e-p1);
  --_e-p1: var(--_e-0);
  --_e-0:  var(--_e-n1);   /* center ← one step down */
  --_e-n1: var(--_e-n2);
  --_e-n2: var(--_e-n3);
  --_e-n3: var(--_e-n3);   /* clamp at floor         */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}
```

### 3. Raise / lower by N

Shift by more slots in one go:

```scss
/* ─── Raise by 2 ────────────────────────────────────────────────────── */
:where([itx-raise="2"]) {
  --_e-n3: var(--_e-n1);
  --_e-n2: var(--_e-0);
  --_e-n1: var(--_e-p1);
  --_e-0:  var(--_e-p2);   /* center ← two steps up */
  --_e-p1: var(--_e-p3);
  --_e-p2: var(--_e-p3);   /* clamped */
  --_e-p3: var(--_e-p3);   /* clamped */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}

/* ─── Raise by 3 ────────────────────────────────────────────────────── */
:where([itx-raise="3"]) {
  --_e-n3: var(--_e-0);
  --_e-n2: var(--_e-p1);
  --_e-n1: var(--_e-p2);
  --_e-0:  var(--_e-p3);   /* center ← three steps up */
  --_e-p1: var(--_e-p3);   /* clamped */
  --_e-p2: var(--_e-p3);   /* clamped */
  --_e-p3: var(--_e-p3);   /* clamped */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}

/* ─── Lower by 2 ────────────────────────────────────────────────────── */
:where([itx-lower="2"]) {
  --_e-p3: var(--_e-p1);
  --_e-p2: var(--_e-0);
  --_e-p1: var(--_e-n1);
  --_e-0:  var(--_e-n2);   /* center ← two steps down */
  --_e-n1: var(--_e-n3);
  --_e-n2: var(--_e-n3);   /* clamped */
  --_e-n3: var(--_e-n3);   /* clamped */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}

/* ─── Lower by 3 ────────────────────────────────────────────────────── */
:where([itx-lower="3"]) {
  --_e-p3: var(--_e-0);
  --_e-p2: var(--_e-n1);
  --_e-p1: var(--_e-n2);
  --_e-0:  var(--_e-n3);   /* center ← three steps down */
  --_e-n1: var(--_e-n3);   /* clamped */
  --_e-n2: var(--_e-n3);   /* clamped */
  --_e-n3: var(--_e-n3);   /* clamped */

  --itx-surface:       var(--_e-0);
  --itx-surface-above: var(--_e-p1);
  --itx-surface-below: var(--_e-n1);
}
```

### 4. Numeric elevation tracking (optional)

A registered CSS property lets components derive shadow depth, border opacity, etc. from the current elevation:

```scss
@property --itx-elevation {
  syntax: '<integer>';
  inherits: true;
  initial-value: 0;
}

:where([itx-raise])      { --itx-elevation: calc(var(--itx-elevation) + 1); }
:where([itx-raise="2"])   { --itx-elevation: calc(var(--itx-elevation) + 2); }
:where([itx-raise="3"])   { --itx-elevation: calc(var(--itx-elevation) + 3); }
:where([itx-lower])      { --itx-elevation: calc(var(--itx-elevation) - 1); }
:where([itx-lower="2"])   { --itx-elevation: calc(var(--itx-elevation) - 2); }
:where([itx-lower="3"])   { --itx-elevation: calc(var(--itx-elevation) - 3); }
```

Usage:

```scss
box-shadow: 0 calc(var(--itx-elevation) * 1px) calc(var(--itx-elevation) * 3px) rgba(0, 0, 0, 0.1);
```

### 5. Auto-applying background (opt-in)

A light-touch default that consumers can override at zero specificity:

```scss
:where([itx-raise]),
:where([itx-lower]) {
  background-color: var(--itx-surface);
}
```

---

## Consumer API

### What the consumer writes

```html
<main interop-root>
  <p>background: var(--itx-surface)</p>       <!-- page color -->

  <div itx-raise>
    <p>background: var(--itx-surface)</p>     <!-- emboss-1 -->

    <div itx-raise>
      <p>background: var(--itx-surface)</p>   <!-- emboss-2 -->

      <div itx-lower>
        <p>background: var(--itx-surface)</p> <!-- emboss-1 -->
      </div>
    </div>
  </div>
</main>
```

### Available tokens at any depth

| Token                  | Meaning                                     |
| ---------------------- | ------------------------------------------- |
| `--itx-surface`        | Current surface color at this depth.        |
| `--itx-surface-above`  | One stop brighter than current.             |
| `--itx-surface-below`  | One stop darker than current.               |
| `--itx-elevation`      | Numeric depth (0 = page). For derived math. |

### Available attributes

| Attribute        | Effect                             |
| ---------------- | ---------------------------------- |
| `itx-raise`      | Raise elevation by 1.              |
| `itx-raise="2"`  | Raise elevation by 2.              |
| `itx-raise="3"`  | Raise elevation by 3.              |
| `itx-lower`      | Lower elevation by 1.              |
| `itx-lower="2"`  | Lower elevation by 2.              |
| `itx-lower="3"`  | Lower elevation by 3.              |

---

## Properties

| Concern             | Answer                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| JS required?        | None. Pure cascade.                                                                   |
| Performance         | O(1) per element — 7 reassignments, no runtime resolution chain.                      |
| Max nesting         | 3 raises or 3 lowers from whatever the current base is. Clamping is built in.         |
| Extensibility       | Wider ramp? Add more slots. The pattern is the same.                                  |
| Specificity         | Zero. Everything in `:where()`. Consumers always win.                                 |
| Framework coupling  | None. Works in Angular, React, vanilla HTML, SSR.                                     |
| Token architecture  | Absolute stops are primitives. `--itx-surface` et al. are semantic. Sliding slots are private. |

---

## Open questions

- **Naming:** `itx-raise` / `itx-lower` vs `itx-emboss` / `itx-deboss` vs something else?
- **Auto-background:** Should `[itx-raise]` and `[itx-lower]` auto-apply `background-color`, or should that always be explicit?
- **Ramp width:** 7 stops sufficient? Could define a 9- or 11-stop ramp with the same pattern if needed.
- **Ramp values:** What are the actual color values for the seven stops? Linear luminance ramp, perceptual, theme-dependent?
- **On-surface color:** Should `--itx-on-surface` (text/icon color) also shift with elevation, or remain static?