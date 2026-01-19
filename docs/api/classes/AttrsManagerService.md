[**Interop v0.1.0**](../index.md)

***

# Class: AttrsManagerService

Defined in: src/lib/services/attrs-manager.service.ts:24

Centralized manager for attribute presets, composition helpers, and policy-aware application.

Goals:
- Prefer native semantics: presets are for rescue scenarios on non-standard elements.
- Minimal and opt-in: authors choose when to apply presets.
- Immediate children by default: avoid deep application except when explicitly marked.
- Opt-out support: skip nodes with data-interop-managed="false".
- No override by default: do not clobber author-specified attributes unless requested.

## Constructors

### Constructor

> **new AttrsManagerService**(): `AttrsManagerService`

#### Returns

`AttrsManagerService`

## Properties

### Presets

> `readonly` **Presets**: `Readonly`\<`Record`\<[`PresetKey`](../type-aliases/PresetKey.md), [`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)\>\>

Defined in: src/lib/services/attrs-manager.service.ts:31

Presets for common semantic conformity scenarios.
Authors should bind these via a directive or programmatic application.

Do not apply list presets to native UL/OL/LI — prefer native semantics.

## Methods

### merge()

> **merge**(..`configs`): [`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

Defined in: src/lib/services/attrs-manager.service.ts:59

Merge multiple configs. Later configs win on collisions.

#### Parameters

##### configs

..([`SetAttrsConfig`](../interfaces/SetAttrsConfig.md) \| `null` \| `undefined`)[]

#### Returns

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

***

### withOptOut()

> **withOptOut**(`config`, `itemSelectors`): [`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

Defined in: src/lib/services/attrs-manager.service.ts:76

Constrain broad item selectors to skip nodes opted out via data-interop-managed="false".
By default, rewrites ":host > *" to exclude opted-out nodes.

#### Parameters

##### config

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

##### itemSelectors

`string`[] = `..`

#### Returns

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

***

### noOverride()

> **noOverride**(`host`, `config`): [`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

Defined in: src/lib/services/attrs-manager.service.ts:105

Prune attributes for targets that already define them to avoid overriding author values.
Returns a filtered config safe to apply.

#### Parameters

##### host

`Element`

##### config

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

#### Returns

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

***

### deriveObserverOptions()

> **deriveObserverOptions**(`config`): `object`

Defined in: src/lib/services/attrs-manager.service.ts:136

Decide whether subtree observation is needed based on selectors used.
Use to configure MutationObserver efficiently.

#### Parameters

##### config

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

#### Returns

`object`

##### childList

> **childList**: `boolean`

##### subtree

> **subtree**: `boolean`

***

### hasDeepSelectors()

> **hasDeepSelectors**(`config`): `boolean`

Defined in: src/lib/services/attrs-manager.service.ts:155

Detect whether a config contains any deep selectors (beyond direct children).

#### Parameters

##### config

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md)

#### Returns

`boolean`

***

### applyConfig()

> **applyConfig**(`renderer`, `host`, `config`, `options`): `void`

Defined in: src/lib/services/attrs-manager.service.ts:170

Apply a config to the host element's subtree using the provided Renderer2.
Policy:
- If override is false, existing author attributes will not be replaced.
- Attributes are normalized to strings; boolean becomes "true"/"false".
- Invalid selectors are ignored.

#### Parameters

##### renderer

`Renderer2`

##### host

`Element`

##### config

[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md) | `null` | `undefined`

##### options

###### override?

`boolean`

#### Returns

`void`
