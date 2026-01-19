[**Interop v0.1.0**](../index.md)

***

# Class: InteropCollectionService

Defined in: src/lib/services/interop-collection.service.ts:147

Service for creating and managing collections

## Constructors

### Constructor

> **new InteropCollectionService**(): `InteropCollectionService`

#### Returns

`InteropCollectionService`

## Methods

### create()

> **create**\<`T`\>(`config`): [`InteropCollection`](InteropCollection.md)\<`T`\>

Defined in: src/lib/services/interop-collection.service.ts:153

Create a new collection from a configuration

#### Type Parameters

##### T

`T`

#### Parameters

##### config

[`CollectionConfig`](../interfaces/CollectionConfig.md)\<`T`\>

#### Returns

[`InteropCollection`](InteropCollection.md)\<`T`\>

***

### resolve()

> **resolve**\<`T`\>(`input`): [`InteropCollection`](InteropCollection.md)\<`T`\>

Defined in: src/lib/services/interop-collection.service.ts:161

Resolve a CollectionInput into a standardized InteropCollection
This method creates new collections and should not be used in computed functions

#### Type Parameters

##### T

`T`

#### Parameters

##### input

[`InteropCollectionInput`](../type-aliases/InteropCollectionInput.md)\<`T`\>

#### Returns

[`InteropCollection`](InteropCollection.md)\<`T`\>

***

### computedResolve()

> **computedResolve**\<`T`\>(`input`): [`InteropCollection`](InteropCollection.md)\<`T`\> \| `null`

Defined in: src/lib/services/interop-collection.service.ts:191

Create a computed collection resolver that's safe to use in computed functions
Returns null for non-collection inputs to avoid creating collections in computed

#### Type Parameters

##### T

`T`

#### Parameters

##### input

[`InteropCollectionInput`](../type-aliases/InteropCollectionInput.md)\<`T`\> | `undefined`

#### Returns

[`InteropCollection`](InteropCollection.md)\<`T`\> \| `null`
