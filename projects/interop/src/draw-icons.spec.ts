import { drawIcons } from './draw-icons';
import { registerIcons } from './icon-registry';

describe('drawIcons', () => {
	beforeAll(() =>
		registerIcons({
			name: 'test-check',
			viewBox: '0 0 24 24',
			fill: 'none',
			stroke: 'currentColor',
			paths: [{ d: 'M5 12l5 5l10 -10' }, { d: 'M1 1h1', fill: 'currentColor', opacity: '0.5' }],
		}),
	);

	const draw = (markup: string) => {
		document.body.innerHTML = markup;
		drawIcons(document.body);
		return document.body.querySelector('svg')!;
	};

	it('draws the registered paths and sets the viewBox', () => {
		const svg = draw('<svg interop-icon name="test-check"></svg>');
		expect(svg.getAttribute('viewBox')).toBe('0 0 24 24');
		const group = svg.querySelector('g')!;
		expect(group.getAttribute('stroke')).toBe('currentColor');
		expect(group.getAttribute('fill')).toBe('none');
		const paths = svg.querySelectorAll('path');
		expect(paths).toHaveLength(2);
		expect(paths[1].getAttribute('opacity')).toBe('0.5');
	});

	it('hides a decorative icon, and makes a labeled one an image', () => {
		expect(draw('<svg interop-icon name="test-check"></svg>').getAttribute('aria-hidden')).toBe('true');
		const labelled = draw('<svg interop-icon name="test-check" aria-label="Done"></svg>');
		expect(labelled.getAttribute('role')).toBe('img');
		expect(labelled.hasAttribute('aria-hidden')).toBe(false);
	});

	it('fixes the size given in pixels', () => {
		const svg = draw('<svg interop-icon name="test-check" size="16"></svg>');
		expect(svg.style.getPropertyValue('--itx-icon-inline-size')).toBe('16px');
		expect(svg.style.getPropertyValue('--itx-icon-block-size')).toBe('16px');
	});

	it('replaces what was drawn before, so it can run again', () => {
		const svg = draw('<svg interop-icon name="test-check"></svg>');
		drawIcons(document.body);
		expect(svg.querySelectorAll('g')).toHaveLength(1);
	});

	it('leaves an unregistered icon alone, and warns', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const svg = draw('<svg interop-icon name="test-missing"><circle r="1"></circle></svg>');
		expect(svg.querySelector('circle')).not.toBeNull();
		expect(warn).toHaveBeenCalledOnce();
		warn.mockRestore();
	});
});
