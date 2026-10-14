// @ts-expect-error The text loader turns the file into a string.
import badgeCss from '../badge/interop-badge.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonCss from '../button/interop-button.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxCss from '../checkbox/interop-checkbox.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockCss from '../code-block/interop-code-block.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverCss from '../popover/interop-popover.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchCss from '../switch/interop-switch.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipCss from '../tooltip/interop-tooltip.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupCss from '../radio-group/interop-radio-group.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import cardsCss from './cards.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsCss from '../steps/interop-steps.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import chipsCss from './chips.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsCss from '../tags/interop-tags.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsCss from '../tabs/interop-tabs.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import segmentedCss from './segmented.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonStructureCss from '../button/interop-button.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectCss from '../select/interop-select.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectStructureCss from '../select/interop-select.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import dialogCss from '../dialog/interop-dialog.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import fieldCss from '../field/interop-field.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import fieldStructureCss from '../field/interop-field.structure.css' with { loader: 'text' };
import { oneLine } from './css-text';

// The four corner rules in styles/radius.css. Every component radius reads one of them, so a theme's
// --itx-radius-base reaches every corner that is not round by shape.
const HOUSE = 'var(--itx-radius, var(--itx-radius-base))';
const RULES = [
	(value: string) => value === 'var(--itx-radius-full)',
	(value: string) => value === HOUSE,
	(value: string) => value.includes(`${HOUSE} / 2`),
	(value: string) => value.startsWith('max(0px,') && value.includes('--itx-radius'),
];

const files = {
	badgeCss,
	buttonCss,
	checkboxCss,
	codeBlockCss,
	popoverCss,
	switchCss,
	tooltipCss,
	radioGroupCss,
	buttonStructureCss,
	segmentedCss,
	tabsCss,
	cardsCss,
	stepsCss,
	chipsCss,
	tagsCss,
	selectCss,
	selectStructureCss,
	dialogCss,
	fieldCss,
	fieldStructureCss,
} as Record<string, string>;

/** A structure file reading the component's own token, e.g. var(--itx-button-border-radius). */
const readsToken = (value: string) => /^var\(--itx-[\w-]+-border-radius\)$/.test(value);
const follows = (value: string) => readsToken(value) || RULES.some((rule) => rule(value));

describe('corner radius', () => {
	it('rejects a corner that follows no rule', () => {
		expect(['var(--itx-radius-base)', '50%', '4px', 'var(--itx-radius)'].filter(follows)).toEqual([]);
	});

	for (const [file, css] of Object.entries(files)) {
		it(`follows a corner rule everywhere in ${file}`, () => {
			const values = [...css.matchAll(/(?:-border-radius|^\s*border-radius):\s*([^;]+);/gm)].map(([, value]) => oneLine(value));
			expect(values.length).toBeGreaterThan(0);
			expect(values.filter((value) => !follows(value))).toEqual([]);
		});
	}
});
