// @ts-expect-error The text loader turns the file into a string.
import badgeCss from '../badge/interop-badge.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxCss from '../checkbox/interop-checkbox.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupCss from '../radio-group/interop-radio-group.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchCss from '../switch/interop-switch.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsCss from '../tabs/interop-tabs.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import cardsCss from './cards.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsCss from '../steps/interop-steps.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import chipsCss from './chips.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsCss from '../tags/interop-tags.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import segmentedCss from './segmented.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectCss from '../select/interop-select.structure.css' with { loader: 'text' };

// Forced colors replace every background with Canvas. A component that shows its state with a fill
// (a checked box, a selected bar, a pill, a dot) loses that state unless it maps it to system colors.
// jsdom cannot emulate forced colors, so this checks each such stylesheet keeps its rules.
const files = { badgeCss, checkboxCss, radioGroupCss, switchCss, tabsCss, segmentedCss, cardsCss, stepsCss, chipsCss, tagsCss, selectCss } as Record<string, string>;

describe('forced colors', () => {
	for (const [file, css] of Object.entries(files)) {
		it(`keeps a forced-colors block in ${file}`, () => {
			expect(css).toMatch(/@media \(forced-colors: active\)/);
		});
	}

	it('maps the selected and checked states to Highlight', () => {
		for (const css of [checkboxCss, radioGroupCss, switchCss, tabsCss, segmentedCss, cardsCss, stepsCss, chipsCss, selectCss]) expect(css).toContain('Highlight');
	});
});
