/**
 * Badge.
 *
 * An attribute that decorates any element with a count or a dot. The indicator is a child,
 * anchored to the host's top-right corner. The host sets no layout, so it can share an element
 * with another component.
 */

import type { Blueprint } from '../system/blueprint.ts';

export const badge: Blueprint = {
	name: 'badge',
	selector: ':where([interop-badge])',
	themeable: true,
	// `anchor-scope` limits the name to this host, so every badge can use the same one.
	prerequisites: ['anchor-name: --itx-badge', 'anchor-scope: --itx-badge'],

	properties: {},

	elements: {
		indicator: {
			selector: ' > :where([interop-badge-indicator])',
			// Fixed positioning escapes every overflow the host sits in. `position-area` puts
			// the indicator in the corner cell, and the translate centers it on the corner.
			prerequisites: [
				'position: fixed',
				'position-anchor: --itx-badge',
				'position-area: top right',
				'translate: -50% 50%',
				'box-sizing: border-box',
				'padding-block: 0',
				'white-space: nowrap',
			],
			properties: {
				layout: [
					'display',
					'align-items',
					'justify-content',
					'min-inline-size',
					'min-block-size',
					'margin',
					'z-index',
				],
				shape: ['border-radius', 'padding-inline'],
				type: ['font-size', 'font-weight', 'line-height'],
				paint: ['background-color', 'text-color'],
			},
		},
	},

	// Top-right is the indicator's own placement, so it needs no modifier.
	modifiers: {
		dot: { selector: '[interop-badge=""]' },
		'top-left': {
			selector: '[itx-badge-position="top-left"]',
			elements: { indicator: ['position-area: top left', 'translate: 50% 50%'] },
		},
		'bottom-right': {
			selector: '[itx-badge-position="bottom-right"]',
			elements: { indicator: ['position-area: bottom right', 'translate: -50% -50%'] },
		},
		'bottom-left': {
			selector: '[itx-badge-position="bottom-left"]',
			elements: { indicator: ['position-area: bottom left', 'translate: 50% -50%'] },
		},
	},
};
