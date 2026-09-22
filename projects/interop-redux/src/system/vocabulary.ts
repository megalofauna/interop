/**
 * Categories, states, value types, and the lever catalog.
 *
 * A blueprint may only name entries that appear here.
 */

export const CATEGORIES = ['layout', 'shape', 'type', 'paint', 'effect'] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * Stateful tokens are formed by adding `-<state>` to a base token:
 *
 *   base:     `--itx-component-name-background-color`
 *   stateful: `--itx-component-name-background-color-hover`
 *
 * Array order is cascade order.
 */
export const STATES = [
	{ name: 'hover', selector: ':hover' },
	{ name: 'focus-visible', selector: ':focus-visible' },
	{ name: 'active', selector: ':active' },
	{ name: 'disabled', selector: ':disabled' },
] as const;

export type StateName = (typeof STATES)[number]['name'];

export const STATE_NAMES = STATES.map((s) => s.name) as readonly StateName[];

/** The categories that cross with states. */
export const STATEFUL_CATEGORIES: readonly Category[] = ['paint', 'effect'];

export type ValueType =
	| 'length'
	| 'length-pair'
	| 'color'
	| 'number'
	| 'string'
	| 'time'
	| 'shadow'
	| 'enum';

/**
 * The `@property` syntax per value type.
 *
 * `*` is the universal syntax, for values CSS has no grammar for. It permits no initial
 * value and does not animate.
 */
const SYNTAX: Record<Exclude<ValueType, 'enum'>, string> = {
	length: '<length>',
	'length-pair': '<length>+',
	color: '<color>',
	number: '<number>',
	string: '*',
	time: '<time>',
	shadow: '*',
};

export interface PropertyDef {
	readonly category: Category;
	readonly type: ValueType;
	/** Enum members. Also the `@property` syntax alternation. */
	readonly values?: readonly string[];
	/** Declarations emitted where the token is read. `ref` is the full `var(...)` reference. */
	apply(ref: string): string[];
}

/** A lever that maps to one CSS property. */
function direct(category: Category, type: ValueType, css: string): PropertyDef {
	return { category, type, apply: (ref) => [`${css}: ${ref}`] };
}

/** A lever with a fixed set of keyword values. */
function choice(category: Category, css: string, values: readonly string[]): PropertyDef {
	return { category, type: 'enum', values, apply: (ref) => [`${css}: ${ref}`] };
}

/** A lever that expands to something other than one property. */
function composed(category: Category, type: ValueType, apply: (ref: string) => string[]): PropertyDef {
	return { category, type, apply };
}

/**
 * The lever catalog. One lever per CSS property; shorthands are composed where they are read.
 */
export const PROPERTIES = {
	/* ── Layout ── */
	display: choice('layout', 'display', ['flex', 'inline-flex', 'block', 'inline-block', 'grid']),
	'flex-grow': direct('layout', 'number', 'flex-grow'),
	'flex-shrink': direct('layout', 'number', 'flex-shrink'),
	'flex-basis': direct('layout', 'length', 'flex-basis'),
	'align-items': choice('layout', 'align-items', ['center', 'start', 'end', 'stretch', 'baseline']),
	'justify-content': choice('layout', 'justify-content', [
		'center',
		'flex-start',
		'flex-end',
		'space-between',
	]),
	gap: direct('layout', 'length-pair', 'gap'),

	/* ── Shape ── */
	'border-radius': direct('shape', 'length', 'border-radius'),
	// Border width is shape; border color is paint.
	'border-width': direct('shape', 'length', 'border-width'),
	'padding-block': direct('shape', 'length-pair', 'padding-block'),
	'padding-inline': direct('shape', 'length-pair', 'padding-inline'),
	'min-inline-size': direct('shape', 'length', 'min-inline-size'),
	'max-inline-size': direct('shape', 'length', 'max-inline-size'),
	// No `height` lever: a fixed height clips its own text at 200% zoom.
	'min-block-size': direct('shape', 'length', 'min-block-size'),

	/* ── Type ── */
	'font-family': direct('type', 'string', 'font-family'),
	'font-size': direct('type', 'length', 'font-size'),
	'font-weight': direct('type', 'number', 'font-weight'),
	'line-height': direct('type', 'number', 'line-height'),

	/* ── Paint ── */
	'background-color': direct('paint', 'color', 'background-color'),
	'border-color': direct('paint', 'color', 'border-color'),
	'text-color': direct('paint', 'color', 'color'),

	/* ── Effect ── */
	'box-shadow': direct('effect', 'shadow', 'box-shadow'),
	'outline-color': direct('effect', 'color', 'outline-color'),
	'outline-width': direct('effect', 'length', 'outline-width'),
	'outline-offset': direct('effect', 'length', 'outline-offset'),
	'background-image': direct('effect', 'string', 'background-image'),
	'background-blur': composed('effect', 'length', (ref) => [`backdrop-filter: blur(${ref})`]),
} satisfies Record<string, PropertyDef>;

