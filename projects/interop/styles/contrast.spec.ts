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

// jsdom computes no colors, so this reads the declarations and does the color math itself.
const declarations = new Map<string, string>();
for (const css of [colorCss, codeCss, codeBlockCss, popoverCss, scrollAreaCss, switchCss] as string[]) {
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
