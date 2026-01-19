[**Interop v0.1.0**](../index.md)

***

# Function: trackByFieldThenAutoThenIndex()

> **trackByFieldThenAutoThenIndex**\<`T`\>(`field?`): `TrackByFunction`\<`T`\>

Defined in: src/lib/utils/track-by.ts:108

Compose a pragmatic trackBy strategy:
1) If the specified field exists and is defined, use its value
2) Else, attempt auto keys ("id", "_id")
3) Else, fall back to index

This balanced approach minimizes DOM churn while staying robust
across heterogeneous item shapes.

## Type Parameters

### T

`T` = `any`

## Parameters

### field?

`string` | keyof `T` | `null`

## Returns

`TrackByFunction`\<`T`\>

## Example

```ts
const trackBy = trackByFieldThenAutoThenIndex<{ id: number }>("id");
// Field wins when available; otherwise auto keys; otherwise index.
```
