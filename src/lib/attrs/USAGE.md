# Usage guide for attribute presets and helpers

This guide shows how to use the preset registry and helper utilities with the `ManageAttributesDirective` (backed by `AttrsManagerService`) to deliver:
- ad hoc attributes via CSS selectors
- optional, minimal semantic conformity for non-standard elements

Key ideas
- Prefer native semantics: do not use list presets for native `ul/ol/li`.
- Opt-in: presets are optional rescue kits for non-semantic markup.
- Opt-out: any node with `data-interop-managed="false"` is skipped by item selectors in the provided presets.
- No override by default: authors control final attribute values; you can use `noOverride(...)` to prune attributes that already exist.

Imports
```/dev/null/imports.ts#L1-12
import { Presets } from 'src/lib/attrs/presets';
import { merge, withOptOut, noOverride, deriveObserverOptions } from 'src/lib/attrs/helpers';

// The ManageAttributesDirective is applied in templates, e.g.:
// <div [manageAttrs]="..."></div>
```

Passive non-semantic list
- Apply minimal list semantics to a non-semantic container and its immediate children.

```/dev/null/examples.html#L1-12
<interop-list
  [manageAttrs]="Presets.ListPassive"
>
  <div>Alpha</div>
  <div>Beta</div>
  <div data-interop-managed="false">Excluded</div>
</interop-list>
```

Passive list with accessible name via aria-labelledby
- Provide the label ID explicitly; presets never invent values.

```/dev/null/examples.html#L14-33
<h2 id="myListHeading">Fruits</h2>

<interop-list
  [manageAttrs]="merge(
    Presets.ListPassiveWithLabelledBy,
    { ':host': { 'aria-labelledby': 'myListHeading' } }
  )"
>
  <div>Apple</div>
  <div>Banana</div>
</interop-list>
```

Nested passive lists with explicit marker
- Mark nested roots with `data-nested-list` to apply nested list semantics only where intended.

```/dev/null/examples.html#L35-56
<div [setAttrs]="Presets.ListNestedPassive">
  <span>Item 1</span>

  <div data-nested-list>
    <span>Nested A</span>
    <span>Nested B</span>
  </div>

  <div>Item 2</div>
</div>
```

Blend a preset with ad hoc attributes
- Combine presets with one-off selectors for fine-grained control.

```/dev/null/examples.html#L58-77
<interop-list
  [manageAttrs]="merge(
    Presets.ListPassive,
    { ':host > .selected': { 'aria-selected': 'true' } },
    { ':host': { 'data-testid': 'my-list' } }
  )"
>
  <div class="selected">Chosen</div>
  <div>Other</div>
</interop-list>
```

Ensure opt-out on generic item selectors
- Constrain broad selectors like `:host > *` to skip nodes with `data-interop-managed="false"`.

```/dev/null/examples.ts#L1-22
import { Presets } from 'src/lib/attrs/presets';
import { withOptOut } from 'src/lib/attrs/helpers';

// In a component class (TypeScript):
const config = withOptOut(Presets.ListPassive);

// In template:
// <interop-list [manageAttrs]="config"> ... </interop-list>
```

Avoid overriding author-set attributes
- Prune attributes for targets that already have those attributes.

```/dev/null/examples.ts#L24-52
import { noOverride } from 'src/lib/attrs/helpers';
import { Presets } from 'src/lib/attrs/presets';

// In your component class:
export class MyComponent {
  // Reference to the host element (e.g., via ElementRef in Angular)
  hostEl!: Element;

  get safeConfig() {
    return noOverride(this.hostEl, Presets.ListPassiveWithLabelledBy);
  }
}
```

Scope mutation observation for performance
- Derive whether subtree observation is necessary based on selectors used.

```/dev/null/examples.ts#L54-86
import { deriveObserverOptions } from 'src/lib/attrs/helpers';
import { Presets } from 'src/lib/attrs/presets';

// Example: if only ":host" and ":host > ..." selectors are present,
// subtree can be disabled for better performance.
const observerOptions = deriveObserverOptions(Presets.ListPassive);
// { childList: true, subtree: false }

// If deep selectors like ":host [data-nested-list]" are present,
// subtree will be true.
const nestedObserverOptions = deriveObserverOptions(Presets.ListNestedPassive);
// { childList: true, subtree: true }
```

Author guidance and guardrails
- Prefer native HTML:
  - Do not apply presets to `ul/ol/li`.
  - Do not set interactive roles (e.g., listbox) unless you also implement full keyboard and focus management.
- Naming:
  - Provide your own values for `aria-label` or `aria-labelledby`. Presets only expose the keys.
- Opt-out:
  - Use `data-interop-managed="false"` on any element you do not want the preset to affect.
- Immediate children:
  - Presets target immediate children by default (`:host > ...`) to avoid mislabeling deep descendants.
- Ad hoc attributes:
  - Combine presets with ad hoc selector configs via `merge(...)` for case-specific needs.

Troubleshooting
- Selector not matching:
  - Ensure selectors are scoped correctly relative to the host element. Use `:host` for the component root, and `:host > ...` for immediate children.
- Attributes not set:
  - If you used `noOverride(...)`, check whether targets already have the attributes; the helper will intentionally prune them.
- Performance concerns:
  - Favor presets with shallow selectors and avoid unnecessary subtree observation when possible.
