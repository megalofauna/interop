import { oneLine } from './css-text';
import { sheets } from './sheets';

// jsdom computes no colors, so this reads the declarations and does the color math itself.
const declarations = new Map<string, string>();
for (const css of Object.values(sheets)) {
	// The first declaration of each token is its base value; later ones are size steps and system modes.
	for (const [, name, value] of css.matchAll(/(--itx-[\w-]+):\s*([^;]+);/g))
		if (!declarations.has(name)) declarations.set(name, oneLine(value));
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
	const [l, c, h, alpha] = /^oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)$/
		.exec(color)!
		.slice(1)
		.map((v) => (v === undefined ? 1 : Number(v)));
	const a = c * Math.cos((h * Math.PI) / 180);
	const b = c * Math.sin((h * Math.PI) / 180);
	const lms = [
		l + 0.3963377774 * a + 0.2158037573 * b,
		l - 0.1055613458 * a - 0.0638541728 * b,
		l - 0.0894841775 * a - 1.291485548 * b,
	].map((v) => v ** 3);
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

	for (const [scheme, label] of [
		[0, 'light'],
		[1, 'dark'],
	] as const) {
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
	for (const [scheme, label] of [
		[0, 'light'],
		[1, 'dark'],
	] as const) {
		// WCAG 1.4.11: the edge that separates a popover from the page needs 3:1.
		it(`has a border of 3:1 against the page in ${label}`, () => {
			const border = resolve(declarations.get('--itx-popover-border-color')!, scheme);
			expect(contrast(border, CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('switch', () => {
	const token = (name: string, scheme: 0 | 1) => resolve(declarations.get(`--itx-switch-${name}`)!, scheme);

	for (const [scheme, label] of [
		[0, 'light'],
		[1, 'dark'],
	] as const) {
		// WCAG 1.4.11: the track's edge against the page, and the thumb against the track, in every state.
		for (const state of ['', '-hover']) {
			it(`has an off${state} track border of 3:1 against the page in ${label}`, () => {
				expect(contrast(token(`track-border-color${state}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});
			it(`has an off thumb of 3:1 against the off${state} track in ${label}`, () => {
				expect(contrast(token('thumb-background-color', scheme), token(`track-background-color${state}`, scheme))).toBeGreaterThanOrEqual(
					3,
				);
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

const SCHEMES = [
	[0, 'light'],
	[1, 'dark'],
] as const;
const token = (name: string, scheme: 0 | 1) => resolve(declarations.get(name)!, scheme);

/**
 * A reader for the tokens one rule restates for another component, such as the select setting the
 * field's tokens on itself. The shared map keeps only each token's first declaration, which is the
 * other component's. With no selector, it reads the sheet's first declaration of each token.
 */
function restated(sheet: string, selector?: string) {
	const css = sheets[sheet];
	const start = selector === undefined ? 0 : css.indexOf(`${selector} {`);
	if (start < 0) throw new Error(`No rule ${selector} in ${sheet}`);
	const block = selector === undefined ? css : css.slice(start, css.indexOf('}', start));
	return (name: string, scheme: 0 | 1) => resolve(oneLine(new RegExp(`${name}:\\s*([^;]+);`).exec(block)![1]), scheme);
}

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

describe('button pressed', () => {
	// WCAG 1.4.11: a toggle's state is told apart from rest by its edge, not by the fill alone.
	for (const [scheme, label] of SCHEMES) {
		it(`has an edge of 3:1 against the rest edge and the page in ${label}`, () => {
			const pressed = token('--itx-button-border-color-pressed', scheme);
			expect(contrast(pressed, token('--itx-button-border-color', scheme))).toBeGreaterThanOrEqual(3);
			expect(contrast(pressed, CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
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
	const backgrounds = [
		'--itx-badge-background-color',
		...[...declarations.keys()].filter((name) => name.startsWith('--itx-role-background-')),
	];
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
				expect(
					contrast(radio('dot-background-color', scheme), radio(`circle-background-color-checked${state}`, scheme)),
				).toBeGreaterThanOrEqual(3);
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
				expect(
					contrast(checkbox('mark-background-color', scheme), checkbox(`box-background-color-checked${state}`, scheme)),
				).toBeGreaterThanOrEqual(3);
			});
		}
	}
});

describe('segmented control', () => {
	const segmented = (name: string, scheme: 0 | 1) => token(`--itx-segmented-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		// WCAG 1.4.3: segment text on the channel, and the selected segment's text on the pill.
		it(`has segment text of 4.5:1 against the channel in ${label}`, () => {
			for (const state of ['segment-color', 'segment-color-hover']) {
				expect(contrast(segmented(state, scheme), segmented('frame-background-color', scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});
		it(`has selected text of 4.5:1 against the pill in ${label}`, () => {
			expect(contrast(segmented('segment-color-selected', scheme), segmented('pill-background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the frame against the page, and the pill's edge, which carries the selection, against the channel.
		it(`has a frame of 3:1 against the page, and a pill edge of 3:1 against the channel, in ${label}`, () => {
			expect(contrast(segmented('frame-border-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			expect(contrast(segmented('pill-border-color', scheme), segmented('frame-background-color', scheme))).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('table', () => {
	const table = (name: string, scheme: 0 | 1) => token(`--itx-table-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		// WCAG 1.4.3: cell, header and caption text on the page, and a group header on its band.
		it(`has text of 4.5:1 against the page in ${label}`, () => {
			for (const name of ['color', 'header-color', 'caption-color']) {
				expect(contrast(table(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
		it(`has group header text of 4.5:1 against its band in ${label}`, () => {
			expect(contrast(table('group-color', scheme), table('group-background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('toolbar channel', () => {
	const channel = (scheme: 0 | 1) => token('--itx-toolbar-background-color', scheme);
	const button = (name: string, scheme: 0 | 1) => token(`--itx-button-${name}`, scheme);
	// The button tokens the channel sets on its buttons.
	const channelButton = restated('toolbar/interop-toolbar.base.css', ':where([interop-toolbar~="channel"]) :where([interop-button])');

	for (const [scheme, label] of SCHEMES) {
		// The channel's buttons have no fill at rest, so their text and icons sit on the channel (WCAG 1.4.3),
		// and a pressed button's edge, which takes the text color, does too (WCAG 1.4.11).
		it(`has button text and the pressed edge of 4.5:1 against the channel in ${label}`, () => {
			expect(contrast(button('color', scheme), channel(scheme))).toBeGreaterThanOrEqual(4.5);
		});
		it(`has button text of 4.5:1 against the pressed and held fills in ${label}`, () => {
			expect(contrast(button('color', scheme), channelButton('--itx-button-background-color-pressed', scheme))).toBeGreaterThanOrEqual(4.5);
			expect(contrast(button('color', scheme), button('background-color-active', scheme))).toBeGreaterThanOrEqual(4.5);
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
	}
});

describe('underscore', () => {
	for (const [scheme, label] of SCHEMES) {
		// WCAG 1.4.11: the bar carries the selected tab and the current link.
		it(`has a current bar of 3:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-underscore-bar-background-color-current', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('page nav', () => {
	const pageNav = (name: string, scheme: 0 | 1) => token(`--itx-page-nav-${name}`, scheme);
	// The vertical page nav restates tree tokens for its own tree.
	const vertical = restated('page-nav/interop-page-nav.base.css');

	for (const [scheme, label] of SCHEMES) {
		it(`has vertical links of 4.5:1 against the page at rest and on hover in ${label}`, () => {
			for (const name of ['--itx-tree-color', '--itx-tree-color-hover']) {
				expect(contrast(vertical(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
	}

	for (const [scheme, label] of SCHEMES) {
		it(`has link text of 4.5:1 against the page at rest, on hover and current in ${label}`, () => {
			for (const state of ['link-color', 'link-color-hover', 'link-color-current']) {
				expect(contrast(pageNav(state, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
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
			expect(
				contrast(steps('indicator-color-current', scheme), steps('indicator-background-color-current', scheme)),
			).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('inline code', () => {
	for (const [scheme, label] of SCHEMES) {
		// The chip keeps the text color around it: body text, and every heading.
		it(`keeps body and heading text at 4.5:1 on the chip in ${label}`, () => {
			for (const role of ['', '-h1', '-h2', '-h3', '-h4', '-h5']) {
				expect(contrast(token(`--itx-color${role}`, scheme), token('--itx-code-inline-background-color', scheme))).toBeGreaterThanOrEqual(
					4.5,
				);
			}
		});
	}
});

describe('inline text', () => {
	for (const [scheme, label] of SCHEMES) {
		it(`has links of 4.5:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-link-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
		});
		it(`keeps body and heading text at 4.5:1 on a highlight and on a key in ${label}`, () => {
			for (const fill of ['--itx-mark-background-color', '--itx-kbd-background-color']) {
				for (const role of ['', '-h1', '-h2', '-h3', '-h4', '-h5']) {
					expect(contrast(token(`--itx-color${role}`, scheme), token(fill, scheme))).toBeGreaterThanOrEqual(4.5);
				}
			}
		});
	}
});

describe('type roles', () => {
	for (const [scheme, label] of SCHEMES) {
		it(`keeps every role's text at 4.5:1 against the page in ${label}`, () => {
			for (const role of ['', '-display', '-h1', '-h2', '-h3', '-h4', '-h5', '-caption']) {
				expect(contrast(token(`--itx-color${role}`, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
		// Color carries the hierarchy: headings stand out from body text, and body text from captions.
		it(`ranks headings above body text above captions in ${label}`, () => {
			const against = (name: string) => contrast(token(name, scheme), CANVAS[scheme]);
			for (const role of ['-display', '-h1', '-h2', '-h3', '-h4', '-h5']) {
				expect(against(`--itx-color${role}`)).toBeGreaterThan(against('--itx-color'));
			}
			expect(against('--itx-color')).toBeGreaterThan(against('--itx-color-caption'));
		});
	}
});

describe('tree', () => {
	const tree = (name: string, scheme: 0 | 1) => token(`--itx-tree-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has row text of 4.5:1 against the page and on the hover and current fills in ${label}`, () => {
			for (const background of [CANVAS[scheme], tree('background-color-hover', scheme)])
				expect(contrast(tree('color', scheme), background)).toBeGreaterThanOrEqual(4.5);
			expect(contrast(tree('color-current', scheme), tree('background-color-current', scheme))).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the bar marks the current page beside its fill.
		it(`has a current-page bar of 3:1 against the page and its fill in ${label}`, () => {
			for (const background of [CANVAS[scheme], tree('background-color-current', scheme)])
				expect(contrast(tree('row-border-inline-start-color-current', scheme), background)).toBeGreaterThanOrEqual(3);
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

describe('field', () => {
	const field = (name: string, scheme: 0 | 1) => token(`--itx-field-${name}`, scheme);
	// A read-only field has no fill, so its text sits on the page.
	const fill = (name: string, scheme: 0 | 1) => (field(name, scheme) === 'transparent' ? CANVAS[scheme] : field(name, scheme));

	for (const [scheme, label] of SCHEMES) {
		it(`has text and placeholder of 4.5:1 on the field, hovered or not, in ${label}`, () => {
			for (const background of ['background-color', 'background-color-hover', 'background-color-readonly']) {
				for (const text of ['color', 'placeholder-color'])
					expect(contrast(field(text, scheme), fill(background, scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});
		// WCAG 1.4.11: the field's edge against the page, at rest, hovered and invalid.
		it(`has a border of 3:1 against the page in ${label}`, () => {
			for (const name of ['border-color', 'border-color-hover', 'border-color-invalid'])
				expect(contrast(field(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			for (const name of ['--itx-radio-group-circle-border-color-invalid', '--itx-checkbox-box-border-color-invalid']) {
				expect(contrast(token(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			}
		});
		it(`has hint and error text of 4.5:1 against the page in ${label}`, () => {
			for (const name of ['--itx-hint-color', '--itx-error-color', '--itx-error-summary-link-color']) {
				expect(contrast(token(name, scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(4.5);
			}
		});
	}
});

describe('popover', () => {
	// The fill is translucent, so what the text sits on depends on what is behind it. Measured over the
	// two extremes, white and black; the blur averages what is behind and stays between them.
	const opacity = declarations.get('--itx-popover-background-opacity')!;
	const fill = (scheme: 0 | 1) => token('--itx-popover-background-color', scheme).replace(/\)$/, ` / ${opacity})`);

	for (const [scheme, label] of SCHEMES) {
		it(`has text of 4.5:1 on its fill over white and over black in ${label}`, () => {
			for (const behind of ['oklch(1 0 0)', 'oklch(0 0 0)'])
				expect(contrast(token('--itx-popover-color', scheme), over(fill(scheme), behind))).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('select', () => {
	for (const [scheme, label] of SCHEMES) {
		it(`has option text of 4.5:1 on a hovered and a chosen option in ${label}`, () => {
			for (const name of ['--itx-select-option-background-color-hover', '--itx-select-option-background-color-checked'])
				expect(contrast(token('--itx-popover-color', scheme), token(name, scheme))).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the pill's edge carries the choice, against the list.
		it(`has a chosen option edge of 3:1 against the list in ${label}`, () => {
			expect(
				contrast(token('--itx-select-option-border-color-checked', scheme), token('--itx-popover-background-color', scheme)),
			).toBeGreaterThanOrEqual(3);
		});
	}
});

describe('dialog', () => {
	const dialog = (name: string, scheme: 0 | 1) => token(`--itx-dialog-${name}`, scheme);

	for (const [scheme, label] of SCHEMES) {
		it(`has text of 4.5:1 on the dialog in ${label}`, () => {
			expect(contrast(dialog('color', scheme), dialog('background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
		// WCAG 1.4.11: the dialog's edge against the page dimmed by the backdrop. Its border or its
		// background carries it: the light dialog stands out by its fill, the dark one by its border.
		it(`has an edge of 3:1 against the page under the backdrop in ${label}`, () => {
			const dimmed = over(resolve(declarations.get('--itx-dialog-backdrop-color')!, scheme), CANVAS[scheme]);
			const edges = [contrast(dialog('border-color', scheme), dimmed), contrast(dialog('background-color', scheme), dimmed)];
			expect(Math.max(...edges)).toBeGreaterThanOrEqual(3);
		});
		it(`has palette key hints of 4.5:1 on the dialog in ${label}`, () => {
			expect(contrast(dialog('footer-color', scheme), dialog('background-color', scheme))).toBeGreaterThanOrEqual(4.5);
		});
	}
});

describe('toast', () => {
	// Each itx-color block sets the status edge and icon; the first declaration is the neutral one.
	const accents = [...sheets['toast/interop-toast.base.css'].matchAll(/itx-color="(\w+)"\]\) \{\s*--itx-toast-accent-color:\s*([^;]+);/g)];

	it('has a status color for every itx-color', () => {
		expect(accents.map(([, color]) => color)).toEqual(['success', 'info', 'warning', 'danger']);
	});

	for (const [scheme, label] of SCHEMES) {
		const background = () => token('--itx-toast-background-color', scheme);

		it(`has text of 4.5:1 on the toast in ${label}`, () => {
			expect(contrast(token('--itx-toast-color', scheme), background())).toBeGreaterThanOrEqual(4.5);
		});

		it(`has an edge of 3:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-toast-border-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});

		it(`has status edges and icons of 3:1 against the toast and the page in ${label}`, () => {
			for (const value of [token('--itx-toast-accent-color', scheme), ...accents.map(([, , value]) => resolve(oneLine(value), scheme))]) {
				expect(contrast(value, background())).toBeGreaterThanOrEqual(3);
				expect(contrast(value, CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			}
		});
	}
});

describe('slider and progress', () => {
	for (const [scheme, label] of SCHEMES) {
		for (const component of ['slider', 'progress']) {
			const color = (name: string) => token(`--itx-${component}-${name}`, scheme);

			// WCAG 1.4.11: the track's edge shows the length of the scale, and the fill shows the value.
			it(`has a ${component} track edge and fill of 3:1 against the page in ${label}`, () => {
				expect(contrast(color('track-border-color'), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
				expect(contrast(color('fill-background-color'), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
			});

			it(`has a ${component} fill of 3:1 against its track in ${label}`, () => {
				expect(contrast(color('fill-background-color'), color('track-background-color'))).toBeGreaterThanOrEqual(3);
			});
		}

		// The thumb meets the page, the track and the fill. Its face or its edge carries 3:1 against each.
		it(`has a thumb of 3:1 against the page, the track and the fill in ${label}`, () => {
			const face = token('--itx-slider-thumb-background-color', scheme);
			const edge = token('--itx-slider-thumb-border-color', scheme);
			const surfaces = [CANVAS[scheme], token('--itx-slider-track-background-color', scheme), token('--itx-slider-fill-background-color', scheme)];
			expect(surfaces.filter((surface) => Math.max(contrast(face, surface), contrast(edge, surface)) < 3)).toEqual([]);
		});
	}

	// The two draw one track: the same thickness at every size step, the same colors, edge and shade.
	it('draws the progress track the same as the slider track', () => {
		const declared = (path: string, name: string) =>
			[...sheets[path].matchAll(new RegExp(`--itx-[a-z]+-${name}:\\s*([^;]+);`, 'g'))].map(([, value]) => oneLine(value));
		for (const name of [
			'track-block-size',
			'track-background-color',
			'track-border-width',
			'track-border-color',
			'track-border-radius',
			'track-box-shadow',
			'fill-background-color',
		]) {
			expect(declared('progress/interop-progress.base.css', name)).toEqual(declared('slider/interop-slider.base.css', name));
		}
	});
});

describe('split button choices', () => {
	for (const [scheme, label] of SCHEMES) {
		// The choices are flat on the open fill, and take the button's active fill under the pointer.
		it(`has choice text of 4.5:1 on the open fill and on the hover fill in ${label}`, () => {
			for (const fill of ['--itx-group-open-background-color', '--itx-button-background-color-active']) {
				expect(contrast(token('--itx-button-color', scheme), token(fill, scheme))).toBeGreaterThanOrEqual(4.5);
			}
		});

		it(`has an open edge of 3:1 against the page in ${label}`, () => {
			expect(contrast(token('--itx-group-open-border-color', scheme), CANVAS[scheme])).toBeGreaterThanOrEqual(3);
		});
	}
});
