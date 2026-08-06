# Ethos

Interop is built on the premise that the web platform already implements most of
what a component library needs. Dialogs, popovers, disclosure, focus management,
form semantics, and the accessibility tree are browser features. Interop's job is
to reach for them first, and to supply only the coordination, tokens, and
ergonomics that sit around them.

Everything below follows from that one commitment.

## Platform-native

Platform-native means a component's behaviour comes from the browser, and the
library supplies what the browser leaves open.

In shipped code that looks like this:

- `<dialog interop-dialog>` calls native `showModal()`. The top layer, the
  `::backdrop` pseudo-element, and focus trapping are the browser's
  implementation. Interop adds the signal binding, the close reasons, and the
  focus-return policy.
- `[interop-popover-trigger]` sets `popovertarget` and `popovertargetaction`. The
  browser opens and closes the panel. No JavaScript sits in the click path.
- `<progress interop-progress>` is a `<progress>`. `<input type="range"
  interop-slider>` is a range input. Checkbox, radio, toggle, and chip-option are
  each hosted on a real `<label>` with a real `<input>` inside it.
- Collapsed tree branches use `hidden="until-found"`, so browser find-in-page
  reaches text inside a closed branch and opens it.

Native behaviour also tracks the platform. It improves as browsers improve, works
with assistive technology the library has never tested against, and survives
Angular version changes because it was never Angular's to begin with.

## The host element is the component

Interop components attach to standard HTML elements through attribute selectors.
The element you write is the element that ships.

```html
<button interop-button>          <dialog interop-dialog>
<label interop-radio>            <progress interop-progress>
<ul interop-tree>                <input type="range" interop-slider>
<ol interop-step-list>           <fieldset interop-chip-filter>
<li interop-tree-item>           <output interop-slider-value>
```

There is no generated wrapper and no shadow root. Semantics arrive with the
element, so `<fieldset>` groups, `<label>` associates, `<progress>` announces, and
`<button>` handles keyboard activation and form participation, without the library
restating any of it in ARIA.

Two attribute namespaces keep the markup readable. `interop-*` declares identity:
this element is an Interop component. `itx-*` configures the design system:
`itx-size`, `itx-radius`, `itx-variant`. The same size axis means the same thing
on a button, a segmented control, and an input.

```html
<button interop-button="primary" itx-size="md" itx-radius="sm">Save</button>
```

The prevailing pattern elsewhere is a custom element name that renders generated
`div`s, with roles applied back on top. Angular Material's own documentation for
its select component says:

> When possible, prefer a native `<select>` element over MatSelect. The native
> control provides the most accessible experience across the widest range of
> platforms.

That is the incumbent recommending the platform over its own component. Interop
takes that recommendation as the starting point.

## Accessibility as a design input

Accessibility is an input to component design, applied while the API shape is
still being decided. It decides what a component is, and the labelling follows
from that.

The tree is the clearest case. `role="tree"` is a behaviour contract rather than a
label. It promises one tab stop for the entire widget, roving focus, typeahead,
arrow keys that expand and collapse, and a selection model. A navigation sidebar
or a table of contents honours none of that. Applying the role anyway is the
common implementation, and it fails every audit that tests the contract.

So Interop ships two tiers, and the choice is explicit at the call site.

`<ul interop-tree>` is a nested list. Real links, real `<button>` twisties, many
tab stops, `aria-current` on the current link. No roles, and no authored keyboard
model to fight.

`<ul interop-tree="select">` opts into the full treeview: `tree`, `treeitem`, and
`group` roles, roving tabindex, the complete APG keyboard contract, and
`aria-selected`.

Putting a link or a form control inside a select-tier row makes it unreachable for
screen reader users. Interop warns in devMode and points at the other tier.

The same input shows up in smaller places. The `:focus-visible` ring lives in
structural CSS, never as a theme value. A theme can retune the ring's colour,
width, and offset; it has no way to forget to declare it. The ring is a floor the
library guarantees.

