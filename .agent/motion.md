# InteropMotion — Family Design Proposal

> **Status:** pre-implementation design. Rounds 1 and 2 locked (see [Round 1 outcomes](#round-1-outcomes), [Round 2 outcomes](#round-2-outcomes)). Ready for Round 3 implementation.
>
> **Scope:** a small family of directives that put state-driven *visual treatment* (motion, by default) onto interactive elements. Three members proposed:
>
> | Directive | Trigger semantic | Lifecycle |
> |---|---|---|
> | `InteropMotionTrigger` (lead) | Fires on a DOM event or imperative `.fire()` | One-shot |
> | `InteropMotionWhile` | Runs while a boolean input/signal is truthy | Continuous |
> | `InteropMotionOn` | Fires on a `false → true` signal edge | One-shot |
>
> The shared `motion-` prefix is the family signal. The suffix tells consumers *when* the directive fires — the only thing they need to disambiguate. Names are deliberately generic enough that "visual treatment" extensions beyond pure motion (filter swaps, color cues) fit the same vocabulary later without renaming.
>
> **Three constraints, in priority order, that this doc must defend against:**
> 1. **Lean and mean.** No code that exists only "in case." Shared substrate factored once, never twice.
> 2. **Buttery smooth.** 60fps non-negotiable. Compositor-only properties. No paint or layout in the hot path.
> 3. **Predictable DX.** One attribute to opt in. Sensible defaults. Imperative API mirrors declarative.

## The family at a glance

| Directive | Trigger | Stops on | Typical use |
|---|---|---|---|
| `InteropMotionTrigger` | DOM event or `.fire()` | `animationend` | reload spin, like-pop, error-shake |
| `InteropMotionWhile` | boolean input flips true | input flips false | save spinner, submit-in-flight |
| `InteropMotionOn` | input edge (false → true) | `animationend` | checkmark draw-in after save, success flash |

All three sit in `src/lib/directives/motion/` and share one structural CSS module, one setup utility, one token namespace, and one preset library. Their *state machines* differ; nothing else does.

## Problem (re-stated for the family)

Built ad-hoc, this whole space has the same five sharp edges that the reload-button rediscovered:

1. **Transform conflict** between anticipation and action on the same property.
2. **State latching** during `animationend` cleanup while pointer is still over the element.
3. **Reduced motion** wrapping forgotten on one of N layers.
4. **Disabled state** suppression duplicated per directive.
5. **Jank** from animating non-compositor properties (`box-shadow`, `width`, `top`/`left`), or from layout shifts when state classes toggle.

Solving these once, in a shared substrate, is the entire reason this is a *family* and not three unrelated directives.

## Core insight — compose transforms via individual properties

The reload-button fix used a two-element wrapper/inner split. That works but injects DOM. There's a leaner path that fits the same mental model.

CSS has three individual transform properties — `rotate`, `translate`, `scale` — that compose with `transform:` rather than replacing it. Per spec they are applied **before** `transform:`, so:

```css
.target {
  transition: transform 100ms;       /* anticipation lane */
}
.target:hover {
  transform: rotate(-30deg);         /* cock back */
}
.target.is-acting {
  animation: spin 500ms ease-out;    /* action lane */
}
@keyframes spin {
  to { rotate: 360deg; }             /* individual prop, does not collide */
}
```

These compose without fighting. **One element. No DOM injection. No jerk.**

**Convention to enforce:**
- **Anticipation** uses `transform:` (composable shorthand, fine for hover transitions).
- **Action** uses `rotate:` / `translate:` / `scale:` individual properties.

Presets author against this convention. Consumers BYO-ing keyframes follow it. The structural CSS scopes each lane via `:where()` selectors.

Browser support floor: 2022+ evergreens (confirmed acceptable per round-1 decisions). No layered-wrapper fallback ships; if a need surfaces later, we'll add it then.

## Shared substrate (the lean core)

Three small pieces, used by all family members:

### 1. Structural CSS module — `src/lib/styles/motion/motion-surface.css`

The substrate is **property-agnostic**: it provides hooks for presets to attach to, nothing more. It does not declare any `transform`, `animation`, or transition property of its own. Presets do.

What it owns:

- The `[itx-motion]` host attribute hook (and `position: relative` via a zero-specificity `:where()` rule, so overlay-based presets like `pulse` work without consumer effort).
- The universal preset attribute hook: `itx-motion-preset="..."`. Directives mirror their declared preset onto this attribute so all CSS selectors target a single, directive-agnostic surface.
- The three state class hooks: `is-acting` (Trigger), `is-while` (While), `is-on` (On). One per directive; each gets its own selector so multiple directives on one host don't collide on a shared CSS lane.
- Multi-child scoping: presets that need to animate a specific child instead of the host route their rules through `[data-itx-motion-target]` via `:has()`. See [Multi-child scoping](#multi-child-scoping).
- Reduced-motion gating wrapper: anticipation rules go inside `@media (prefers-reduced-motion: no-preference)`. A shared `@keyframes itx-motion-opacity-pulse` keyframe is declared here for presets to fall back to under `prefers-reduced-motion: reduce`.
- Disabled gating: `:not(:disabled):not([aria-disabled="true"])` mixed into every anticipation selector.
- `will-change: transform, opacity` applied **only while** a state class is present (zero memory cost at rest).

No directive-specific rules. No preset-specific rules. No property-specific rules. Pure structure.

### 2. Setup utility — `src/lib/directives/motion/setup-motion-surface.ts`

A single function, not a base class:

```ts
export interface MotionSurface {
  /** The element receiving anticipation + action classes. The host. */
  readonly target: HTMLElement;
  /** True when prefers-reduced-motion: reduce. Static at construction. */
  readonly reducedMotion: boolean;
  /** Apply the action class with animationend cleanup wired. One-shot. */
  fire(): void;
  /** Hold the action class continuously until released. Returns the release fn. */
  hold(): () => void;
  /** Tear down listeners. Call from DestroyRef. */
  destroy(): void;
}

export function setupMotionSurface(host: HTMLElement, opts: {
  /** Class added during action. e.g. 'is-acting' for trigger, 'is-while' for while. */
  className: string;
}): MotionSurface;
```

Why a function, not a base class:
- Standalone-directive inheritance buys nothing in Angular and complicates DI.
- A function is trivially tree-shakeable per call site.
- Each directive composes this with its own state machine without an inheritance chain.

`fire()` adds the class, listens once for `animationend`, removes the class, removes the listener.
`hold()` returns a release function — for `InteropMotionWhile`'s indeterminate case it adds the class and *doesn't* listen for animationend (the animation is `iteration-count: infinite`); the release function removes the class. Same primitive, two lifecycle shapes.

### 3. Token namespace — `--itx-motion-*`

Public surface, consumer-overridable at any ancestor scope. Presets *set* these tokens with sensible defaults; consumers override at any cascade level. Directives never read tokens — they only apply classes and the preset attribute, and let CSS resolve everything.

```
Anticipation
  --itx-motion-anticipate-duration
  --itx-motion-anticipate-easing
  (the anticipation rule itself — transform / filter / color — is preset-specific
   and lives in the preset's CSS, not in a token, because different presets animate
   different properties)

Action
  --itx-motion-action-duration
  --itx-motion-action-easing
  --itx-motion-action-iteration           (1 for Trigger/On, infinite for While)

Reduced-motion fallback
  --itx-motion-action-reduced-duration    (others reuse the shared keyframe)
```

This is intentionally smaller than the round-1 sketch. Once we accepted that the substrate is property-agnostic, most "tokens" turned out to be preset-internal concerns, not consumer-facing knobs. Durations and easings are the genuine cross-preset axes worth a public token surface.

## Multi-child scoping

Most hosts will have a single visible child (icon-only buttons), and the directive can safely animate the host. For mixed-content hosts (`<icon /> Save`), the consumer marks one child with `data-itx-motion-target`:

```html
<button interop-motion-trigger itx-motion-preset="spin" (click)="reload()">
  <span data-itx-motion-target>
    <interop-icon name="tabler-reload" />
  </span>
  Reload
</button>
```

The structural CSS routes preset rules through pure-CSS selectors — no directive code involved:

```css
/* No target marker → animate the host */
:where([itx-motion]:not(:has([data-itx-motion-target]))) { /* anticipation rules */ }
:where([itx-motion]:not(:has([data-itx-motion-target]))).is-acting { /* action rules */ }

/* Target marker present → animate the marked child */
:where([itx-motion]:has([data-itx-motion-target])) [data-itx-motion-target] { /* anticipation */ }
:where([itx-motion].is-acting:has([data-itx-motion-target])) [data-itx-motion-target] { /* action */ }
```

This relies on `:has()`, in baseline 2022+ evergreens (Safari 15.4, Chromium 105, Firefox 121). Per round-1 outcomes, that's our floor.

## Custom mode (BYO keyframes)

Built-in presets are just opinionated default token sets attached to specific preset selectors. Going "custom" is not a special mode — it's the same cascade mechanism, with the consumer setting the tokens themselves.

```html
<button
  interop-motion-trigger
  itx-motion-preset="my-wiggle"
  (click)="reload()">
  <interop-icon name="tabler-reload" />
</button>
```

```css
/* Consumer-authored, anywhere in the cascade */
:where([itx-motion-preset="my-wiggle"]) {
  --itx-motion-action-duration: 300ms;
}

@media (prefers-reduced-motion: no-preference) {
  :where([itx-motion-preset="my-wiggle"]) {
    transition: transform 80ms ease-out;
  }
  :where([itx-motion-preset="my-wiggle"]):not(:disabled):hover {
    transform: rotate(15deg) scale(0.95);
  }
  :where([itx-motion-preset="my-wiggle"]).is-acting {
    animation: my-wiggle var(--itx-motion-action-duration) ease-out;
  }
}

@keyframes my-wiggle {
  0%  { rotate: 0; }
  25% { rotate: -10deg; }
  50% { rotate:  10deg; }
  100%{ rotate: 0; }
}
```

The consumer's responsibilities, all natural CSS authoring concerns:

1. Pick a unique preset name (their own keyspace).
2. Author the anticipation rule (transform / filter / color — whatever applies).
3. Author the action `@keyframes` with the convention: action uses individual `rotate:`/`translate:`/`scale:` properties when transform composition matters; otherwise any animatable property.
4. Author a `prefers-reduced-motion: reduce` fallback — either substitute their own reduced-motion keyframe, or reference the shared `itx-motion-opacity-pulse` keyframe.

Failure modes are silent because everything is CSS — if no rule matches the preset name, nothing animates. Dev-mode warnings could be emitted from the directive when `itx-motion-preset` is set to a value not in the built-in registry, but only as a warning ("unknown preset, assuming custom") — never an error.

## Performance budget (commitments, not aspirations)

Every directive in this family commits to:

| Property | Allowed | Disallowed |
|---|---|---|
| Animated CSS properties | `transform`, `rotate`, `translate`, `scale`, `opacity`, `filter` (limited) | `box-shadow`, `width`/`height`, `top`/`left`/`right`/`bottom`, `margin`, `padding`, `border-width`, `background-color` (in keyframes) |
| Per-frame JS in animation hot path | None | rAF loops, signal updates per frame, ResizeObserver firing |
| DOM mutation during interaction | None | Per-event DOM reads/writes, layout-thrashing class swaps |
| `will-change` | Only while a state class is present | Never on idle elements |
| Listener footprint | One per directive instance (or zero, via CSS-only states) | Multiple per-event listeners; listeners attached/detached per frame |
| CD impact | Signal writes batched per state transition (start/stop/end). OnPush. | Per-frame signal writes; zone-driven repaints during animation |

A `pulse` preset that wants a radial glow uses a `::before` pseudo-element with `transform: scale()` and `opacity:`, **not** `box-shadow` keyframes. This is enforced at preset-authoring time (rules documented alongside the directive).

Each preset ships with a chrome-perf-trace verified during development: DevTools → Performance → record an activation. If the flame chart shows "Layout" or "Paint" during the keyframe window, the preset is rejected.

## DX principles

1. **One attribute to opt in (plus a preset for non-default cases).** `interop-motion-trigger="spin"` (preset inlined as the attribute value — Trigger always needs an explicit preset). `[interop-motion-while]="saving()"` and `[interop-motion-on]="saved()"` carry signal inputs in their main attribute and accept an optional `itx-motion-preset="..."` override (defaults: `spinner` for While, `check` for On). The directive mirrors the resolved preset onto `itx-motion-preset` so CSS selectors only ever target one attribute.
2. **Imperative API mirrors declarative.** `motion.fire()` works regardless of which directive (Trigger fires on call; While accepts an optional `force` flag; On exposes `.fire()` for non-signal triggers). Same observable side-effects either way.
3. **Composable on one host.** A button can declare all three; they coordinate via the shared `setupMotionSurface` (one shared `target`, each owns its own state class — `is-acting`, `is-while`, `is-on`). They never collide on the same CSS property because each preset uses its assigned lane.
4. **Native `:disabled` Just Works.** All structural rules require `:not(:disabled)`. No JS check needed for the common case.
5. **Failure is loud in dev, silent in prod.** Missing preset name? Dev console warning. Unknown preset? Dev console warning, no-op. Prod build strips the warnings.
6. **Type-safe preset names.** `interop-motion-trigger="spin" | "shake" | "pop" | "pulse" | "dip" | "nudge"`. Custom-keyframes mode uses `"custom"` with author-supplied tokens.

## Per-directive design

### InteropMotionTrigger (lead)

```html
<button interop-button="icon" interop-motion-trigger="spin" (click)="reload()">
  <interop-icon name="tabler-reload" />
</button>
```

- On `click` (or other configured trigger event), calls `surface.fire()`.
- Suppressed when host is `:disabled` (no class added).
- Optional imperative `.fire()` for non-event-driven activations.
- The attribute value is the preset name; the directive mirrors it to `itx-motion-preset`.

State machine: trivially `idle ↔ acting`. The shared substrate handles both transitions.

Implementation target: ~30 lines of TS plus the preset CSS modules. If it grows past ~80 lines, we re-examine the boundary with the substrate.

### InteropMotionWhile

```html
<!-- Default preset (spinner) -->
<button interop-button [interop-motion-while]="saving()">
  <interop-icon name="tabler-device-floppy" />
  Save
</button>

<!-- Override preset -->
<button interop-button [interop-motion-while]="saving()" itx-motion-preset="pulse">
  …
</button>
```

- Accepts a signal-friendly boolean input.
- When it flips true, calls `surface.hold()`, stores the release function.
- When it flips false, calls the release function.
- Sets `aria-busy="true"` on the host while truthy (assistive-tech parity, even when the visual is suppressed under reduced motion).
- Optional `motionWhileIcon` content-projection slot: when active, hide host's default content and show the projected slot (default: a CSS-drawn spinner shipped with the `spinner` preset).
- Defaults `itx-motion-preset` to `spinner` if omitted.

State machine: `idle ↔ active`. No `animationend` involvement — the action loops via `animation-iteration-count: infinite`, set by the preset.

Content-swap detail: use `visibility: hidden` + absolute-positioned overlay for the spinner, **not** `display: none`. Avoids layout reflow when state flips. The button's intrinsic size stays stable.

The activation bridge is most relevant here — see [InteropActivation bridge](#interopactivation-bridge).

### InteropMotionOn

```html
<!-- Default preset (check) -->
<button interop-button [interop-motion-on]="saved()">
  <interop-icon name="tabler-device-floppy" />
</button>

<!-- Override preset -->
<button interop-button [interop-motion-on]="saved()" itx-motion-preset="pulse">
  …
</button>
```

- Edge-triggered: when input flips `false → true`, calls `surface.fire()` once.
- Often paired with `InteropMotionWhile` (active while saving, fires when result arrives), but valid standalone (form validation success, input accepted, etc.).
- Defaults `itx-motion-preset` to `check` if omitted.

State machine: same as Trigger, but driven by signal edge instead of DOM event.

Can coexist with `InteropMotionWhile` on the same host: `is-while` controls the spinner overlay; `is-on` controls the checkmark overlay. They never run simultaneously by virtue of the state machine (while flips false before on flips true).

## Preset library

Each preset is one CSS module at `src/lib/styles/motion/presets/<name>.css`, plus an entry in the type-union of known preset names. Adding or removing a preset is a CSS-only change plus a one-line type edit; no directive code involves preset names.

Authoring conventions (enforced by example, not by tooling):
- Anticipation rules live inside `@media (prefers-reduced-motion: no-preference)`.
- Action keyframes use individual transform properties (`rotate:`/`translate:`/`scale:`) so they compose with anticipation `transform:` without collision. Other animatable properties (`opacity`, `filter`) are fine; layout-triggering and paint-triggering properties are not.
- A `prefers-reduced-motion: reduce` fallback rule substitutes a low-motion animation, typically `itx-motion-opacity-pulse` from the substrate.

### Concrete preset specs

Each spec below is the contract: keyframe shape, duration, easing, reduced-motion fallback. Implementation is mechanical translation to CSS.

#### `spin` — for Trigger / On

```
Anticipation     transform: rotate(-30deg), transition 100ms ease-out
Action keyframes 0% → rotate: 0 ; 100% → rotate: 360deg
Action timing    500ms ease-out, 1 iteration
Reduced motion   itx-motion-opacity-pulse, 120ms
```

#### `shake` — for Trigger / On

```
Anticipation     none
Action keyframes 0% translate: 0 ; 20% -3px ; 40% 3px ; 60% -2px ; 80% 2px ; 100% 0
Action timing    400ms linear, 1 iteration
Reduced motion   itx-motion-opacity-pulse, 120ms
```

#### `pop` — for Trigger / On

```
Anticipation     transform: scale(1.05), transition 100ms ease-out
Action keyframes 0% scale: 1 ; 50% scale: 1.2 ; 100% scale: 1
Action timing    250ms ease-out, 1 iteration
Reduced motion   itx-motion-opacity-pulse, 120ms
```

Note: at the peak of a hovered `pop`, scales multiply (1.05 × 1.2 ≈ 1.26). Brief spike; acceptable.

#### `pulse` — for Trigger / On / While

Uses a `::before` overlay on the host (or marked target). Requires the host to be a positioning context — the substrate provides `position: relative` already.

```
Anticipation     none
Overlay element  host::before, position: absolute, inset: 0, border-radius: inherit,
                 background: currentColor, opacity: 0, pointer-events: none
Action keyframes 0% scale: 1 / opacity: 0.5 ; 100% scale: 1.4 / opacity: 0
Action timing    600ms ease-out, 1 iteration (Trigger/On) or infinite (While)
Reduced motion   keep the overlay but animate opacity 0 → 0.3 → 0 only, 200ms
```

`pulse` is the only preset that uses a pseudo-element, and the only one valid for all three directives. Useful when a continuous-but-non-spinning indicator is needed.

#### `dip` — for Trigger / On

```
Anticipation     transform: translate(0, 1px), transition 100ms ease-out
Action keyframes 0% translate: 0 ; 50% translate: 0 3px ; 100% translate: 0
Action timing    200ms ease-out, 1 iteration
Reduced motion   itx-motion-opacity-pulse, 120ms
```

#### `nudge` — for Trigger / On

```
Anticipation     transform: translate(-2px, 0), transition 100ms ease-out
Action keyframes 0% translate: 0 ; 50% translate: 5px 0 ; 100% translate: 0
Action timing    200ms ease-out, 1 iteration
Reduced motion   itx-motion-opacity-pulse, 120ms
```

#### `spinner` — default for `InteropMotionWhile`

Animates a spinner overlay (CSS-drawn ring) or content-projected slot.

```
Anticipation     none
Default overlay  CSS-drawn 1em ring with border-top: 2px solid currentColor and a transparent rest
Action keyframes 0% → rotate: 0 ; 100% → rotate: 360deg
Action timing    800ms linear, infinite iteration
Reduced motion   no rotation; render a static three-dot indicator with no animation
                 (aria-busy carries the state)
```

#### `check` — default for `InteropMotionOn`

Animates an inline SVG checkmark (injected by the directive if no content-projected slot is provided).

```
Anticipation     none
Default overlay  inline SVG path; stroke-dasharray equals path length; stroke-dashoffset
                 initialized to path length
Action keyframes 0% stroke-dashoffset: <length> ; 100% stroke-dashoffset: 0
Action timing    400ms ease-out, 1 iteration
Reduced motion   no draw-in; opacity 0 → 1 fade-in, 80ms ease-out
```

Note: SVG `stroke-dashoffset` is compositor-friendly in modern browsers and was specifically retained as the rare non-transform animation that meets the perf budget. Verified during preset implementation per the perf-trace rule.

## Reduced motion

Opinionated: `prefers-reduced-motion: reduce` means **less motion, not no motion**. Removing all visual cues would defeat the entire purpose of the family.

Three layers of fallback:

1. **Anticipation: suppress entirely.** No hover transform. Hover-state communication falls back to the host element's own affordances (cursor, color shift from the button's existing rules).
2. **Action: low-motion variant.** Each preset declares a reduced-motion fallback that conveys "your action registered" without producing motion — usually a brief opacity dip (0.6 → 1, 80ms). Some presets (like `check`) substitute a near-instant fade-in for a drawn-in animation. The signal is preserved; the motion is not.
3. **While: static indicator + `aria-busy="true"`.** No spinner rotation. The directive sets `aria-busy="true"` on the host whenever active, regardless of motion preference, so assistive tech always announces the state. The visual fallback is a non-animated indicator (neutral dot, icon dim).

## InteropActivation bridge

Orthogonal to Trigger, intimately related to While. Deferred to a later pass (see [Round 1 outcomes](#round-1-outcomes)) but the design shape is recorded here so it doesn't drift:

- **InteropMotionTrigger:** ignores activation by default; opts in by reading `[interopActivation]` on the same host and subscribing to a `didActivate` event the activation chain emits on each successful (non-debounced, non-throttled) activation. Cancelled activations don't animate.
- **InteropMotionWhile:** if paired with an activation chain that supports async handlers, `[interop-motion-while]` becomes optional — the directive subscribes to the chain's `inFlight` signal directly. Requires `InteropActivation` to expose `inFlight: Signal<boolean>`. Small addition; coordinated work.
- **InteropMotionOn:** edge-triggered from an external signal; activation chain is irrelevant.

The bridge is opt-in and tree-shakeable. If you don't import `InteropActivation`, the bridge code is dead.

## Naming

Family umbrella: **InteropMotion** (folder + design doc). No exported umbrella directive — the umbrella is conceptual.

Per-directive names (verb-suffix-by-trigger-semantic):
- `InteropMotionTrigger` — fires on a DOM event or imperative call.
- `InteropMotionWhile` — runs while a condition is true.
- `InteropMotionOn` — fires on a signal edge.

The `motion-` prefix in both class and attribute names is the load-bearing signal that these directives produce *visual treatment*, not state or logic. They live next to other `interop-*` identity attributes but are immediately distinguishable.

Attribute names (per `project_attribute_naming.md`: `interop-*` = identity/activation, `itx-*` = system configuration):
- `interop-motion-trigger="spin"` — identity; preset name is the value.
- `[interop-motion-while]="…"` — identity.
- `[interop-motion-on]="…"` — identity.
- `itx-motion-disabled` — system configuration (suppress motion regardless of `:disabled`), shared by all.

## Round 1 outcomes

Decisions locked in this doc, ready for implementation prep:

1. **Reduced motion: opinionated, less-motion-not-no-motion.** Each preset declares a low-motion fallback. `aria-busy` carries While's state independently of motion preference.
2. **While content swap: always overlay** (`visibility: hidden` + absolute-positioned overlay). No replace mode. Browser does less work, no layout reflow.
3. **InteropMotionOn is standalone-valid.** Not just a While companion.
4. **Layered-wrapper escape hatch: removed.** Single-element approach is the only shipped path. If a future need surfaces, we'll add it then.
5. **Browser support floor: 2022+ evergreens.** Individual `rotate:`/`translate:`/`scale:` properties are baseline. No legacy fallback path.
6. **InteropActivation `inFlight` signal: next pass.** Don't block Trigger on it; bridge ships when the activation chain grows the signal.

## Round 2 outcomes

Decisions locked, ready for Round 3 implementation:

1. **Substrate is property-agnostic.** The structural CSS module owns state classes, reduced-motion gating, disabled gating, multi-child scoping, and the shared `itx-motion-opacity-pulse` fallback keyframe. It declares no `transform`, no `animation`, no presetspecific rules. Each preset is a self-contained CSS module attached to its preset-attribute selector. (Resolves the first open item from round 1 and the property-agnostic concern in round 2.)
2. **Preset contracts locked.** All eight presets (`spin`, `shake`, `pop`, `pulse`, `dip`, `nudge`, `spinner`, `check`) have exact keyframe specs, durations, easings, and reduced-motion fallbacks declared in the [Preset library](#preset-library). Mechanical to implement; no more design left.
3. **Universal preset attribute.** `itx-motion-preset` is the public, directive-agnostic CSS hook. Trigger inlines its preset in its own attribute value (`interop-motion-trigger="spin"`); the directive mirrors it onto `itx-motion-preset`. While and On accept the preset attribute explicitly, defaulting to `spinner` and `check` respectively.
4. **Multi-child scoping via pure CSS.** `data-itx-motion-target` on a child element redirects preset rules to that child via `:has()` selectors. No directive code involved; substrate routes everything.
5. **Custom mode is the cascade.** No special "custom" preset value. Any preset name with no built-in match is silent (or dev-warns) and lets consumer-authored CSS take over. Built-in presets are just opinionated default token sets attached to specific preset selectors — nothing structurally different from a consumer-authored preset.
6. **Visual treatments beyond motion are accommodated.** Because the substrate doesn't declare any property, a future `tint` or `desaturate` preset is the same shape as `spin` — just authored against `filter:` or `color:` instead of `transform:`. The naming (`InteropMotion…`) covers this comfortably: the directives describe *trigger semantics*, not specifically *motion as the visual axis*. If filter/color presets become common, we'll add them to the registry; if not, no substrate change needed.

## Vetting plan

1. **Round 1.** Family scope, naming, single-element-by-default approach, performance budget, DX principles, reduced-motion stance. ✅
2. **Round 2.** Substrate property-agnostic. Preset CSS contracts locked. Universal preset attribute. Multi-child scoping via `:has()`. Custom mode via cascade. Filter/color extensibility confirmed. ✅
3. **Round 3.** Implement `InteropMotionTrigger` against `demo-example`'s reload button (replacing bespoke code) and one additional consumer (e.g., `pop` on a save button). Validate the shared substrate by reuse, not by writing it for one consumer.
4. **Round 4.** Add `InteropMotionWhile` — first real test of the shared substrate's continuous lifecycle. Confirm no substrate churn was needed.
5. **Round 5.** Add `InteropMotionOn`. Promote `motion.md` to `.agent/components/motion.md` (or split per directive if the doc grows past ~600 lines).
6. **Round 6.** Demo page covering all three composed on a single submit-button (`Trigger` on a secondary control, `While` during save, `On` on success). If anything in the substrate has to bend to make the composition work, that's the signal the substrate is wrong, not the consumer.

## Related

- `feedback_focus_visible.md` — focus-visible semantics
- `project_attribute_naming.md` — `interop-*` vs `itx-*` decision
- `InteropActivation` (service) — bridge surface, especially for `While`
- `css-strategy.md` — structural-vs-theme split, `:where()` zero-specificity rule
