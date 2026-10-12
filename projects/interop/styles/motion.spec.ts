// @ts-expect-error The text loader turns the file into a string.
import transitionCss from './transition.css' with { loader: 'text' };

// @ts-expect-error The text loader turns the file into a string.
import badgeInteropBadgeBase from '../badge/interop-badge.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import badgeInteropBadgeStructure from '../badge/interop-badge.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonInteropButtonBase from '../button/interop-button.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonInteropButtonStructure from '../button/interop-button.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxInteropCheckboxBase from '../checkbox/interop-checkbox.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxInteropCheckboxStructure from '../checkbox/interop-checkbox.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockInteropCodeBlockBase from '../code-block/interop-code-block.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockInteropCodeBlockStructure from '../code-block/interop-code-block.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import iconInteropIconBase from '../icon/interop-icon.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import iconInteropIconStructure from '../icon/interop-icon.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverInteropPopoverBase from '../popover/interop-popover.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverInteropPopoverStructure from '../popover/interop-popover.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupInteropRadioGroupBase from '../radio-group/interop-radio-group.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupInteropRadioGroupStructure from '../radio-group/interop-radio-group.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import scrollAreaInteropScrollAreaBase from '../scroll-area/interop-scroll-area.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import scrollAreaInteropScrollAreaStructure from '../scroll-area/interop-scroll-area.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesCode from './code.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesColor from './color.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesFieldset from './fieldset.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesOutline from './outline.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesRadius from './radius.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesReset from './reset.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesSegmented from './segmented.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesSpace from './space.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesTypography from './typography.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stylesVisuallyHidden from './visually-hidden.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchInteropSwitchBase from '../switch/interop-switch.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchInteropSwitchStructure from '../switch/interop-switch.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsInteropTabsBase from '../tabs/interop-tabs.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsInteropTabsStructure from '../tabs/interop-tabs.structure.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipInteropTooltipBase from '../tooltip/interop-tooltip.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipInteropTooltipStructure from '../tooltip/interop-tooltip.structure.css' with { loader: 'text' };

// @ts-expect-error The text loader turns the file into a string.
import cardsCss from './cards.css' with { loader: 'text' };

// @ts-expect-error The text loader turns the file into a string.
import stepsBaseCss from '../steps/interop-steps.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsStructureCss from '../steps/interop-steps.structure.css' with { loader: 'text' };

// Every stylesheet in the library, read as text. Add a new one here.
const sheets = {
	'steps/interop-steps.base.css': stepsBaseCss,
	'steps/interop-steps.structure.css': stepsStructureCss,
	'styles/cards.css': cardsCss,
	'badge/interop-badge.base.css': badgeInteropBadgeBase,
	'badge/interop-badge.structure.css': badgeInteropBadgeStructure,
	'button/interop-button.base.css': buttonInteropButtonBase,
	'button/interop-button.structure.css': buttonInteropButtonStructure,
	'checkbox/interop-checkbox.base.css': checkboxInteropCheckboxBase,
	'checkbox/interop-checkbox.structure.css': checkboxInteropCheckboxStructure,
	'code-block/interop-code-block.base.css': codeBlockInteropCodeBlockBase,
	'code-block/interop-code-block.structure.css': codeBlockInteropCodeBlockStructure,
	'icon/interop-icon.base.css': iconInteropIconBase,
	'icon/interop-icon.structure.css': iconInteropIconStructure,
	'popover/interop-popover.base.css': popoverInteropPopoverBase,
	'popover/interop-popover.structure.css': popoverInteropPopoverStructure,
	'radio-group/interop-radio-group.base.css': radioGroupInteropRadioGroupBase,
	'radio-group/interop-radio-group.structure.css': radioGroupInteropRadioGroupStructure,
	'scroll-area/interop-scroll-area.base.css': scrollAreaInteropScrollAreaBase,
	'scroll-area/interop-scroll-area.structure.css': scrollAreaInteropScrollAreaStructure,
	'styles/code.css': stylesCode,
	'styles/color.css': stylesColor,
	'styles/fieldset.css': stylesFieldset,
	'styles/outline.css': stylesOutline,
	'styles/radius.css': stylesRadius,
	'styles/reset.css': stylesReset,
	'styles/segmented.css': stylesSegmented,
	'styles/space.css': stylesSpace,
	'styles/typography.css': stylesTypography,
	'styles/visually-hidden.css': stylesVisuallyHidden,
	'switch/interop-switch.base.css': switchInteropSwitchBase,
	'switch/interop-switch.structure.css': switchInteropSwitchStructure,
	'tabs/interop-tabs.base.css': tabsInteropTabsBase,
	'tabs/interop-tabs.structure.css': tabsInteropTabsStructure,
	'tooltip/interop-tooltip.base.css': tooltipInteropTooltipBase,
	'tooltip/interop-tooltip.structure.css': tooltipInteropTooltipStructure,
} as Record<string, string>;

/** Transition declarations whose duration does not read a shared --itx-transition-duration* token. */
const outliers = (css: string) =>
	[...css.matchAll(/(?:^|[;{\s])(--itx-[\w-]*transition-duration|transition-duration|transition):\s*([^;]+);/g)]
		.map(([, property, value]) => `${property}: ${value.trim()}`)
		.filter((declaration) => !/var\(--itx-[\w-]*transition-duration/.test(declaration) && !/:\s*none$/.test(declaration));

// Reduced motion works by zeroing the shared --itx-transition-duration* tokens. A transition reaches
// it only if its duration reads one of them, directly or through a component token.
describe('reduced motion', () => {
	it('zeroes the shared transition durations under prefers-reduced-motion', () => {
		const reduced = /@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*?)}\s*}/.exec(transitionCss as string)?.[1] ?? '';
		expect(reduced).toMatch(/--itx-transition-duration:\s*0ms/);
	});

	it('rejects a duration written as a number', () => {
		expect(outliers('a { transition-duration: 150ms; } b { transition: color 0.2s; } c { --itx-x-transition-duration: 1s; }')).toHaveLength(3);
		expect(outliers('a { transition-duration: var(--itx-a-transition-duration); --itx-a-transition-duration: var(--itx-transition-duration); }')).toEqual([]);
	});

	for (const [file, css] of Object.entries(sheets)) {
		it(`reads a shared duration for every transition in ${file}`, () => {
			expect(outliers(css)).toEqual([]);
		});
	}
});
