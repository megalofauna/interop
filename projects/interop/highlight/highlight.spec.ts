import { splitLines } from 'interop';
import { highlightCode, registerLanguages } from './highlight';

// jsdom has no Custom Highlight API, so a Map and a Set stand in for the registry and a highlight.
class FakeHighlight extends Set<AbstractRange> {}
Object.assign(globalThis, { Highlight: FakeHighlight });
Object.assign(globalThis.CSS ?? Object.assign(globalThis, { CSS: {} }).CSS, { highlights: new Map() });

registerLanguages({ json: { label: 'JSON', load: () => import('shiki/langs/json.mjs') } });

const highlighted = () =>
	Array.from(CSS.highlights.entries()).flatMap(([name, highlight]) =>
		Array.from(highlight, (range) => range as Range).map((range) => `${name.replace('itx-code-', '')} ${range.toString()}`),
	);

describe('highlightCode', () => {
	const render = (source: string, language = 'json') => {
		CSS.highlights.clear();
		document.body.innerHTML = '<pre><code></code></pre>';
		const code = document.querySelector('code')!;
		code.className = `language-${language}`;
		code.textContent = source;
		return code;
	};

	it('colors the text without changing the nodes', async () => {
		const code = render('{"a": 1}');
		const text = code.firstChild;
		await highlightCode(code);
		expect(code.firstChild).toBe(text);
		expect(code.childNodes.length).toBe(1);
		expect(highlighted()).toEqual(['keyword "a"', 'punctuation :', 'constant 1']);
	});

	it('colors split lines, each range inside its own line', async () => {
		const code = render('{\n\t"a": true\n}\n');
		splitLines(code);
		await highlightCode(code);
		const ranges = Array.from(CSS.highlights.values()).flatMap((highlight) => Array.from(highlight, (range) => range as Range));
		expect(ranges.length).toBeGreaterThan(0);
		expect(ranges.every((range) => range.startContainer === range.endContainer)).toBe(true);
		expect(highlighted()).toContain('constant true');
	});

	it('removes its colors', async () => {
		const remove = await highlightCode(render('{"a": 1}'));
		remove();
		expect(highlighted()).toEqual([]);
	});

	it('does nothing for a language that is not registered', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		await highlightCode(render('x = 1', 'python'));
		expect(highlighted()).toEqual([]);
		warn.mockRestore();
	});

	it('skips text that changed while the grammar loaded', async () => {
		const code = render('{"a": 1}');
		const pending = highlightCode(code);
		code.textContent = '{"b": 2}';
		await pending;
		expect(highlighted()).toEqual([]);
	});
});
