import { oneLine } from './css-text';
import { sheets } from './sheets';

// The four corner rules in styles/radius.css. Every component radius reads one of them, so a theme's
// --itx-radius-base reaches every corner that is not round by shape.
const HOUSE = 'var(--itx-radius, var(--itx-radius-base))';
const RULES = [
	(value: string) => value === 'var(--itx-radius-full)',
	(value: string) => value === HOUSE,
	(value: string) => value.includes(`${HOUSE} / 2`),
	(value: string) => value.startsWith('max(0px,') && value.includes('--itx-radius'),
];

// Every stylesheet that declares a corner. radius.css defines the scale the rules read, so it is left out.
const files = Object.fromEntries(
	Object.entries(sheets).filter(([path, css]) => path !== 'styles/radius.css' && /border-radius\s*:/.test(css)),
);

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
			expect(values.filter((value) => !follows(value))).toEqual([]);
		});
	}
});
