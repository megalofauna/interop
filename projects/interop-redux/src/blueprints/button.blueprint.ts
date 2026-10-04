import type { Blueprint } from '../system/blueprint.ts';

export const button: Blueprint = {
	name: 'button',
	selector: ':where(button[interop-button])',
	themeable: true,
	prerequisites: ['box-sizing: border-box'],
	sizes: ['sm', 'base', 'lg'],
	states: ['hover', 'focus-visible', 'active', 'disabled'],
	cursor: ['cursor'],

	properties: {
		border: ['border-color', 'border-style', 'border-width'],
		layout: [
			'align-items',
			'display',
			'gap',
			'justify-content',
			'max-block-size',
			'max-inline-size',
			'min-block-size',
			'min-inline-size',
		],
		paint: ['background-color', 'text-color'],
		shape: ['border-radius', 'padding-block', 'padding-inline'],
		outline: ['outline-color', 'outline-offset', 'outline-width'],
		type: [
			'font-family',
			'font-size',
			'font-weight',
			'line-height',
			'text-align',
		],
	},

	elements: {
		icon: {
			selector: ' > :where([interop-icon])',
			properties: {
				layout: ['flex-shrink'],
				paint: ['text-color'],
			},
		},
	},
};
