import { oneLine } from './css-text';
import { sheets } from './sheets';

// Each system preference has one implementation: border.css answers prefers-contrast and
// transition.css answers prefers-reduced-motion, by changing shared tokens every component reads.
// A component that answers one itself drifts from the rest, as seven contrast blocks once did.
const code = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('system preferences', () => {
	it('answers prefers-contrast only in styles/border.css', () => {
		expect(Object.keys(sheets).filter((path) => /@media[^{]*prefers-contrast/.test(code(sheets[path])))).toEqual(['styles/border.css']);
	});

	it('answers prefers-reduced-motion only in styles/transition.css', () => {
		expect(Object.keys(sheets).filter((path) => /@media[^{]*prefers-reduced-motion/.test(code(sheets[path])))).toEqual([
			'styles/transition.css',
		]);
	});

	it('gives every component border a shared width, so the contrast preference reaches it', () => {
		const literal = Object.entries(sheets)
			.filter(([path]) => path !== 'styles/border.css')
			.flatMap(([path, css]) =>
				[...code(css).matchAll(/(--itx-[\w-]*border-width[\w-]*)\s*:\s*([^;]+);/g)]
					.map(([, name, value]) => [name, oneLine(value)])
					// No border at all, and the spinner's ring, which is a drawing rather than an edge.
					.filter(([name, value]) => !/^var\(--itx-[\w-]*border-width/.test(value) && value !== '0px' && !name.includes('spinner'))
					.map(([name, value]) => `${path}: ${name}: ${value}`),
			);
		expect(literal).toEqual([]);
	});
});
