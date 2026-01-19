[**Interop v0.1.0**](../index.md)

***

# Class: ManageAttributesDirective

Defined in: src/lib/directives/manage-attrs.directive.ts:44

ManageAttributesDirective

A policy-aware, mutation-aware directive for applying HTML attributes to a host
element and its subtree via CSS selectors. Backed by AttrsManagerService for
presets, composition, and performance hints.

Design goals:
- Prefer native semantics: configs/presets should be used to rescue non-standard markup.
- Minimal and opt-in: authors provide configs or presets explicitly.
- Immediate children by default: use shallow selectors unless deep targeting is intended.
- Opt-out: honor selectors that avoid nodes with data-interop-managed="false".
- No override by default: do not clobber author attributes unless requested.

Selector:
- `[manageAttrs]` primary input for new usage.

Inputs:
- `manageAttrs`: SetAttrsConfig | null
- `override`: boolean (default false) — when true, existing attributes may be replaced
- `observeSubtree`: boolean | null — if null, auto-derived via service; otherwise enforced
- `debounceMs`: number (default 16) — debounce mutations to batch updates

## Implements

- `OnInit`
- `OnChanges`
- `OnDestroy`

## Constructors

### Constructor

> **new ManageAttributesDirective**(): `ManageAttributesDirective`

#### Returns

`ManageAttributesDirective`

## Properties

### manageAttrs

> **manageAttrs**: [`SetAttrsConfig`](../interfaces/SetAttrsConfig.md) \| `null` = `null`

Defined in: src/lib/directives/manage-attrs.directive.ts:52

Primary config input (new)

***

### override

> **override**: `boolean` = `false`

Defined in: src/lib/directives/manage-attrs.directive.ts:58

When true, existing author-set attributes may be replaced.
Default: false (no override)

***

### observeSubtree

> **observeSubtree**: `boolean` \| `null` = `null`

Defined in: src/lib/directives/manage-attrs.directive.ts:64

If provided, enforces subtree observation. When null, the directive derives
optimal observer options from the provided config.

***

### debounceMs

> **debounceMs**: `number` = `16`

Defined in: src/lib/directives/manage-attrs.directive.ts:69

Debounce for mutation observer; batches updates.

## Methods

### ngOnInit()

> **ngOnInit**(): `void`

Defined in: src/lib/directives/manage-attrs.directive.ts:82

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

### ngOnChanges()

> **ngOnChanges**(`changes`): `void`

Defined in: src/lib/directives/manage-attrs.directive.ts:87

A callback method that is invoked immediately after the
default change detector has checked data-bound properties
if at least one has changed, and before the view and content
children are checked.

#### Parameters

##### changes

The changed properties.

#### Returns

`void`

#### Implementation of

`OnChanges.ngOnChanges`

***

### ngOnDestroy()

> **ngOnDestroy**(): `void`

Defined in: src/lib/directives/manage-attrs.directive.ts:101

A callback method that performs custom clean-up, invoked immediately
before a directive, pipe, or service instance is destroyed.

#### Returns

`void`

#### Implementation of

`OnDestroy.ngOnDestroy`