export type PropertyKey = keyof typeof PROPERTIES;

export const PROPERTY_KEYS = Object.keys(PROPERTIES) as PropertyKey[];

/** The `@property` syntax for a lever. An enum becomes a pipe alternation: `flex | inline-flex`. */
export function syntaxFor(def: PropertyDef): string {
	return def.type === 'enum' ? (def.values ?? []).join(' | ') : SYNTAX[def.type];
}

/** `*` tokens cannot carry an initial value and do not animate. */
export function isUniversal(def: PropertyDef): boolean {
	return syntaxFor(def) === '*';
}

export interface TokenParts {
	readonly component: string;
	readonly part?: string | undefined;
	readonly property: string;
	readonly state?: string | undefined;
}

/**
 * `--itx-<component>[-<part>]-<property>[-<state>]`
 *
 * Variant and size are declaration scopes, so they do not appear in token names.
 */
export function tokenName({ component, part, property, state }: TokenParts): string {
	return ['--itx', component, part, property, state].filter(Boolean).join('-');
}

export function isCategory(value: string): value is Category {
	return (CATEGORIES as readonly string[]).includes(value);
}

export function isStateName(value: string): value is StateName {
	return (STATE_NAMES as readonly string[]).includes(value);
}

export function isPropertyKey(value: string): value is PropertyKey {
	return Object.hasOwn(PROPERTIES, value);
}

export function selectorForState(state: StateName): string {
	return STATES.find((s) => s.name === state)!.selector;
}

/** One line per lever, carried in the manifest and the docs tables. */
export const DESCRIPTIONS: Record<PropertyKey, string> = {
	display: 'How the box participates in the surrounding flow.',
	'flex-grow': 'Share of leftover space the box absorbs.',
	'flex-shrink': 'How readily the box gives up space when crowded.',
	'flex-basis': 'Size the box starts from before growing or shrinking.',
	'align-items': 'Cross-axis placement of the contents.',
	'justify-content': 'Main-axis distribution of the contents.',
	gap: 'Space held between the contents.',
	'border-radius': 'Corner rounding.',
	'border-width': 'Thickness of the border. Its colour is a paint lever.',
	'padding-block': 'Inner space above and below the contents.',
	'padding-inline': 'Inner space to the left and right of the contents.',
	'min-inline-size': 'Smallest width the box will take.',
	'max-inline-size': 'Largest width the box will take.',
	'min-block-size': 'Smallest height the box will take. Grows past it rather than clipping.',
	'font-family': 'Typeface. Inherits from the page unless set.',
	'font-size': 'Text size.',
	'font-weight': 'Text weight.',
	'line-height': 'Leading, as a multiple of the font size.',
	'background-color': 'Fill behind the contents.',
	'border-color': 'Color of the border drawn at the border width.',
	'text-color': 'Color of the text, and of anything following currentColor.',
	'box-shadow': 'Shadow cast by the box.',
	'outline-color': 'Color of the outline, normally the focus ring.',
	'outline-width': 'Thickness of the outline. Zero hides it without switching anything off.',
	'outline-offset': 'Gap between the border edge and the outline.',
	'background-image': 'Image or gradient painted over the background color.',
	'background-blur': 'Blur applied to whatever sits behind the box.',
};

export function describe(key: PropertyKey): string {
	return DESCRIPTIONS[key];
}

/** The `@property` initial value for a type. */
export function initialValueFor(def: PropertyDef): string | undefined {
	if (isUniversal(def)) return undefined;
	switch (def.type) {
		case 'enum':
			return def.values?.[0];
		case 'length':
			return '0px';
		case 'length-pair':
			return '0px';
		case 'color':
			return 'transparent';
		case 'number':
			return '0';
		case 'time':
			return '0s';
		default:
			return undefined;
	}
}
