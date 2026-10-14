import { oneLine } from './css-text';
import { sheets } from './sheets';

const transitionCss = sheets['styles/transition.css'];

/** Transition declarations whose duration does not read a shared --itx-transition-duration* token. */
const outliers = (css: string) =>
	[...css.matchAll(/(?:^|[;{\s])(--itx-[\w-]*transition-duration|transition-duration|transition):\s*([^;]+);/g)]
		.map(([, property, value]) => `${property}: ${oneLine(value)}`)
		.filter((declaration) => !/var\(--itx-[\w-]*transition-duration/.test(declaration) && !/:\s*none$/.test(declaration));

// Reduced motion works by zeroing the shared --itx-transition-duration* tokens. A transition reaches
// it only if its duration reads one of them, directly or through a component token.
describe('reduced motion', () => {
	it('zeroes the shared transition durations under prefers-reduced-motion', () => {
		const reduced = /@media \(prefers-reduced-motion: reduce\)\s*{([\s\S]*?)}\s*}/.exec(transitionCss as string)?.[1] ?? '';
		expect(reduced).toMatch(/--itx-transition-duration:\s*0ms/);
	});

	it('rejects a duration written as a number', () => {
		expect(outliers('a { transition-duration: 150ms; } b { transition: color 0.2s; } c { --itx-x-transition-duration: 1s; }')).toHaveLength(
			3,
		);
		expect(
			outliers('a { transition-duration: var(--itx-a-transition-duration); --itx-a-transition-duration: var(--itx-transition-duration); }'),
		).toEqual([]);
	});

	// transition.css defines the shared durations, so it is where they are not read.
	for (const [file, css] of Object.entries(sheets).filter(([path]) => path !== 'styles/transition.css')) {
		it(`reads a shared duration for every transition in ${file}`, () => {
			expect(outliers(css)).toEqual([]);
		});
	}
});
