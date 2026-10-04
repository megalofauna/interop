/**
 * Visually hidden.
 *
 * No levers, so no base file and no `@property` block.
 */

import type { Blueprint } from '../system/blueprint.ts';

export const visuallyHidden: Blueprint = {
	name: 'visually-hidden',
	selector: ':where([itx-visually-hidden])',
	themeable: false,
	properties: {},

	prerequisites: [
		'position: absolute',
		'inline-size: 1px',
		'block-size: 1px',
		'padding: 0',
		'margin: -1px',
		'border-width: 0',
		'overflow: hidden',
		'clip-path: inset(50%)',
		'white-space: nowrap',
	],
};
