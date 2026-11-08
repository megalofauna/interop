# TODO — helpers bound to elements stop working when a framework re-renders them

**Status:** deferred
**Raised:** 2026-11-08, on the Components index page (`projects/demo/src/app/components/index/`)

## The problem

A `bind*()` helper keeps the elements it was given. When a framework replaces those elements, the
helper stays attached to elements that are no longer on the page, and the new ones have no behavior.

Seen on the Components index: the page calls `bindTooltip()` once, in `afterNextRender()`, for the
three view radios. Angular's hot module replacement re-renders the template on every save, so after
an edit the new radios have no tooltips until the page is reloaded. A probe showed the same thing for
the view switcher's old `bindView()`: after a CSS edit the list was a new element and stayed in list
view.

Hot replacement is development only, and nothing else re-renders those radios today. Any template
that re-creates a bound element, such as `@if` or `@for` with a changed track key, would break the
same way in production.

## What was done

The view switcher no longer uses script. CSS `:has()` matches the checked radio
(`.outer:has(input[name="view"][value="grid"]:checked) .catalog`), so a re-render cannot break it.

## To decide

How tooltips, and bound helpers in general, survive re-renders in a framework:

- the Angular `[interopTooltip]` directive, which is created and destroyed with its element;
- binding again after each render when the bound elements have changed;
- delegated listeners on an element that outlives the re-render (the direction in the custom
  elements note), so nothing holds a reference to an element that can be replaced;
- accepting it for hot replacement only, and documenting that a re-created element needs binding
  again.
