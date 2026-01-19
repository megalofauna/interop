[**Interop v0.1.0**](../index.md)

***

# Type Alias: ManagedActivation\<TPayload\>

> **ManagedActivation**\<`TPayload`\> = [`ActivationHandler`](ActivationHandler.md)\<`TPayload`\> & `object`

Defined in: src/lib/utils/activation.ts:63

An augmented activation function with control methods to manage its runtime state.

## Type Declaration

### cancel()

> **cancel**(): `void`

Cancel any scheduled (debounced) execution that hasn't run yet.
Does not affect running executions.

#### Returns

`void`

### disable()

> **disable**(): `void`

Disable the handler (no-op on future triggers).

#### Returns

`void`

### enable()

> **enable**(): `void`

Enable the handler (if it was disabled or consumed by `once`).

#### Returns

`void`

### isEnabled()

> **isEnabled**(): `boolean`

Returns whether the handler is currently enabled.

#### Returns

`boolean`

## Type Parameters

### TPayload

`TPayload` = `void`
