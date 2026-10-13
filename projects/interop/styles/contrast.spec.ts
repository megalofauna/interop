// @ts-expect-error The text loader turns the file into a string.
import colorCss from './color.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeCss from './code.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import codeBlockCss from '../code-block/interop-code-block.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import popoverCss from '../popover/interop-popover.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import scrollAreaCss from '../scroll-area/interop-scroll-area.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import switchCss from '../switch/interop-switch.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import buttonCss from '../button/interop-button.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tooltipCss from '../tooltip/interop-tooltip.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import badgeCss from '../badge/interop-badge.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import outlineCss from './outline.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import radioGroupCss from '../radio-group/interop-radio-group.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import cardsCss from './cards.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import stepsCss from '../steps/interop-steps.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import chipsCss from './chips.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tagsCss from '../tags/interop-tags.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import tabsCss from '../tabs/interop-tabs.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import segmentedCss from './segmented.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import checkboxCss from '../checkbox/interop-checkbox.base.css' with { loader: 'text' };
// @ts-expect-error The text loader turns the file into a string.
import selectCss from '../select/interop-select.base.css' with { loader: 'text' };

// jsdom computes no colors, so this reads the declarations and does the color math itself.
const declarations = new Map<string, string>();
for (const css of [colorCss, codeCss, codeBlockCss, popoverCss, scrollAreaCss, switchCss, buttonCss, tooltipCss, badgeCss, outlineCss, radioGroupCss, checkboxCss, segmentedCss, tabsCss, cardsCss, stepsCss, chipsCss, tagsCss, selectCss] as string[]) {
	for (const [, name, value] of css.matchAll(/(--itx-[\w-]+):\s*([^;]+);/g)) declarations.set(name, value.trim());
}

/** A declared value in one scheme, with var() and light-dark() resolved. */
function resolve(value: string, scheme: 0 | 1): string {
	const choice = /^light-dark\((.*)\)$/.exec(value);
	if (choice) {
		let depth = 0;
		const comma = [...choice[1]].findIndex((c) => (depth += c === '(' ? 1 : c === ')' ? -1 : 0) === 0 && c === ',');
		return resolve((scheme === 0 ? choice[1].slice(0, comma) : choice[1].slice(comma + 1)).trim(), scheme);
	}
	const reference = /^var\((--[\w-]+)\)$/.exec(value);
	return reference ? resolve(declarations.get(reference[1])!, scheme) : value;
}

/** An oklch() color as gamma-encoded sRGB channels from 0 to 1, and its alpha. */
function srgb(color: string): { rgb: number[]; alpha: number } {
	const [l, c, h, alpha] = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/.exec(color)!.slice(1).map((v) => (v === undefined ? 1 : Number(v)));
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);
	const lms = [l + 0.3963377774 * a + 0.2158037573 * b, l - 0.1055613458 * a - 0.0638541728 * b, l - 0.0894841775 * a - 1.291485548 * b].map(
		(v) => v ** 3,
	);
	const linear = [
		4.0767416621 * lms[0] - 3.3077115913 * lms[1] + 0.2309699292 * lms[2],
		-1.2684380046 * lms[0] + 2.6097574011 * lms[1] - 0.3413193965 * lms[2],
		-0.0041960863 * lms[0] - 0.7034186147 * lms[1] + 1.707614701 * lms[2],
	].map((v) => Math.min(1, Math.max(0, v)));
	return { rgb: linear.map((v) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)), alpha };
}

