import { splitLines } from './split-lines';

describe('splitLines', () => {
	const split = (source: string) => {
		const code = document.createElement('code');
		code.textContent = source;
		splitLines(code);
		return code;
	};

	it('makes one element per line and keeps the exact text', () => {
		const source = 'const a = 1;\n\nconst b = 2;\n';
		const code = split(source);
		expect(Array.from(code.children).map((line) => line.textContent)).toEqual(['const a = 1;\n', '\n', 'const b = 2;\n']);
		expect(code.textContent).toBe(source);
		expect(Array.from(code.children).every((line) => line.hasAttribute('itx-code-line'))).toBe(true);
	});

	it('keeps a last line that has no newline', () => {
		expect(split('a\nb').textContent).toBe('a\nb');
		expect(split('a\nb').children.length).toBe(2);
	});

	it('gives the same lines when run again', () => {
		const code = split('a\n\nb\n');
		splitLines(code);
		expect(code.children.length).toBe(3);
		expect(code.textContent).toBe('a\n\nb\n');
	});
});
