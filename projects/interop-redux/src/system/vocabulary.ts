/**
 * Categories, axes, states, value types, and the lever catalog.
 *
 * A blueprint may only name entries that appear here.
 */

/**
 * Where a lever acts:
 *
 * - `layout` — how the box and its contents are arranged, and the sizes it keeps within.
 * - `shape` — corner rounding and the space inside the box.
 * - `border` — the line around the box.
 * - `outline` — the line outside the border, normally the focus ring. Moves no layout.
 * - `type` — the text inside it.
 * - `paint` — the colors filling the box and its text.
 * - `effect` — what is drawn over or behind the box. Moves no layout.
 * - `cursor` — the pointer over the box. Only a stateful component has it, through the
 *   blueprint's top-level `cursor` field.
 */
export const CATEGORIES = [
	'layout',
	'shape',
	'border',
	'outline',
	'type',
	'paint',
	'effect',
	'cursor',
] as const;
export type Category = (typeof CATEGORIES)[number];

/**
 * The axes a component varies along. Each value becomes a declaration scope
 * selected by the attribute, on the same token names.
 *
 * `source` is where the values are named:
 *
 * - `config` — every value the config names is an exception. The unattributed element takes
 *   the base values.
 * - `blueprint` — the blueprint lists the values, `default` among them. The config gives every
 *   other value its tokens. `default` takes the base values and emits no scope, so setting it
 *   on an element is the same as setting nothing.
 */
export const AXES = [
	{ name: 'variant', attribute: 'itx-variant', configKey: 'variants', source: 'config' },
	{ name: 'size', attribute: 'itx-size', configKey: 'sizes', source: 'blueprint', default: 'base' },
] as const;

export type Axis = (typeof AXES)[number];
export type AxisName = Axis['name'];

/** The base scope, plus one scope per axis. */
export type ScopeName = 'default' | AxisName;

/** Who declares the tokens: the build in `base.css`, the consumer in `theme.css`. */
export type Owner = 'base' | 'theme';

/**
 * Cascade layers, in order. A later layer wins.
 *
 * Scope is the outer layer and owner the inner one, so a theme's default value loses to the
 * base's variant value:
 *
 *   theme variant > base variant > theme default > base default
 *
 * A size beats a variant where both set the same token. Unlayered consumer CSS beats every
 * layer.
 */
export const LAYERS: readonly string[] = [
	'interop.structure',
	...(['default', ...AXES.map((axis) => axis.name)] as const).flatMap((scope) =>
		(['base', 'theme'] as const).map((owner) => layerName(scope, owner)),
	),
];

export function layerName(scope: ScopeName, owner: Owner): string {
	return `interop.${scope}.${owner}`;
}

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

export type ValueType =
	| 'length'
	| 'length-or-none'
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
	// `none` is the normal value of a `max-*` property and is not a `<length>`. Registered as
	// `<length>`, the token would fall back to `0px` and collapse the box.
	'length-or-none': '<length> | none',
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
	/** The lever takes a token per state and is read under the state selectors. */
	readonly stateful: boolean;
	/** Declarations the lever needs to draw at all. Emitted once, with the rule that reads it. */
	readonly requires?: readonly string[];
	/** Declarations emitted where the token is read. `ref` is the full `var(...)` reference. */
	apply(ref: string): string[];
}

interface LeverOptions {
	readonly stateful?: boolean;
	readonly requires?: readonly string[];
}

function options({ stateful = false, requires }: LeverOptions = {}) {
	return { stateful, ...(requires ? { requires } : {}) };
}

/** A lever that maps to one CSS property. */
function direct(category: Category, type: ValueType, css: string, opts?: LeverOptions): PropertyDef {
	return { category, type, ...options(opts), apply: (ref) => [`${css}: ${ref}`] };
}

/** A lever with a fixed set of keyword values. The first is the `@property` initial value. */
function choice(
	category: Category,
	css: string,
	values: readonly string[],
	opts?: LeverOptions,
): PropertyDef {
	return { category, type: 'enum', values, ...options(opts), apply: (ref) => [`${css}: ${ref}`] };
}

