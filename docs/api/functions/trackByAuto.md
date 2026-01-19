[**Interop v0.1.0**](../index.md)

***

# Function: trackByAuto()

> **trackByAuto**\<`T`\>(): `TrackByFunction`\<`T`\>

Defined in: src/lib/utils/track-by.ts:82

Automatically track items by common identity keys when present, else fall back to index.

Common keys checked (in order):
- "id"
- "_id"

If no common keys exist, returns the index.

## Type Parameters

### T

`T` = `any`

## Returns

`TrackByFunction`\<`T`\>

## Example

```ts
const trackBy = trackByAuto<any>();
// Works well for typical domain objects with { id } or { _id } properties
```
