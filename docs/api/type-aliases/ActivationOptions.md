[**Interop v0.1.0**](../index.md)

***

# Type Alias: ActivationOptions

> **ActivationOptions** = `object`

Defined in: src/lib/utils/activation.ts:12

Activation utilities for managing interactive callbacks with guardrails:
- Debounce: postpone execution until triggers stop for N ms
- Throttle: limit execution to at most once per N ms
- Reentrancy: prevent overlapping async executions (or allow explicitly)
- Once: auto-disable after the first successful activation

These are pure utilities (no Angular DI). Components can opt-in when needed,
and a future service/registry can compose these for cross-component scenarios.

## Properties

### debounceMs?

> `optional` **debounceMs**: `number`

Defined in: src/lib/utils/activation.ts:17

Debounce window in milliseconds.
If set, the handler executes only after triggers stop for this duration.

***

### throttleMs?

> `optional` **throttleMs**: `number`

Defined in: src/lib/utils/activation.ts:27

Throttle window in milliseconds.
If set, the handler executes at most once per this duration.

Notes:
- When both debounce and throttle are specified, debounce will schedule,
  and throttle will suppress executions too close together.

***

### reentrant?

> `optional` **reentrant**: `boolean`

Defined in: src/lib/utils/activation.ts:34

Whether to allow overlapping executions for async handlers.
Default false (prevent reentrancy): if a previous execution is still running,
subsequent triggers are ignored until it completes.

***

### once?

> `optional` **once**: `boolean`

Defined in: src/lib/utils/activation.ts:40

Auto-disable after first successful execution.
Subsequent triggers are ignored unless re-enabled.

***

### onStart()?

> `optional` **onStart**: () => `void`

Defined in: src/lib/utils/activation.ts:46

Lifecycle hooks for observability.
These are best-effort; errors in hooks are swallowed to avoid breaking the handler.

#### Returns

`void`

***

### onEnd()?

> `optional` **onEnd**: (`result`) => `void`

Defined in: src/lib/utils/activation.ts:47

#### Parameters

##### result

`unknown`

#### Returns

`void`

***

### onError()?

> `optional` **onError**: (`error`) => `void`

Defined in: src/lib/utils/activation.ts:48

#### Parameters

##### error

`unknown`

#### Returns

`void`

***

### debug?

> `optional` **debug**: `boolean`

Defined in: src/lib/utils/activation.ts:53

Enable simple debug logging for timing and lock state.
