# Exploration — Invoker Commands in the Stepper

**Status:** paper sketch, no code changed. Forward-looking (see [project_angular_waystation] direction).
**Date:** 2026-07-11.

A peek at replacing an Angular `(click)` binding with a declarative custom command
(`command` / `commandfor`), to gauge how far the pattern can be pushed inside Interop.

---

## Interaction chosen: the Back button

`interop-stepper.html` action bar:

```html
<button type="button" interop-button="protocol grow"
  [disabled]="!canGoBack()" [focusableWhenDisabled]="true"
  (click)="back()">Back</button>
```

Ideal peek: argument-free imperative (`back()`), guard already exists (`back()`
bounds-checks and emits `stepAttempt` on rejection), disabled state is a pure
derived signal. The whole pattern in miniature, nothing more.

## The swap

Before — invocation bound to handler by the Angular template compiler:

```html
<button (click)="back()">Back</button>
```

After — invocation declared in plain HTML; binding moves to the DOM:

```html
<button type="button" command="--stepper-back" commandfor="itx-stepper-1">Back</button>
```

Handler collapses to ONE delegated listener on the coordination root:

```ts
@HostListener('command', ['$event'])
protected onCommand(e: CommandEvent) {
  switch (e.command) {
    case '--stepper-back':   this.back(); break;
    case '--stepper-next':   this.onNextOrFinish(); break;
    case '--stepper-cancel': this.cancel.emit(); break;
  }
}
```

**Key insight — commands invert the event model.** A `click` handler lives on the
button; you reach coordination state by bubbling or injecting a token. A custom
command dispatches the `CommandEvent` *directly onto the `commandfor` target* —
the stepper host itself. Every control just *names* the stepper; the stepper
listens at one well-known place. The stepper IS the natural target.

**Portability payoff (concrete):** today a consumer button in the
`[interop-stepper-actions]` slot must inject `INTEROP_STEPPER_TOKEN` or thread the
`#stepper` template ref to call `back()`. With commands the consumer writes
`<button command="--stepper-back" commandfor="the-id">` — zero Angular on their side.

## The framework-agnostic seam (the part worth keeping)

```ts
// pure platform — no Angular, survives a web-component future untouched
type CommandMap = Record<`--${string}`, (source: HTMLElement, e: CommandEvent) => void>;

export function bindCommands(host: HTMLElement, map: CommandMap): () => void {
  const handler = (e: Event) => {
    const ce = e as CommandEvent;
    map[ce.command as `--${string}`]?.(ce.source as HTMLElement, ce);
  };
  host.addEventListener('command', handler);
  return () => host.removeEventListener('command', handler);
}
```

Angular becomes a one-line adapter over component methods:

```ts
bindCommands(this.host.nativeElement, {
  '--stepper-back':   () => this.back(),
  '--stepper-next':   () => this.onNextOrFinish(),
  '--stepper-cancel': () => this.cancel.emit(),
});
```

`bindCommands` is ~6 lines of pure platform; only the closures know about Angular.
One listener per instance, O(1) dispatch, less code than the current template.

## Scorecard — fit inside this component

- Back → `back()` ✅ clean
- Next/Finish → `onNextOrFinish()` ✅ clean (polymorphism stays in the handler)
- Cancel → `cancel.emit()` ✅ clean
- Menu selection → `onMenuSelect(value)` ❌ it's a `valueChange` off `interop-listbox`,
  not a button activation. Commands model invocation, not value-emission.
- Swipe / scroll-snap ❌ gesture, not invocation.
- `goTo(index)` ⚠️ parametric — no payload; read index off `event.source`
  (`data-step-index`). Works, but where the pattern starts leaking.
- nav-trigger / menu-trigger popovers 🎁 candidates for BUILT-IN `command="toggle-popover"`
  — but that's the popover component's call, not the stepper's.

Ratio confirms the "won't fit much" instinct: 3 action buttons fit; everything
stateful or composite stays in JS. Correct ratio, not a disappointment.

## Two frictions on the record

1. **Soft-disabled collides with native dispatch.** `interop-button` with
   `[focusableWhenDisabled]="true"` renders `aria-disabled="true"` and stays a
   *real, enabled* `<button>` — no native `disabled` attribute. The Invoker
   Commands API suppresses dispatch on the **native** `disabled` attribute, which
   isn't there. So a soft-disabled Back button STILL fires `--stepper-back`. Saving
   grace: `back()` already guards and emits `stepAttempt: "bounds"`, so it degrades
   gracefully (arguably better — consumer still gets the signal). But it's a real
   mismatch between the platform's hard-disabled model and Interop's deliberate
   soft-disabled a11y choice; delegated handlers must keep re-checking guards.

2. **`commandfor` is an IDREF, and IDREFs don't pierce shadow DOM.** Light-DOM
   Angular today (the stepper uses `ViewEncapsulation.None`): flawless. But the
   "consumer points any button at the stepper" superpower relies on shared document
   scope. Under shadow-encapsulated web components, a consumer's light-DOM button
   CANNOT `commandfor` into the stepper's shadow root. This tension lands exactly
   on the axis we're steering toward. See the shadow-DOM section below.

## Is the shadow-DOM wall superable?  ("No thanks, get leaky.")

Yes — three routes, only two of them real:

1. **Don't raise the wall — ship light-DOM custom elements.** Web components do
   NOT require shadow DOM. A custom element that skips `attachShadow` renders into
   light DOM; everything stays same-document and IDREFs (`commandfor`, `for`,
   `aria-controls`, `aria-activedescendant`) just work — exactly like today's
   `ViewEncapsulation.None`. This is the honest "get leaky" answer, and for an
   a11y-first, interop-named library it may be the *right default*: shadow
   encapsulation actively fights the IDREF-based ARIA wiring accessible components
   depend on. Cost: you lose style/DOM encapsulation (global CSS can reach in).

2. **`mode: 'open'` is NOT the escape hatch (common misconception).** Open vs
   closed only governs JS access to `.shadowRoot`. It does **not** make IDREFs or
   selectors cross the boundary. Open shadow DOM still blocks `commandfor`. Don't
   reach for this expecting a leak — it isn't one.

3. **Reference Target — the sanctioned cross-boundary fix (emerging, not baseline).**
   The `referenceTarget` / `shadowrootreferencetarget` proposal (AOM / Open UI)
   lets a shadow host forward an external IDREF to an element inside its shadow
   tree — so a light-DOM `commandfor="stepper"` resolves to an internal target
   while *keeping* encapsulation. Shipping experimentally in Chromium as of early
   2026; not cross-browser baseline. This is the "have both" future, but not yet.

**Strategic read:** shadow DOM buys style/DOM encapsulation but costs declarative
cross-root wiring (commandfor, label/for, aria IDREFs). Light DOM keeps the wiring
but loses encapsulation. Today you can't fully have both without Reference Target.
For Interop specifically, whose identity is platform-native semantics, leaning
light-DOM (or waiting on Reference Target) is defensible — many a11y-first authors
deliberately avoid shadow DOM for precisely this reason.

## Next pass (deferred compute)

When ready for the real design pass — a workflow-sized exploration:
- (a) a shared base/mixin so every coordination component (stepper, dialog,
  listbox, tabs) registers a `CommandMap` the same way;
- (b) how parametric commands read payload off `event.source` without a mini-DSL;
- (c) the shadow-DOM / Reference Target question from friction #2, which probably
  decides the whole shape.
