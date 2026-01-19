[**Interop v0.1.0**](../index.md)

***

# Class: ActivationManagerService

Defined in: src/lib/services/activation-manager.service.ts:69

Service that registers activation handlers by ID and triggers them safely.

## Constructors

### Constructor

> **new ActivationManagerService**(): `ActivationManagerService`

#### Returns

`ActivationManagerService`

## Methods

### register()

> **register**\<`TPayload`\>(`id`, `handler`, `options`): [`ActivationRegistration`](../interfaces/ActivationRegistration.md)\<`TPayload`\>

Defined in: src/lib/services/activation-manager.service.ts:95

Register a new activation handler under a given ID with guardrails and return a disposer.
Prefer this over ad-hoc callbacks to get consistent debounce/throttle/reentrancy/once behavior.
Minimal usage:
- Call `register(id, handler, options)` in initialization.
- Use `trigger(id, payload)` to invoke it.
- Call `unregister()` in teardown.

Returns a registration handle with an `unregister()` function.
If a handler already exists for this ID, it will be replaced.

#### Type Parameters

##### TPayload

`TPayload` = `unknown`

#### Parameters

##### id

`string`

Unique identifier for the handler

##### handler

[`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`TPayload`\>

The activation callback (sync or async)

##### options

[`ActivationOptions`](../type-aliases/ActivationOptions.md) = `{}`

Guardrails such as debounce/throttle/reentrancy/once

#### Returns

[`ActivationRegistration`](../interfaces/ActivationRegistration.md)\<`TPayload`\>

#### Example

```ts
activationManager.register('submit', submitOrder, { throttleMs: 500, reentrant: false });
```

***

### unregister()

> **unregister**(`id`): `void`

Defined in: src/lib/services/activation-manager.service.ts:125

Unregister a handler by ID (no-op if not present).
Use when the handler is no longer needed or on teardown.
Any pending debounced execution is cancelled automatically.

#### Parameters

##### id

`string`

Identifier to remove

#### Returns

`void`

***

### trigger()

> **trigger**\<`TPayload`\>(`id`, `payload`): `void`

Defined in: src/lib/services/activation-manager.service.ts:151

Trigger a registered activation handler by ID with an optional payload.
Safe to call multiple times; guardrails are applied by the registered handler instance.
If the ID is not registered or disabled, this is a no-op.
If the ID is not registered, this is a no-op.

Guardrails (debounce/throttle/reentrancy/once) are applied by the
registered handler instance, not this method.

#### Type Parameters

##### TPayload

`TPayload` = `unknown`

#### Parameters

##### id

`string`

Identifier of the registered handler

##### payload

`TPayload`

Data passed to the handler

#### Returns

`void`

#### Example

```ts
activationManager.trigger('save', item);
activationManager.trigger('toast', { message: 'Saved!' });
```

***

### has()

> **has**(`id`): `boolean`

Defined in: src/lib/services/activation-manager.service.ts:163

Check whether a handler is registered for the given ID.

#### Parameters

##### id

`string`

#### Returns

`boolean`

***

### enable()

> **enable**(`id`): `void`

Defined in: src/lib/services/activation-manager.service.ts:170

Enable a handler by ID if present.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### disable()

> **disable**(`id`): `void`

Defined in: src/lib/services/activation-manager.service.ts:179

Disable a handler by ID if present (future triggers will be ignored).
Any scheduled debounced execution is cancelled.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### cancel()

> **cancel**(`id`): `void`

Defined in: src/lib/services/activation-manager.service.ts:191

Cancel any scheduled (debounced) execution for the handler with the given ID.
Does not affect a currently running handler.

#### Parameters

##### id

`string`

#### Returns

`void`

***

### listIds()

> **listIds**(): `string`[]

Defined in: src/lib/services/activation-manager.service.ts:199

Get a list of all registered IDs. Useful for diagnostics.

#### Returns

`string`[]

***

### clear()

> **clear**(): `void`

Defined in: src/lib/services/activation-manager.service.ts:207

Clear all registered handlers, cancelling any scheduled executions.
Use with care; typically called in teardown or when resetting application state.

#### Returns

`void`
