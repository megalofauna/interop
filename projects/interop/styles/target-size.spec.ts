// @ts-expect-error The text loader turns the file into a string.
import spaceCss from './space.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonCss from '../button/interop-button.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchCss from '../switch/interop-switch.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupCss from '../radio-group/interop-radio-group.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxCss from '../checkbox/interop-checkbox.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import chipsCss from './chips.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsCss from '../tags/interop-tags.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsCss from '../tabs/interop-tabs.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import segmentedCss from './segmented.css' with { loader: 'text' };

// jsdom has no layout, so axe cannot measure targets. This reads every size step's declared height instead.
// A control's input sits inside its label, so the label is the target.
const space = new Map<string, string>();
for (const [, name, value] of (spaceCss as string).matchAll(/(--itx-space-[\w-]+):\s*([^;]+);/g)) space.set(name, value.trim());

/** A declared length in CSS pixels, at the default 16px root font size. */
function pixels(value: string): number {
	const reference = /^var\((--itx-space-[\w-]+)\)$/.exec(value);
	if (reference) return pixels(space.get(reference[1])!);
	const [, number, unit] = /^([\d.]+)(rem|px)$/.exec(value)!;
	return Number(number) * (unit === 'rem' ? 16 : 1);
}

/** Every value the file declares for `name`, one per size step. */
const steps = (css: string, name: string) => [...css.matchAll(new RegExp(`${name}:\\s*([^;]+);`, 'g'))].map(([, value]) => value.trim());

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
	] as const;

	for (const [label, css, name] of targets) {
		it(`keeps the ${label} at 24px or taller at every size`, () => {
			const values = steps(css as string, name);
			expect(values.length).toBeGreaterThan(0);
			expect(values.filter((value) => pixels(value) < 24)).toEqual([]);
		});
	}
});