This is worth stating because the burden usually lands on the consumer. Deque's
review of Angular Material, ngx-bootstrap, and PrimeNG concluded that these
libraries are not accessible out of the box, and said so plainly: "If you choose
to use it in your project or in your organization, you are responsible for the
accessibility of it." The specifics were concrete. Documented keyboard and
announcement gaps in `mat-select`, `mat-autocomplete`, and `mat-datepicker`. An
ngx-bootstrap datepicker missing enough that a non-sighted user cannot operate it
at all. PrimeNG requiring developers to wire label associations by hand.

## Theming without fighting the cascade

Every selector in Interop's structural CSS is wrapped in `:where()`, so every
library rule computes to specificity `(0,0,0)`.

```css
:where(button[interop-button]) { … }
```

A consumer rule wins on contact, at any level, in any order, with no `!important`
and no `::ng-deep`. Override once, override again a layer down, override a single
instance inline. The cascade behaves the way the cascade is meant to behave.

Structure and values live in separate files. Structural CSS owns layout, states,
and pseudo-elements. The theme file assigns custom properties and nothing else. It
never sets a real CSS property, so a theme has no way to introduce a rule you then
have to out-specify.

Tokens are flat and inheritable, which makes a state a value rather than a
selector:

```css
/* Retune one state, from any ancestor, with no selector to match. */
.sidebar { --itx-pn-link-color-hover: var(--itx-accent-11); }
```

Every state token falls back to its base token, so a theme declares only the
deltas it actually changes.

The contrast is with libraries whose own documentation warns you off. Angular
Material's guide to customizing component styles states that "Angular Material may
change component style specificity at any time, making custom overrides brittle
and prone to breaking," and that "The DOM structure and CSS classes applied for
each component may change at any time, causing custom styles to break." Zero
specificity is a contract Interop holds still, which is what makes overriding safe
to rely on.

## Adopt the platform, then delete the code

Where a platform feature is not yet widely available, Interop ships the supporting
code and the native attributes side by side. Adoption then becomes a deletion.

Anchor positioning is the current example. `InteropPopover` delegates placement to
`INTEROP_POSITION_STRATEGY`, which defaults to a Floating UI implementation, while
the directive already writes `anchor-name` and `position-anchor` inline on the
elements. When CSS anchor positioning reaches baseline, the provider factory swaps
to `CssAnchorPositionStrategy` and the JavaScript strategy becomes a no-op.
`interop-indicator` already ships both paths behind `@supports (anchor-name:
none)`, and the fallback removes itself wherever support exists.

Invoker Commands, `command` and `commandfor`, reached baseline recently and are
now the preferred wiring for small interactions such as closing a dialog. They
replace handler code that existed only to do what the attribute now does.

The direction of travel is the point. Retrofitting the platform onto existing
machinery produces compatibility flags and escape hatches; Angular CDK's move to
the Popover API in v21 required a `usePopover: false` opt-out for applications it
broke. Interop writes the native attributes first, so a release that adopts a
platform feature is a release that removes code.

## Your components, your rules

Complexity is opt-in. The bare `interop-button` attribute gives you presentation
through custom properties with no component import at all. Reactive state
(`disabled`, `loading`) is a second import. Activation guards (throttle, debounce,
reentrance, once) are a third. You pay for the tiers you use.

Content is yours to own. Custom templates are the goal wherever a component
renders content worth controlling, and several components accept them today:
`interop-table` through `itxCell`, `interop-stepper` through `indicatorTemplate`
and `stepListTemplate`, `interop-list` through `listItemTemplate`,
`interop-tooltip` through `interopTooltipContent`, and `interop-tabs` through
`interop-tab-label`. Coverage expands component by component. A uniform
`ng-template` API across the whole library is designed and has not landed yet.

## Documentation

Documentation is part of the product surface, written alongside the component
rather than after it. The standard being aimed at is that reading Interop's
documentation teaches you how to document your own library. That is a long-running
goal rather than a claim about the current state.

## References

- [Select component source, angular/components](https://github.com/angular/components/blob/main/src/material/select/select.md)
- [Customizing component styles, Angular Material](https://v12.material.angular.io/docs-content/guides/customizing-component-styles)
- [Angular Component Libraries and Accessibility, Deque](https://www.deque.com/blog/angular-component-libraries-and-accessibility/)
- [All overlays should use the Popover API, angular/components #28769](https://github.com/angular/components/issues/28769)
