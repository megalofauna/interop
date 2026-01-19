[**Interop v0.1.0**](../index.md)

***

# Function: composeActivation()

> **composeActivation**\<`TPayload`\>(..`handlers`): [`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`TPayload`\>

Defined in: src/lib/utils/activation.ts:253

Compose multiple activation handlers into one, executing them sequentially.

Behavior:
- Each handler runs in order; payload is passed unchanged.
- If a handler returns `false`, composition short-circuits (subsequent handlers are skipped).
- If a handler throws, composition stops and the error is propagated (rejected).
- Async handlers are awaited in sequence.

## Type Parameters

### TPayload

`TPayload` = `void`

## Parameters

### handlers

..[`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`TPayload`\>[]

## Returns

[`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`TPayload`\>

## Example

```ts
const composed = composeActivation(
  createActivationHandler(save, { throttleMs: 500 }),
  (payload) => { toast('Saved'); },
  (payload) => analytics('save', payload),
);

await composed(item);
```
