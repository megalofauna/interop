[**Interop v0.1.0**](../index.md)

***

# Interface: ActivationRegistration\<TPayload\>

Defined in: src/lib/services/activation-manager.service.ts:52

Registration handle containing utilities to manage a registered handler.

## Type Parameters

### TPayload

`TPayload` = `unknown`

## Properties

### instance

> **instance**: [`ManagedActivation`](../type-aliases/ManagedActivation.md)\<`TPayload`\>

Defined in: src/lib/services/activation-manager.service.ts:62

Direct access to the managed activation wrapper instance.
Use with care; prefer `trigger(id, payload)` for most cases.

## Methods

### unregister()

> **unregister**(): `void`

Defined in: src/lib/services/activation-manager.service.ts:56

Unregister the handler from the manager.

#### Returns

`void`
