[**Interop v0.1.0**](../index.md)

***

# Function: trackByField()

> **trackByField**\<`T`\>(`field`): `TrackByFunction`\<`T`\>

Defined in: src/lib/utils/track-by.ts:57

Track items by a specific field on the item object.

The value of the provided field (e.g., "id" or "sku") is used as the identity.
If the field is missing or undefined for a given item, the index is used as a fallback.

## Type Parameters

### T

`T` = `any`

## Parameters

### field

`string` | keyof `T`

## Returns

`TrackByFunction`\<`T`\>

## Examples

```ts
const trackBy = trackByField<{ id: number }>("id");
// template:
// <ul interop-list [collection]="users" [trackBy]="trackBy"></ul>
```

```ts
const trackBy = trackByField<{ sku: string }>("sku");
```
