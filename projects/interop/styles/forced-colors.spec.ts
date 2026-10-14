import { sheets } from './sheets';

// Forced colors replace every author color with system colors and drop shadows. A component that
// shows its state or shape with a fill or a shadow (a checked box, a selected bar, a pill, a pressed
// button) loses it unless it maps it to system colors. jsdom cannot emulate forced colors, so this
// checks each such stylesheet keeps its rules.

/** Stylesheets that keep a forced-colors block. */
const required = [
	'badge/interop-badge.base.css',
	'button/interop-button.structure.css',
	'checkbox/interop-checkbox.structure.css',
	'field/interop-field.structure.css',
	'radio-group/interop-radio-group.structure.css',
	'select/interop-select.structure.css',
	'steps/interop-steps.structure.css',
	'switch/interop-switch.structure.css',
	'tabs/interop-tabs.structure.css',
	'tags/interop-tags.structure.css',
	'tree/interop-tree.structure.css',
	'styles/cards.css',
	'styles/chips.css',
	'styles/outline.css',
	'styles/segmented.css',
];

/** Every other component and shared stylesheet, and why it needs no block. */
const exempt: Record<string, string> = {
	'badge/interop-badge.structure.css': 'Its forced-colors block is in its base file, with its colors.',
	'code-block/interop-code-block.structure.css': 'Text and a border, which the browser maps.',
	'dialog/interop-dialog.structure.css': 'Its edge is a border, which the browser maps, and the backdrop stays.',
	'icon/interop-icon.structure.css': 'Icons draw in currentColor, which follows the forced text color.',
	'popover/interop-popover.structure.css': 'Its edge is a border, which the browser maps.',
	'scroll-area/interop-scroll-area.structure.css': 'The edge shadows are a hint; the content scrolls the same without them.',
	'tooltip/interop-tooltip.structure.css': 'Text and a border, which the browser maps.',
	'styles/fieldset.css': 'Layout only.',
};

/** Stylesheets that show a selected, checked or pressed state, which forced colors give to Highlight. */
const selected = [
	'button/interop-button.structure.css',
	'checkbox/interop-checkbox.structure.css',
	'radio-group/interop-radio-group.structure.css',
	'select/interop-select.structure.css',
	'steps/interop-steps.structure.css',
	'switch/interop-switch.structure.css',
	'tabs/interop-tabs.structure.css',
	'tree/interop-tree.structure.css',
	'styles/cards.css',
	'styles/chips.css',
	'styles/segmented.css',
];

describe('forced colors', () => {
	it('decides for every component stylesheet whether it needs a forced-colors block', () => {
		const components = Object.keys(sheets).filter(
			(path) =>
				path.endsWith('.structure.css') ||
				['styles/cards.css', 'styles/chips.css', 'styles/segmented.css', 'styles/outline.css', 'styles/fieldset.css'].includes(path),
		);
		expect(components.filter((path) => !required.includes(path) && !(path in exempt))).toEqual([]);
	});

	for (const path of required) {
		it(`keeps a forced-colors block in ${path}`, () => {
			expect(sheets[path]).toMatch(/@media \(forced-colors: active\)/);
		});
	}

	it('maps the selected, checked and pressed states to Highlight', () => {
		expect(selected.filter((path) => !sheets[path].includes('Highlight'))).toEqual([]);
	});
});
