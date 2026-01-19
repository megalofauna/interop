[**Interop v0.1.0**](../index.md)

***

# Function: trackByIndex()

> **trackByIndex**\<`T`\>(): `TrackByFunction`\<`T`\>

Defined in: src/lib/utils/track-by.ts:35

Track items by their index.

Best for static lists or when items do not have a stable unique identifier.

## Type Parameters

### T

`T` = `unknown`

## Returns

`TrackByFunction`\<`T`\>

## Example

```ts
const trackBy = trackByIndex<any>();
// template:
// <ul interop-list [collection]="items" [trackBy]="trackBy"></ul>
```
