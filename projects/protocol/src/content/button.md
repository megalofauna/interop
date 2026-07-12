---
title: Button
description: InteropButton
order: 2
---
# Button

## Appearance

### Sizing (opt-in)

Interop ships 5 opt-in sizes. The sizing system is invoked by passing a mapped value to the `itx-size` attribute. Interop maps the following values by default: xs, sm, md, lg, xl. 

If you’d prefer to manage your button’s sizing yourself, leave off the attribute. See Creating your own variants.

size
itx-size=size

#### Make it your own

Don’t like Interop’s default sizing scheme? Redefine the values in your CSS to suit your needs.

```css

[interop-button][itx-size="md"] { 
	/* NOTE: itx-size accepts one of a set of mutually-exclusive string values (=) */
	~--itx-button-sizing-multiplier: 3;~
	--itx-button-sizing-multiplier: 4;
}

/* NOTE: If you'd prefer to opt out of the sizing multiplication system all together and go your own way, set the multiplier to `1`

Interop's base styles are defined with zero specificity to allow  users to easily redefine any style Interop ships globally (or on any subtree).
*/

[interop-button][itx-size] { 
	--itx-button-sizing-multiplier: 1;
}

```

### Radius (opt-in)
none, nominal, sm, md, lg, full 

Interop maps 6 opt-in border radii, invoked via `itx-radius`. If you’d prefer to manage your button’s border radii yourself, just leave off the attribute. See Creating your own variants.


radiusName
itx-radius=radiusName

### Variants

Interop provides a few button variants out of the box. These are intended for general use, but also as examples of how Interop’s theming system works. 

#### Every button is any button

Interop button variants are collections of CSS custom properties grouped under a name of your choosing. Nothing more, nothing less. 

Here is the bog-standard Interop button.

```html
<button interop-button>Label</button>
```


## Activation
### onActivate,activationId,etc
### Activation Options
#### Debounce
#### Throttle
#### Once
