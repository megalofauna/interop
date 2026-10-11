/**
 * Splits the text of a `<code>` element into one `[itx-code-line]` element per line, so CSS can
 * number the lines. Each line keeps its own newline, so the text still joins into the exact source.
 * Running it again on split code rebuilds the same lines.
 */
export function splitLines(code: Element): void {
	const lines = (code.textContent ?? '').match(/[^\n]*\n|[^\n]+$/g) ?? [];
	code.replaceChildren(
		...lines.map((line) => {
			const element = code.ownerDocument.createElement('span');
			element.setAttribute('itx-code-line', '');
			element.textContent = line;
			return element;
		}),
	);
}
