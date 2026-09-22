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
		layout: ['display', 'align-items', 'justify-content', 'gap', 'text-align'],
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

	// A border box keeps the padding inside the size the consumer asks for. A pointer cursor
	// follows from the element being clickable. Neither is a value anyone tunes.
	//
	// The `border-style` and `outline-style` the width levers need travel with those levers.
	// See `requires` in the lever catalog.
	mechanics: ['box-sizing: border-box', 'cursor: pointer'],
};
