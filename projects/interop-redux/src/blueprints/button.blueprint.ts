/**
 * Button.
 *
 * A component with no children of its own, so it exercises parts but not orchestration.
 */

import type { Blueprint } from '../system/blueprint.ts';

export const button: Blueprint = {
	name: 'button',
	selector: ':where(button)',
	themeable: true,

	levers: {
		layout: ['display', 'align-items', 'justify-content', 'gap'],
		shape: [
			'border-radius',
			'border-width',
			'padding-block',
			'padding-inline',
			'min-block-size',
		],
		type: ['font-family', 'font-size', 'font-weight', 'line-height'],
		paint: ['background-color', 'border-color', 'text-color'],
		effect: ['outline-color', 'outline-width', 'outline-offset'],
		/* >>> In what sense are outline properties classified as "effects"? */
	},

	states: ['hover', 'focus-visible', 'active', 'disabled'],

	parts: {
		icon: {
			selector: ' > :where(svg)',
			levers: {
				layout: ['flex-shrink'],
				paint: ['text-color'],
			},
		},
	},

	variants: {
		attribute: 'itx-variant',
		values: ['primary', 'secondary', 'danger'],
		base: 'primary',
	},

	sizes: {
		attribute: 'itx-size',
		values: ['sm', 'md', 'lg'],
		base: 'md',
	},

	// `border-width` and `outline-width` draw nothing without a style set here.
	// >>> Rewritten: `border-width` and `outline-width` are set in mechanics.
	//
	// The focus ring is a width token over a base of zero.
	// >>> Why mention the focus ring width token above a code unit that doesn't set
	// >>> the focus ring width value? please explain the connection to me; I'm not able to
	// >>> see it yet.
	//
	// >>> Moreover, "mechanics" looks like a hodge-podge of leftover properties
	// >>> that didn't fit neatly into other groupings.
	//
	// >>> I think we can do better.
	// >>> variants should probably be moved out of blueprint. The blueprint provides
	// >>> a baseline button configuration that would apply to any variant version
	// >>> of the Interop button. Variants will be defined separately (essentially themed buttons).

	mechanics: [
		'box-sizing: border-box',
		'border-style: solid',
		'outline-style: solid',
		'cursor: pointer',
		'text-align: center',
	],
};
