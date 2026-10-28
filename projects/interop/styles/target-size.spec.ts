import { oneLine } from './css-text';
import { sheets } from './sheets';

const spaceCss = sheets['styles/space.css'];
const buttonCss = sheets['button/interop-button.base.css'];
const switchCss = sheets['switch/interop-switch.base.css'];
const radioGroupCss = sheets['radio-group/interop-radio-group.base.css'];
const checkboxCss = sheets['checkbox/interop-checkbox.base.css'];
const chipsCss = sheets['styles/chips.css'];
const tagsCss = sheets['tags/interop-tags.base.css'];
const tabsCss = sheets['tabs/interop-tabs.base.css'];
const segmentedCss = sheets['styles/segmented.css'];
const selectCss = sheets['select/interop-select.base.css'];
const fieldCss = sheets['field/interop-field.base.css'];
const treeCss = sheets['tree/interop-tree.base.css'];
const pageNavCss = sheets['page-nav/interop-page-nav.base.css'];
const sliderCss = sheets['slider/interop-slider.base.css'];
const disclosureCss = sheets['disclosure/interop-disclosure.base.css'];

// jsdom has no layout, so axe cannot measure targets. This reads every size step's declared height instead.
// A control's input sits inside its label, so the label is the target.
const space = new Map<string, string>();
for (const [, name, value] of (spaceCss as string).matchAll(/(--itx-space-[\w-]+):\s*([^;]+);/g)) space.set(name, oneLine(value));

/** A declared length in CSS pixels, at the default 16px root font size. */
function pixels(value: string): number {
	const reference = /^var\((--itx-space-[\w-]+)\)$/.exec(value);
	if (reference) return pixels(space.get(reference[1])!);
	const [, number, unit] = /^([\d.]+)(rem|px)$/.exec(value)!;
	return Number(number) * (unit === 'rem' ? 16 : 1);
}

/** Every value the file declares for `name`, one per size step. */
const steps = (css: string, name: string) => [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, 'g'))].map(([, value]) => oneLine(value));

describe('target size', () => {
	// WCAG 2.5.8: a pointer target is at least 24 × 24 CSS px.
	const targets = [
		['button', buttonCss, '--itx-button-min-block-size'],
		['switch label', switchCss, '--itx-switch-min-block-size'],
		['radio label', radioGroupCss, '--itx-radio-group-label-min-block-size'],
		['segmented control', segmentedCss, '--itx-segmented-block-size'],
		['tab', tabsCss, '--itx-tabs-tab-min-block-size'],
		['chip', chipsCss, '--itx-chips-chip-min-block-size'],
		['tag remove button', tagsCss, '--itx-tags-button-size'],
		['checkbox label', checkboxCss, '--itx-checkbox-min-block-size'],
		['field', fieldCss, '--itx-field-min-block-size'],
		['select option', selectCss, '--itx-select-option-min-block-size'],
		['tree row', treeCss, '--itx-tree-row-min-block-size'],
		['page nav link', pageNavCss, '--itx-page-nav-link-min-block-size'],
		['slider', sliderCss, '--itx-slider-target-size'],
		['disclosure summary', disclosureCss, '--itx-disclosure-summary-min-block-size'],
	] as const;

	for (const [label, css, name] of targets) {
		it(`keeps the ${label} at 24px or taller at every size`, () => {
			const values = steps(css as string, name);
			expect(values.length).toBeGreaterThan(0);
			expect(values.filter((value) => pixels(value) < 24)).toEqual([]);
		});
	}
});
