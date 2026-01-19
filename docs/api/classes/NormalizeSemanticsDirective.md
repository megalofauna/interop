[**Interop v0.1.0**](../index.md)

***

# Class: NormalizeSemanticsDirective

Defined in: src/lib/directives/normalize-semantics.directive.ts:35

NormalizeSemanticsDirective

Automatically, and conservatively, normalizes passive list semantics on non-standard markup.
Designed to be auto-attached via hostDirectives on Interop components (e.g., `interop-list`)
to provide "magical by default" behavior, while remaining opt-out and non-invasive.

Policy:
- Native-first: never add roles to native UL/OL/DL or LI; rely on native semantics.
- Minimal semantics: on non-semantic hosts, set role="list"; on non-`li` immediate children, set role="listitem".
- Nested lists: when an explicit marker `data-nested-list` is present, treat it as a list root and normalize its immediate children.
- Opt-out:
  - Host: `data-interop-normalize="false"` disables normalization entirely.
  - Child: `data-interop-managed="false"` skips normalization for that node.
- Idempotence: do not override author-supplied attributes by default.

Performance:
- Observes only `childList` on the host (no subtree) by default.
- Debounced re-application to batch DOM changes.

## Implements

- `OnInit`
- `OnDestroy`

## Constructors

### Constructor

> **new NormalizeSemanticsDirective**(): `NormalizeSemanticsDirective`

#### Returns

`NormalizeSemanticsDirective`

## Properties

### override

> **override**: `boolean` = `false`

Defined in: src/lib/directives/normalize-semantics.directive.ts:44

When true, author-supplied attributes may be replaced.
Default: false — conservative, non-invasive normalization.

***

### normalizeNested

> **normalizeNested**: `boolean` = `true`

Defined in: src/lib/directives/normalize-semantics.directive.ts:50

Control nested normalization behavior.
When true (default), explicit markers `data-nested-list` are normalized as list roots.

***

### debounceMs

> **debounceMs**: `number` = `16`

Defined in: src/lib/directives/normalize-semantics.directive.ts:55

Debounce interval (ms) to batch DOM mutations.

## Methods

### ngOnInit()

> **ngOnInit**(): `void`

Defined in: src/lib/directives/normalize-semantics.directive.ts:63

A callback method that is invoked immediately after the
default change detector has checked the directive's
data-bound properties for the first time,
and before any of the view or content children have been checked.
It is invoked only once when the directive is instantiated.

#### Returns

`void`

#### Implementation of

`OnInit.ngOnInit`

***

### ngOnDestroy()

> **ngOnDestroy**(): `void`

Defined in: src/lib/directives/normalize-semantics.directive.ts:74

A callback method that performs custom clean-up, invoked immediately
before a directive, pipe, or service instance is destroyed.

#### Returns

`void`

#### Implementation of

`OnDestroy.ngOnDestroy`
