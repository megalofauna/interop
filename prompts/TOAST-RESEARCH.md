# InteropToast — Component Research

*Research completed for the Interop component library.*
*Component: InteropToast (analogous to Angular Material SnackBar)*

---

## 1. Semantic Correctness & Accessibility

### Host Element

There is **no dedicated HTML element** for toast notifications. The W3C APG Alert pattern specifies a container element with the appropriate ARIA role. The `<output>` element is sometimes cited as a semantic option (it has an implicit `role="status"`), but its form-association semantics make it a poor fit for notifications unrelated to form field calculations.

**Recommendation:** Because there is no native element whose built-in behavior we would be leveraging (unlike `<dialog>` or `<button>`), this is one of the rare cases where a custom **element selector** (`interop-toast-viewport`) is appropriate rather than an attribute selector. The toast has no native element to augment — it is purely additive behavior.

The **toast viewport/container** (the region that holds all active toasts) should use `role="region"` with an `aria-label` like "Notifications" and contain the pre-rendered `aria-live` regions.

### ARIA Roles, Properties, and States

The most critical decision is the `aria-live` politeness level, which varies by toast severity:

| Toast Type | Role | aria-live | Auto-dismiss? | Rationale |
|---|---|---|---|---|
| Success / Info | `status` | `polite` | Yes (5–10s) | Advisory, non-urgent. Announced at next pause. |
| Warning | `status` | `polite` | No | Important but not urgent. Persists for user action. |
| Error | `alert` | `assertive` | No | Urgent, time-sensitive. Interrupts current announcement. |
| With action (Undo) | `status` | `polite` | Pause on hover/focus | Action must be reachable; assertive would be disorienting. |
| Loading / Promise | `status` | `polite` | No (until resolved) | Progress indicator; auto-transitions on completion. |

**Key ARIA attributes:**
- `aria-atomic="true"` on each toast (read entire toast content on change)
- `aria-relevant="additions text"` on the viewport container
- `aria-live` region **must exist in the DOM before content is injected** (the "container priming" rule). Dynamically creating a fully-populated `role="alert"` element is **not reliably announced** by screen readers.
### Keyboard Interaction Model

Per the W3C APG Alert Pattern, toasts have **no required keyboard interaction**. They are passive notifications. However, real-world toasts with interactive elements need:

| Key | Behavior |
|---|---|
| `Tab` | Reaches interactive elements within visible toasts (dismiss button, action button) without toast stealing focus |
| `Escape` | Dismisses the currently focused toast |
| `Enter` / `Space` | Activates the focused action/dismiss button |
| Hotkey (e.g., `F8` or `Alt+T`) | Focus the toast viewport for keyboard-only users who cannot hover |

**Critical rule:** Toasts **must NOT steal focus**. This is explicit in the W3C APG: "It is crucial that alerts do not affect keyboard focus." If focus management is required (e.g., a destructive confirmation), use `role="alertdialog"` instead — that is a different component entirely.

### Spec vs. Pragmatism Divergences

| Topic | W3C Spec | Real-World Practice | Recommendation |
|---|---|---|---|
| **Auto-dismiss** | Avoid. Fails WCAG 2.2.3 (AAA). | Nearly universal with 3–5s default. | Support auto-dismiss but default to **6 seconds**, pause on hover/focus/document-hidden, and **never** auto-dismiss error toasts or toasts with actions. |
| **Interactive content in alerts** | `role="alert"` is for text-only content. | Every toast library includes dismiss/action buttons. | Use `role="status"` (not `alert`) for toasts with interactive content. Reserve `role="alert"` for text-only error notifications. |
| **Container priming** | Live region must exist in DOM before content injection. | Many libraries dynamically create populated alert elements (fails silently). | Pre-render empty `aria-live` containers at service initialization (matching existing `InteropAnnouncer` pattern). |
| **Multiple simultaneous alerts** | Spec warns frequent interruptions inhibit usability (WCAG 2.2.4). | Apps routinely fire multiple toasts with no queuing. | Limit visible toasts (default 3), queue excess, use `polite` for most toasts so screen reader queues naturally. |
---

## 2. Pain Points in Existing Implementations

### Angular Material (MatSnackBar)

