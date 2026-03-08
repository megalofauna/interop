[**Interop v0.1.0**](../index.md)

***

# Class: InteropButton

Defined in: src/lib/components/interop-button/interop-button.ts:74

InteropButton - Enhanced button component with activation guardrails and coordination.

This component provides robust activation management, state handling, and cross-component
coordination while enforcing semantic HTML practices. It must be used on `<button>` elements
to ensure proper accessibility and form integration.

Key features:
- Activation guardrails (debounce, throttle, reentrancy prevention)
- Cross-component coordination via InteropActivation
- Built-in loading and disabled state management
- Template slots for content, icons, and loading indicators
- Semantic conformity presets for edge cases

## Examples

```html
<button interop-button [onActivate]="save">Save</button>
```

```html
<button interop-button
        [onActivate]="submit"
        [activationOptions]="{ throttleMs: 500, reentrant: false }"
        [loading]="submitting">
  Submit Form
</button>
```

```html
<button interop-button activationId="save">Save from Header</button>
<button interop-button activationId="save">Save from Footer</button>
```

## Constructors

### Constructor

> **new InteropButton**(): `InteropButton`

Defined in: src/lib/components/interop-button/interop-button.ts:218

#### Returns

`InteropButton`

## Properties

### onActivate

> **onActivate**: `InputSignal`\<[`ActivationHandler`](../type-aliases/ActivationHandler.md)\<`unknown`\> \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:90

Local activation handler for this button instance.
Use this for simple, component-specific actions.

#### Example

```html
<button interop-button [onActivate]="() => save(item)">Save Item</button>
```

***

### activationId

> **activationId**: `InputSignal`\<`string` \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:102

Global activation ID for cross-component coordination.
When set, this button triggers a handler registered with InteropActivation.
Prefer this for actions that might be triggered from multiple places in the app.

#### Example

```html
<button interop-button activationId="save">Save</button>
```

***

### payload

> **payload**: `InputSignal`\<`unknown`\>

Defined in: src/lib/components/interop-button/interop-button.ts:112

Payload passed to the activation handler when triggered.

#### Example

```html
<button interop-button [onActivate]="save" [payload]="item">Save</button>
```

***

### activationOptions

> **activationOptions**: `InputSignal`\<[`ActivationOptions`](../type-aliases/ActivationOptions.md)\>

Defined in: src/lib/components/interop-button/interop-button.ts:127

Activation options for guardrails such as debounce, throttle, and reentrancy prevention.
Only applied to local `onActivate` handlers; global handlers configure options during registration.

#### Example

```html
<button interop-button
        [onActivate]="save"
        [activationOptions]="{ debounceMs: 250, reentrant: false }">
  Save
</button>
```

***

### loading

> **loading**: `InputSignal`\<`boolean`\>

Defined in: src/lib/components/interop-button/interop-button.ts:135

Whether the button is in a loading state.
When true, the button is automatically disabled and loading content is shown.

***

### disabled

> **disabled**: `InputSignal`\<`boolean`\>

Defined in: src/lib/components/interop-button/interop-button.ts:141

Whether the button is disabled.
Takes precedence over loading state.

***

### type

> **type**: `InputSignal`\<`"button"` \| `"submit"` \| `"reset"`\>

Defined in: src/lib/components/interop-button/interop-button.ts:147

Button type for form integration.
Standard HTML button types: button, submit, reset.

***

### contentTemplate

> **contentTemplate**: `InputSignal`\<`TemplateRef`\<`any`\> \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:165

Template for the main button content.
Receives context: { $implicit: payload, loading: boolean, disabled: boolean }

#### Example

```html
<ng-template #content let-payload let-loading="loading">
  <span *ngIf="!loading">Save {{ payload?.name }}</span>
  <span *ngIf="loading">Saving..</span>
</ng-template>
<button interop-button [contentTemplate]="content" [payload]="item">
</button>
```

***

### iconTemplate

> **iconTemplate**: `InputSignal`\<`TemplateRef`\<`any`\> \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:170

Template for icon content, typically shown before text.

***

### loadingTemplate

> **loadingTemplate**: `InputSignal`\<`TemplateRef`\<`any`\> \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:175

Template for loading indicator, shown when loading=true.

***

### loadingText

> **loadingText**: `InputSignal`\<`string`\>

Defined in: src/lib/components/interop-button/interop-button.ts:180

Text to display when in loading state (alternative to loadingTemplate).

***

### attrsPreset

> **attrsPreset**: `InputSignal`\<[`PresetKey`](../type-aliases/PresetKey.md) \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:189

Optional preset key for semantic conformity attributes.
Rarely needed since this component enforces button[interop-button] selector,
but available for edge cases or custom styling scenarios.

***

### isDisabled

> **isDisabled**: `Signal`\<`boolean`\>

Defined in: src/lib/components/interop-button/interop-button.ts:196

Whether the button should be disabled (loading OR explicitly disabled).

***

### canActivate

> **canActivate**: `Signal`\<`boolean`\>

Defined in: src/lib/components/interop-button/interop-button.ts:201

Whether the button can be activated (not disabled and has a handler).

***

### attrsPresetResolved

> **attrsPresetResolved**: `Signal`\<[`SetAttrsConfig`](../interfaces/SetAttrsConfig.md) \| `null`\>

Defined in: src/lib/components/interop-button/interop-button.ts:209

Resolved preset config for ManageAttributesDirective if needed.

## Methods

### onButtonActivate()

> **onButtonActivate**(`event`): `void`

Defined in: src/lib/components/interop-button/interop-button.ts:273

Handle button activation (click, keyboard, programmatic).
Delegates to local handler or global activation manager based on configuration.

#### Parameters

##### event

`Event`

#### Returns

`void`

***

### getTemplateContext()

> **getTemplateContext**(): `object`

Defined in: src/lib/components/interop-button/interop-button.ts:302

Get template context for content rendering.

#### Returns

`object`

##### $implicit

> **$implicit**: `unknown`

##### loading

> **loading**: `boolean`

##### disabled

> **disabled**: `boolean`
