[**Interop v0.1.0**](../index.md)

***

# Class: InteropCollection\<T\>

Defined in: src/lib/services/interop-collection.service.ts:28

Signal-based collection class that manages reactive data state
Uses effect() to handle async operations outside of computed functions

## Type Parameters

### T

`T` = `any`

## Constructors

### Constructor

> **new InteropCollection**\<`T`\>(`config`, `destroyRef?`): `InteropCollection`\<`T`\>

Defined in: src/lib/services/interop-collection.service.ts:41

#### Parameters

##### config

[`CollectionConfig`](../interfaces/CollectionConfig.md)\<`T`\>

##### destroyRef?

`DestroyRef`

#### Returns

`InteropCollection`\<`T`\>

## Properties

### items

> `readonly` **items**: `WritableSignal`\<`T`[]\>

Defined in: src/lib/services/interop-collection.service.ts:30

***

### loading

> `readonly` **loading**: `WritableSignal`\<`boolean`\>

Defined in: src/lib/services/interop-collection.service.ts:31

***

### error

> `readonly` **error**: `WritableSignal`\<`any`\>

Defined in: src/lib/services/interop-collection.service.ts:32

***

### isEmpty

> `readonly` **isEmpty**: `Signal`\<`boolean`\>

Defined in: src/lib/services/interop-collection.service.ts:35

***

### count

> `readonly` **count**: `Signal`\<`number`\>

Defined in: src/lib/services/interop-collection.service.ts:36

***

### hasError

> `readonly` **hasError**: `Signal`\<`boolean`\>

Defined in: src/lib/services/interop-collection.service.ts:37

## Methods

### setItems()

> **setItems**(`items`): `void`

Defined in: src/lib/services/interop-collection.service.ts:54

Update the collection with new items

#### Parameters

##### items

`T`[]

#### Returns

`void`

***

### setLoading()

> **setLoading**(`loading`): `void`

Defined in: src/lib/services/interop-collection.service.ts:62

Set loading state

#### Parameters

##### loading

`boolean`

#### Returns

`void`

***

### setError()

> **setError**(`error`): `void`

Defined in: src/lib/services/interop-collection.service.ts:69

Set error state

#### Parameters

##### error

`any`

#### Returns

`void`

***

### clearError()

> **clearError**(): `void`

Defined in: src/lib/services/interop-collection.service.ts:77

Clear error state

#### Returns

`void`