**Architecture:**
- Service-only approach with a **hard singleton constraint** — only one snackbar at a time, no queuing, no stacking. Opening a new one silently dismisses the previous. This is the #1 complaint across GitHub and StackOverflow.
- Race condition (GitHub #24386): opening two snackbars synchronously (e.g., from an error handler) leaves both in the DOM, overlapping with unreadable text.

**Styling:**
- `panelClass` / `extraClasses` gets overridden by Material own styles due to specificity. Developers must use `!important` (GitHub #4522 — most-commented snackbar issue, open since 2017).
- Snackbars share `cdk-overlay-container` with dialogs/menus/tooltips. Cannot change snackbar z-index without affecting all overlays (GitHub #22000).
- Only coarse positioning (`top`/`bottom` x `start`/`center`/`end`). No pixel offsets, no container-relative positioning, no custom anchor points.

**Accessibility:**
- VoiceOver does not announce snackbar content even with `announcementMessage` set (GitHub #13015). The implementation uses a fragile DOM-moving strategy (content is physically relocated from an aria-hidden container to a live region after 150ms).
- JAWS + modal interaction bug (GitHub #21707): snackbar after dialog close is not voiced. Workaround modifies `aria-owns` on all modals in the DOM — brittle.
- Firefox-specific role hacks in the source code — accessibility behavior varies per browser.
- No focus management at all. Keyboard users cannot reach the action button without tabbing through the entire page.

**API:**
- `open(message, action, config)` gives a single string + single action label. Anything richer requires `openFromComponent()` or `openFromTemplate()`.
- No return value on dismiss — `dismissWithAction()` is a boolean flag, unlike `MatDialog.close(result)` (GitHub #23660).
- `duration`-based snackbars hang test harnesses because `setTimeout` prevents zone stabilization (GitHub #19290).

**Mobile:**
- Bottom-positioned snackbars hide behind virtual keyboards on iOS (GitHub #8965, open, P5).
- Handset mode is binary (full-width or not). No responsive breakpoint customization.

### React Ecosystem

**Sonner (Emil Kowalski) — Current gold standard:**
- Pure imperative API (`toast()`, `toast.success()`, `toast.promise()`)
- Stacking with expand-on-hover, `visibleToasts` cap (default 3)
- Swipe-to-dismiss with velocity detection and axis locking
- Promise toasts that auto-transition from loading to success/error
- All animation via CSS data attributes + CSS variables
- Weakness: all toasts use `aria-live="polite"` — no foreground/background distinction for screen readers

**Radix Toast — Best accessibility:**
- Declarative compound component pattern (high boilerplate)
- `type` prop: `"foreground"` (assertive) vs `"background"` (polite)
- Required `altText` on action buttons for screen reader alternative paths
- Hotkey to viewport (default `F8`)
- Pause on hover, focus, and window blur with `onPause`/`onResume` callbacks
- Weakness: no built-in stacking, no imperative API, no animation, no toast types

**Common cross-library complaints:**
- Styling specificity wars (Material, Vuetify)
- Single-notification limitation (Material, early MUI)
- Poor screen reader support for dynamically inserted content
- Auto-dismiss too fast for accessibility (3s default is common, too short)
- No pause-on-hover or pause-on-focus (older libraries)
- Action buttons unreachable by keyboard
---

## 3. Killer Differentiator

### Differentiator 1: Observable-native Promise Toasts

Angular apps are Observable-heavy. The killer feature:

```typescript
// Works with Observables (Angular-native)
this.toast.observe(this.http.post('/api/save', data), {
  loading: 'Saving...',
  success: (response) => 'Saved: ' + response.name,
  error: (err) => 'Failed: ' + err.message,
});

// Also works with Promises
this.toast.promise(fetch('/api/data'), {
  loading: 'Loading...',
  success: 'Done!',
  error: 'Failed.',
});
```

No other Angular toast library offers first-class Observable support. Sonner `toast.promise()` is the most-loved feature in React — but it only handles `Promise`. An Angular equivalent that handles `Observable`, `Promise`, and `Signal` would be genuinely differentiated. The toast auto-transitions from loading to success/error, handles unsubscription on dismiss, and respects Angular `DestroyRef` lifecycle.

### Differentiator 2: Stacking with Smart Keyboard Access

Combine Sonner visual stacking UX (expand-on-hover, configurable `maxVisible`) with Radix accessibility model (hotkey to viewport, foreground/background `aria-live` distinction, `altText` on actions). No existing library — in any framework — nails both simultaneously.

The specific innovation: a **configurable hotkey** (default `Alt+T`) that focuses the toast viewport, allowing keyboard users to Tab through active toasts. When focus leaves the viewport, focus returns to the previously focused element. This solves the "action button unreachable by keyboard" problem without stealing focus.
---

## 4. Summary & Implementation Plan

### Decisions Made

1. **Service + Component hybrid architecture.** An imperative `InteropToastService` creates toasts programmatically (`show()`, `success()`, `error()`, `warning()`, `info()`, `loading()`, `observe()`, `promise()`). An `InteropToastViewport` component renders them. This matches Angular idiom (services for imperative actions) while keeping rendering declarative.

2. **Multiple simultaneous toasts with stacking.** Default `maxVisible: 3`, excess toasts queued. Visual stacking with expand-on-hover. Configurable limit.

3. **Severity-aware `aria-live` regions.** Error toasts use `role="alert"` / `aria-live="assertive"`. All others use `role="status"` / `aria-live="polite"`. Pre-rendered empty containers per the container-priming rule.

4. **No focus stealing.** Toasts never capture focus on appearance. Keyboard access via configurable hotkey (default `Alt+T`) and Tab navigation through visible toasts.

5. **Auto-dismiss defaults to 6 seconds.** Pauses on hover, focus-within, and document visibility change. Error toasts and toasts with actions never auto-dismiss. Duration is configurable per-toast and globally.

6. **CSS custom property theming.** Component tokens (`--itx-toast-*`) reference global tokens. Variant colors use the existing status triplet system (`--itx-{status}`, `--itx-{status}-surface`, `--itx-on-{status}-surface`). Private aliases (`--_*`) switched via `[data-type]` host attribute, matching the callout pattern exactly.

7. **CSS-only animations.** Enter/exit via `@starting-style` + `transition-behavior: allow-discrete` on the popover layer, matching the dialog pattern. Swipe uses CSS custom properties set by pointer event handlers.

8. **`<output>` is NOT used.** Despite its implicit `role="status"`, its form association semantics are misleading. A custom element selector `interop-toast-viewport` for the container and individual toast items rendered internally is cleaner.
### Proposed Component Tree

```
InteropToastViewport (Component)
  selector: 'interop-toast-viewport'
  Renders the toast container with aria-live regions
  Manages stacking layout, expand-on-hover
  Listens for hotkey (Alt+T) to focus viewport

  InteropToastItem (Internal Component, not exported)
    Renders individual toast: icon, message, description, actions, dismiss
    Handles swipe-to-dismiss gesture
    Manages auto-dismiss timer with pause logic
    Binds [data-type], [data-state], [data-swipe] for CSS

InteropToastService (Injectable, providedIn: 'root')
  show(message, config?) -> InteropToastRef
  success(message, config?) -> InteropToastRef
  error(message, config?) -> InteropToastRef
  warning(message, config?) -> InteropToastRef
  info(message, config?) -> InteropToastRef
  loading(message, config?) -> InteropToastRef
  observe(observable, messages, config?) -> InteropToastRef
  promise(promise, messages, config?) -> InteropToastRef
  dismiss(id) -> void
  dismissAll() -> void
  Maintains signal-based toast state array

InteropToastRef (Returned handle)
  id: string
  dismiss() -> void
  update(config) -> void
  afterDismissed() -> Observable<ToastDismissReason>
  afterOpened() -> Observable<void>
  onAction() -> Observable<string>

InteropToastAction (Directive, for template-based toasts)
  selector: '[interopToastAction]'
  Marks projected action buttons, carries altText input for a11y

INTEROP_TOAST_CONFIG (InjectionToken)
  Global configuration override
  Three-tier cascade: per-toast config -> global token -> library defaults
```
### Angular Architecture

**Selector strategy:**
- `interop-toast-viewport` — element selector (no native element to augment)
- Internal toast items rendered by the viewport component, not projected

**Injection token pattern:**

```typescript
INTEROP_TOAST_CONFIG = new InjectionToken<Partial<InteropToastConfig>>(
  'INTEROP_TOAST_CONFIG',
  { providedIn: 'root', factory: () => ({}) }
);

INTEROP_TOAST_DEFAULTS: InteropToastConfig = {
  duration: 6000,
  position: 'bottom-right',
  maxVisible: 3,
  gap: 14,
  hotkey: 'alt+KeyT',
  swipeDismiss: true,
  swipeThreshold: 50,
  pauseOnHover: true,
  pauseOnFocusWithin: true,
  pauseOnDocumentHidden: true,
  expandOnHover: true,
};
```

**Signal inputs/outputs:**
- Viewport: `position`, `maxVisible`, `gap`, `hotkey` (all signal `input()`)
- Service state: internal `signal<ToastState[]>()` array
- ToastRef: leverages `Subject`/`Observable` for `afterDismissed()`, `onAction()`

**ControlValueAccessor:** Not applicable — toasts are not form controls.
### CSS Approach

**Component tokens** (`theme/_tokens.scss`):

```scss
:where(interop-toast-viewport) {
  --itx-toast-z-index: var(--itx-z-toast, 9999);
  --itx-toast-max-width: 25rem;
  --itx-toast-gap: 0.875rem;
  --itx-toast-offset: var(--itx-spacing-4);
  --itx-toast-padding: var(--itx-spacing-4);
  --itx-toast-border-radius: var(--itx-radius-md);
  --itx-toast-shadow: var(--itx-shadow-lg);
  --itx-toast-background: var(--itx-surface-above);
  --itx-toast-foreground: var(--itx-on-surface);
  --itx-toast-border-width: 1px;
  --itx-toast-border-color: var(--itx-border);
  --itx-toast-enter-duration: var(--itx-duration-base);
  --itx-toast-exit-duration: var(--itx-duration-fast);
  --itx-toast-enter-easing: var(--itx-easing-decelerate);
  --itx-toast-exit-easing: var(--itx-easing-accelerate);
}
```

**Variant switching** (matches callout pattern):

```scss
:host([data-type="success"]) {
  --_accent: var(--itx-success);
  --_bg: var(--itx-success-surface);
  --_color: var(--itx-on-success-surface);
}
:host([data-type="error"]) {
  --_accent: var(--itx-danger);
  --_bg: var(--itx-danger-surface);
  --_color: var(--itx-on-danger-surface);
}
:host([data-type="warning"]) {
  --_accent: var(--itx-warning);
  --_bg: var(--itx-warning-surface);
  --_color: var(--itx-on-warning-surface);
}
:host([data-type="info"]) {
  --_accent: var(--itx-info);
  --_bg: var(--itx-info-surface);
  --_color: var(--itx-on-info-surface);
}
```

**What the consumer controls:**
- All `--itx-toast-*` tokens (zero specificity, overridable anywhere)
- Position via input or global config
- Custom templates via `openFromTemplate()` if desired

**What the component owns:**
- Stacking layout (position: fixed, offset calculations, CSS variables for `--index`, `--offset`, `--front-toast-height`)
- Enter/exit animations (`@starting-style`, `transition-behavior: allow-discrete`)
- Swipe gesture CSS (`--swipe-amount-x`, `--swipe-amount-y`)
- Reduced motion handling (`@media (prefers-reduced-motion: reduce)`)
### DevMode Warnings

1. **Missing viewport:** If `InteropToastService.show()` is called but no `<interop-toast-viewport>` is in the DOM, warn with guidance.
2. **Action without altText:** If a toast has an action button but no `altText` is provided, warn that screen reader users need an alternative path description.
3. **Error toast with auto-dismiss:** If someone passes `duration` on a toast with `type: 'error'`, warn that error toasts should persist.
4. **Too many active toasts:** If the queue exceeds a threshold (e.g., 20), warn about potential memory/performance issues.
5. **Document has no `interop-root`:** If the global token root attribute is missing, warn that theming may not work.

### Resolved Decisions

| # | Question | Resolution |
|---|---|---|
| 1 | Template-based toasts | **Deferred to v2.** Name TBD (not "openFromTemplate"). |
| 2 | Position options | **Full 6-position grid.** Viewport-level only for v1. |
| 3 | Multiple viewports | **Deferred.** Service internals carry an optional `channel` field for future multi-viewport support without breaking changes. |
| 4 | Swipe-to-dismiss on desktop | **Yes, pointer events everywhere.** Default on, opt-out via `swipeDismiss: false`. No polling — listeners only active during drag. |
| 5 | Close button default | **Smart default.** Show for persistent/error/warning toasts. Hide for auto-dismissing success/info/default toasts. |
| 6 | `observe()` dismiss behavior | **Three-option `cancelBehavior`.** Default `'detach'` (safe: toast disappears but Observable continues). Opt-in `'unsubscribe'` for explicit cancellation. `'prevent'` to block dismiss during loading. |

---

*Research authored for the Interop component library.*
*Implementation complete — see `src/lib/components/interop-toast/`.*
