[**Interop v0.1.0**](../index.md)

***

# Class: InteropList\<T\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:43

## Type Parameters

### T

`T` = `any`

## Constructors

### Constructor

> **new InteropList**\<`T`\>(): `InteropList`\<`T`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:124

#### Returns

`InteropList`\<`T`\>

## Properties

### trackBy

> **trackBy**: `InputSignal`\<`TrackByFunction`\<`T`\> \| `"auto"` \| `"index"`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:70

Determines how list items are tracked for change detection and DOM updates.

Modes:
- "auto" (default): if an item is an object, uses common id keys ("id" or "_id"); otherwise falls back to index
- "index": always uses the item index; useful for stable lists or when no unique id exists
- function: a custom TrackByFunction<T> provided by the author

Notes:
- For best performance with dynamic lists, prefer a stable unique id over index.
- When combined with `trackByField`, the field value is used first; if absent, falls back per mode.

#### Examples

```ts
<ul interop-list [collection]="items" [trackBy]="'index'"></ul>
```

```ts
<ul interop-list [collection]="items" [trackBy]="(i, item) => item.sku"></ul>
```

***

### trackByField

> **trackByField**: `InputSignal`\<keyof `T` \| `null`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:87

Field name to use for tracking item identity when available.
If provided, the value of this field on the item is used as the track key.
If the field is missing or undefined on an item, tracking falls back to `trackBy` mode.

#### Examples

```ts
<ul interop-list [collection]="users" [trackByField]="'id'"></ul>
```

```ts
<ul interop-list [collection]="products" [trackByField]="'sku'"></ul>
```

***

### collection

> **collection**: `InputSignal`\<[`InteropCollectionInput`](../type-aliases/InteropCollectionInput.md)\<`T`\> \| `undefined`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:89

***

### listItemTemplate

> **listItemTemplate**: `InputSignal`\<`TemplateRef`\<`any`\> \| `undefined`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:104

Optional template for rendering each list item.
Receives the `$implicit` item and its `index`.

#### Example

```html
<ng-template #item let-item let-i="index">
  <li>{{ i + 1 }}. {{ item.name }}</li>
</ng-template>

<ul interop-list [collection]="users" [listItemTemplate]="item"></ul>
```

***

### attrsPreset

> **attrsPreset**: `InputSignal`\<[`PresetKey`](../type-aliases/PresetKey.md) \| `null`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:110

Optional preset key to apply semantic conformity attributes via ManageAttributesDirective.
When provided, the corresponding preset config will be supplied to the host directive's `manageAttrs` input.

***

### attrsPresetResolved

> **attrsPresetResolved**: `Signal`\<[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md) \| `null`\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:113

***

### items

> **items**: `Signal`\<`T`[]\>

Defined in: src/lib/components/interop-list/interop-list.component.ts:122

## Methods

### trackByFn()

> **trackByFn**(`index`, `item`): `any`

Defined in: src/lib/components/interop-list/interop-list.component.ts:214

Internal resolver for Angular's `trackBy` to optimize DOM updates.

Precedence:
1. Explicit `"index"` mode returns the item index.
2. `trackByField` when set uses the specified field value from the item, if defined.
3. `"auto"` mode attempts common id keys (`id`, `_id`), then falls back to index.
4. Custom `TrackByFunction<T>` when provided.

This strategy minimizes DOM churn while preserving intuitive defaults.

#### Parameters

##### index

`number`

##### item

`T`

#### Returns

`any`

***

### getItemText()

> **getItemText**(`item`): `string`

Defined in: src/lib/components/interop-list/interop-list.component.ts:228

#### Parameters

##### item

`T`

#### Returns

`string`
