import { sheets } from './sheets';

// styles/outline.css is the one home of the focus ring: its selector list, its color, width and offset,
// and every mode. A ring set anywhere else drifts from it, as five forced-colors rings once did.
const others = Object.entries(sheets).filter(([path]) => path !== 'styles/outline.css');

/** The CSS with comments removed, so a comment that mentions a property is not read as one. */
const code = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

describe('focus ring', () => {
	it('is set only in styles/outline.css; elsewhere a ring is only removed, where it moves to another element', () => {
		const found = others.flatMap(([path, css]) =>
			[...code(css).matchAll(/(?:^|[\s;{])((?:--itx-)?outline(?:-[\w-]+)?)\s*:\s*([^;]+);/g)]
				.filter(([, property, value]) => !(property === 'outline' && value.trim() === 'none'))
				.map(([, property, value]) => `${path}: ${property}: ${value.trim()}`),
		);
		expect(found).toEqual([]);
	});

	it('is never drawn on bare :focus, which also matches a mouse click', () => {
		const found = Object.entries(sheets).flatMap(([path, css]) => [...code(css).matchAll(/:focus(?![\w-])/g)].map(() => path));
		expect(found).toEqual([]);
	});
});