/** A lever that expands to something other than one property. */
function composed(
	category: Category,
	type: ValueType,
	apply: (ref: string) => string[],
	opts?: LeverOptions,
): PropertyDef {
	return { category, type, ...options(opts), apply };
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
	'min-inline-size': direct('layout', 'length', 'min-inline-size'),
	'max-inline-size': direct('layout', 'length-or-none', 'max-inline-size'),
	// No `height` lever: a fixed height clips its own text at 200% zoom.
	'min-block-size': direct('layout', 'length', 'min-block-size'),
	'max-block-size': direct('layout', 'length-or-none', 'max-block-size'),

	/* ── Shape ── */
	'border-radius': direct('shape', 'length', 'border-radius'),
	'padding-block': direct('shape', 'length-pair', 'padding-block'),
	'padding-inline': direct('shape', 'length-pair', 'padding-inline'),

	/* ── Border ── */
	// Not stateful: a border that thickens on hover moves everything around it.
	'border-width': direct('border', 'length', 'border-width', { requires: ['border-style: solid'] }),
	'border-style': choice('border', 'border-style', ['solid', 'dashed', 'dotted', 'double', 'none']),
	'border-color': direct('border', 'color', 'border-color', { stateful: true }),

	/* ── Outline ── */
	'outline-width': direct('outline', 'length', 'outline-width', {
		stateful: true,
		requires: ['outline-style: solid'],
	}),
	'outline-offset': direct('outline', 'length', 'outline-offset', { stateful: true }),
	'outline-color': direct('outline', 'color', 'outline-color', { stateful: true }),

	/* ── Type ── */
	'font-family': direct('type', 'string', 'font-family'),
	'font-size': direct('type', 'length', 'font-size'),
	'font-weight': direct('type', 'number', 'font-weight'),
	'line-height': direct('type', 'number', 'line-height'),
	'text-align': choice('type', 'text-align', ['start', 'end', 'center', 'justify']),

	/* ── Paint ── */
	'background-color': direct('paint', 'color', 'background-color', { stateful: true }),
	'text-color': direct('paint', 'color', 'color', { stateful: true }),

	/* ── Effect ── */
	'box-shadow': direct('effect', 'shadow', 'box-shadow', { stateful: true }),
	'background-image': direct('effect', 'string', 'background-image', { stateful: true }),
	'background-blur': composed('effect', 'length', (ref) => [`backdrop-filter: blur(${ref})`], {
		stateful: true,
	}),

	/* ── Cursor ── */
	// Universal, so any cursor value stays open to the consumer.
	cursor: direct('cursor', 'string', 'cursor', { stateful: true }),
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
	readonly element?: string | undefined;
	readonly property: string;
	readonly state?: string | undefined;
}

/**
 * `--itx-<component>[-<element>]-<property>[-<state>]`
 *
 * Variant and size are declaration scopes, so they do not appear in token names.
 */
export function tokenName({ component, element, property, state }: TokenParts): string {
	return ['--itx', component, element, property, state].filter(Boolean).join('-');
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
	'min-inline-size': 'Smallest width the box will take.',
	'max-inline-size': 'Largest width the box will take. `none` for no limit.',
	'min-block-size': 'Smallest height the box will take. Grows past it rather than clipping.',
	'max-block-size': 'Largest height the box will take. `none` for no limit.',
	'border-radius': 'Corner rounding.',
	'padding-block': 'Inner space above and below the contents.',
	'padding-inline': 'Inner space to the left and right of the contents.',
	'border-width': 'Thickness of the border.',
	'border-style': 'How the border line is drawn.',
	'border-color': 'Color of the border drawn at the border width.',
	'outline-width': 'Thickness of the outline. Zero hides it without switching anything off.',
	'outline-offset': 'Gap between the border edge and the outline.',
	'outline-color': 'Color of the outline, normally the focus ring.',
	'font-family': 'Typeface. Inherits from the page unless set.',
	'font-size': 'Text size.',
	'font-weight': 'Text weight.',
	'line-height': 'Leading, as a multiple of the font size.',
	'text-align': 'Alignment of the text within the box.',
	'background-color': 'Fill behind the contents.',
	'text-color': 'Color of the text, and of anything following currentColor.',
	'box-shadow': 'Shadow cast by the box.',
	'background-image': 'Image or gradient painted over the background color.',
	'background-blur': 'Blur applied to whatever sits behind the box.',
	cursor: 'Pointer shown over the box.',
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
		case 'length-or-none':
			return 'none';
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
