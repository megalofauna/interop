[**Interop v0.1.0**](../index.md)

***

# Function: createActivationHandler()

> **createActivationHandler**\<`TPayload`\>(`handler`, `options`): [`ManagedActivation`](../type-aliases/ManagedActivation.md)\<`TPayload`\>

Defined in: src/lib/utils/activation.ts:106

Create a guarded activation handler with debounce/throttle/reentrancy/once semantics.

## Type Parameters

### TPayload

`TPayload` = `void`

## Parameters

### handler

[`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`TPayload`\>

### options

[`ActivationOptions`](../type-aliases/ActivationOptions.md) = `{}`

## Returns

[`ManagedActivation`](../type-aliases/ManagedActivation.md)\<`TPayload`\>

## Examples

```ts
Debounce only
const activate = createActivationHandler(saveItem, { debounceMs: 250 });
button.addEventListener('click', () => activate(item));
```

```ts
Throttle and non-reentrant async
const activate = createActivationHandler(asyncSubmit, { throttleMs: 500, reentrant: false });
```

```ts
Once
const activate = createActivationHandler(trackFirstOpen, { once: true });
```

```ts
Lifecycle hooks
const activate = createActivationHandler(doThing, {
  onStart: () => console.log('start'),
  onEnd: (res) => console.log('done', res),
  onError: (err) => console.error('error', err),
});
```
