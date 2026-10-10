import { getIcon, registerIcons, type IconDefinition } from './icon-registry';

const icon = (name: string, d = 'M0 0'): IconDefinition => ({
	name,
	viewBox: '0 0 24 24',
	fill: 'none',
	stroke: 'currentColor',
	paths: [{ d }],
});

describe('icon registry', () => {
	it('returns a registered icon by name', () => {
		const check = icon('test-check');
		registerIcons(check);
		expect(getIcon('test-check')).toBe(check);
	});

	it('returns undefined for an unknown name', () => {
		expect(getIcon('test-missing')).toBeUndefined();
	});

	it('replaces an earlier definition with the same name', () => {
		registerIcons(icon('test-same', 'M1 1'), icon('test-same', 'M2 2'));
		expect(getIcon('test-same')?.paths[0]!.d).toBe('M2 2');
	});
});