/** WCAG relative luminance of gamma-encoded sRGB channels. */
function luminance(rgb: number[]): number {
	const linear = rgb.map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
	return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** A translucent color painted over an opaque one, blended in gamma-encoded sRGB as browsers do. */
function over(top: string, bottom: string): number[] {
	const { rgb, alpha } = srgb(top);
	return srgb(bottom).rgb.map((channel, i) => rgb[i] * alpha + channel * (1 - alpha));
}

const contrast = (one: string | number[], two: string | number[]) => {
	const value = (color: string | number[]) => luminance(typeof color === 'string' ? srgb(color).rgb : color);
	const [high, low] = [value(one), value(two)].sort((x, y) => y - x);
	return (high + 0.05) / (low + 0.05);
};

describe('code colors', () => {
	const roles = [...declarations.keys()].filter((name) => name.startsWith('--itx-code-color-'));

	it('has a color for every role', () => {
		expect(roles.length).toBe(7);
	});

	for (const [scheme, label] of [[0, 'light'], [1, 'dark']] as const) {
		// The code scrolls, so its strongest edge shadow is the darkest (or lightest) background it sits on.
		it(`reaches 4.5:1 on the code block under its scroll shadow in ${label}`, () => {
			const background = over(
				resolve(declarations.get('--itx-scroll-area-shadow-color')!, scheme),
				resolve(declarations.get('--itx-code-block-background-color')!, scheme),
			);
			const failing = roles
				.map((role) => [role, contrast(resolve(declarations.get(role)!, scheme), background)] as const)
				.filter(([, ratio]) => ratio < 4.5)
				.map(([role, ratio]) => `${role} ${ratio.toFixed(2)}`);
			expect(failing).toEqual([]);
		});
	}
});

/** The browser's default page background in each scheme: white, and Chrome's dark #121212. */
const CANVAS = ['oklch(1 0 0)', 'oklch(0.2178 0 0)'] as const;

describe('popover boundary', () => {
	for (const [scheme, label] of [[0, 'light'], [1, 'dark']] as const) {
		// WCAG 1.4.11: the edge that separates a popover from the page needs 3:1.
		it(`has a border of 3:1 against the page in ${label}`, () => {
			const border = resolve(declarations.get('--itx-popover-border-color')!, scheme);
			expect(contrast(border, CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('switch', () => {
	const token = (name: string, scheme: 0 | 1) => resolve(declarations.get(`--itx-switch-${name}`)!, scheme);

	for (const [scheme, label] of [[0, 'light'], [1, 'dark']] as const) {
		// WCAG 1.4.11: the track's edge against the page, and the thumb against the track, in every state.
		for (const state of ['', '-hover']) {
			it(`has an off${state} track border of 3:1 against the page in ${label}`, () => {
				expect(contrast(token(`track-border-color${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has an off thumb of 3:1 against the off${state} track in ${label}`, () => {
				expect(contrast(token('thumb-background-color', scheme), token(`track-background-color${state}`, scheme))).toBeGreaterThanOrEqual(3);
			});
			it(`has an on${state} track of 3:1 against the page in ${label}`, () => {
				expect(contrast(token(`track-background-color-checked${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has an on thumb of 3:1 against the on${state} track in ${label}`, () => {
				expect(
					contrast(token('thumb-background-color-checked', scheme), token(`track-background-color-checked${state}`, scheme)),
				).toBeGreaterThanOrEqual(3);
			});
		}
	}
});

const SCHEMES = [[0, 'light'], [1, 'dark']] as const;
const token = (name: string, scheme: 0 | 1) => resolve(declarations.get(name)!, scheme);

describe('button text', () => {
	// WCAG 1.4.3. Disabled buttons are exempt, and pressed shares the active fill.
	for (const state of ['', '-hover', '-active', '-focus-visible', '-pressed']) {
		for (const [scheme, label] of SCHEMES) {
			it(`reaches 4.5:1 on its background${state ? ` when ${state.slice(1)}` : ''} in ${label}`, () => {
				const ratio = contrast(token(`--itx-button-color${state}`, scheme), token(`--itx-button-background-color${state}`, scheme));
				expect(ratio).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('tooltip text', () => {
	for (const [scheme, label] of SCHEMES) {
		it(`reaches 4.5:1 on its background in ${label}`, () => {
			expect(contrast(token('--itx-tooltip-color', scheme), token('--itx-tooltip-background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('badge text', () => {
	// The text is contrast-color() of the background, which picks black or white, whichever contrasts more.
	const backgrounds = ['--itx-badge-background-color', ...[...declarations.keys()].filter((name) => name.startsWith('--itx-role-background-'))];
	const best = (background: string) => Math.max(contrast('oklch(0 0 0)', background), contrast('oklch(1 0 0)', background));

	for (const background of backgrounds) {
		for (const [scheme, label] of SCHEMES) {
			it(`reaches 4.5:1 on ${background} in ${label}`, () => {
				expect(best(token(background, scheme))).toBeGreaterThanOrEqual(4.5);
			});
		}
	}
});

describe('focus ring', () => {
	// WCAG 1.4.11. The outline is offset from the control, so it sits on the page.
	for (const [scheme, label] of SCHEMES) {
		it(`reaches 3:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-outline-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('radio', () => {
	const radio = (name: string, scheme: 0 | 1) => token(`--itx-radio-group-${name}`, scheme);

	// WCAG 1.4.11: the circle's edge against the page, and the dot against the checked fill.
	for (const state of ['', '-hover']) {
		for (const [scheme, label] of SCHEMES) {
			it(`has an unchecked${state} border of 3:1 against the page in ${label}`, () => {
				expect(contrast(radio(`circle-border-color${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has a checked${state} fill of 3:1 against the page in ${label}`, () => {
				expect(contrast(radio(`circle-background-color-checked${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has a dot of 3:1 against the checked${state} fill in ${label}`, () => {
				expect(contrast(radio('dot-background-color', scheme), radio(`circle-background-color-checked${state}`, scheme))).toBeGreaterThanOrEqual(3);
			});
		}
	}
});

describe('checkbox', () => {
	const checkbox = (name: string, scheme: 0 | 1) => token(`--itx-checkbox-${name}`, scheme);

	// WCAG 1.4.11: the box's edge against the page, and the mark against the checked fill.
	for (const state of ['', '-hover']) {
		for (const [scheme, label] of SCHEMES) {
			it(`has an unchecked${state} border of 3:1 against the page in ${label}`, () => {
				expect(contrast(checkbox(`box-border-color${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has a checked${state} fill of 3:1 against the page in ${label}`, () => {
				expect(contrast(checkbox(`box-background-color-checked${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has a mark of 3:1 against the checked${state} fill in ${label}`, () => {
				expect(contrast(checkbox('mark-background-color', scheme), checkbox(`box-background-color-checked${state}`, scheme))).toBeGreaterThanOrEqual(3);
			});
		}
	}
});

describe('segmented control', () => {
	const segmented = (name: string, scheme: 0 | 1) => token(`--itx-segmented-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		// WCAG 1.4.3: segment text on the page, and the checked segment's text on the pill.
		it(`has segment text of 4.5:1 against the page in ${label}`, () => {
			for (const state of ['segment-color', 'segment-color-hover']) {
				expect(contrast(segmented(state, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
		it(`has checked text of 4.5:1 against the pill in ${label}`, () => {
			expect(contrast(segmented('segment-color-selected', scheme), segmented('pill-background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the frame and the pill against the page.
		it(`has a frame and a pill of 3:1 against the page in ${label}`, () => {
			expect(contrast(segmented('frame-border-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			expect(contrast(segmented('pill-background-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('tabs', () => {
	const tabs = (name: string, scheme: 0 | 1) => token(`--itx-tabs-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has tab text of 4.5:1 against the page at rest, on hover and selected in ${label}`, () => {
			for (const state of ['tab-color', 'tab-color-hover', 'tab-color-selected']) {
				expect(contrast(tabs(state, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
		// WCAG 1.4.11: the bar carries the selection.
		it(`has a selected bar of 3:1 against the page in ${label}`, () => {
			expect(contrast(tabs('indicator-background-color-selected', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('cards', () => {
	// WCAG 1.4.11: the checked card's border marks the choice alongside the input's own mark.
	for (const [scheme, label] of SCHEMES) {
		it(`has a checked border of 3:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-cards-card-border-color-checked', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('step indicator', () => {
	const steps = (name: string, scheme: 0 | 1) => token(`--itx-steps-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has step text of 4.5:1 against the page in ${label}`, () => {
			for (const state of ['color', 'color-current']) expect(contrast(steps(state, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the ring, the current disc and the completed disc tell the steps apart.
		it(`has indicators of 3:1 against the page in ${label}`, () => {
			for (const state of ['indicator-border-color', 'indicator-background-color-current', 'indicator-color-completed']) {
				expect(contrast(steps(state, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			}
		});
		it(`has a current number of 4.5:1 on its disc in ${label}`, () => {
			expect(contrast(steps('indicator-color-current', scheme), steps('indicator-background-color-current', scheme))).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('chips', () => {
	const chips = (name: string, scheme: 0 | 1) => token(`--itx-chips-chip-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has chip text of 4.5:1 against the page, and checked text of 4.5:1 on its fill, in ${label}`, () => {
			expect(contrast(chips('color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			for (const fill of ['background-color-checked', 'background-color-checked-hover']) {
				expect(contrast(chips('color-checked', scheme), chips(fill, scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});
		// WCAG 1.4.11: the pill's edge, and the checked fill, against the page.
		it(`has a border and a checked fill of 3:1 against the page in ${label}`, () => {
			for (const name of ['border-color', 'border-color-hover', 'background-color-checked']) {
				expect(contrast(chips(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			}
		});
	}
});

describe('tags', () => {
	for (const [scheme, label] of SCHEMES) {
		it(`has tag text of 4.5:1 on the tag and on a hovered remove button in ${label}`, () => {
			for (const background of ['--itx-tags-tag-background-color', '--itx-tags-button-background-color-hover']) {
				expect(contrast(token('--itx-tags-tag-color', scheme), token(background, scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});
	}
});

describe('select', () => {
	const select = (name: string, scheme: 0 | 1) => token(`--itx-select-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has text of 4.5:1 on the field, hovered or not, in ${label}`, () => {
			for (const background of ['background-color', 'background-color-hover']) {
				expect(contrast(select('color', scheme), select(background, scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});
		// WCAG 1.4.11: the field's edge against the page.
		it(`has a border of 3:1 against the page in ${label}`, () => {
			for (const name of ['border-color', 'border-color-hover']) expect(contrast(select(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
		it(`has option text of 4.5:1 on a hovered or focused option in ${label}`, () => {
			expect(contrast(token('--itx-popover-color', scheme), select('option-background-color-hover', scheme))).toBeGreaterThanOrEqual(4.5);
		});
	}
});
