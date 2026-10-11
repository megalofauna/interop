let installed: (() => void) | null = null;

/**
 * Makes Cmd/Ctrl+A select only the code of the block the selection is in. Pressed again on a fully
 * selected block, it selects the page as usual. Installs once per page; returns a function that
 * removes it.
 */
export function scopeSelectAll(root: Document = document): () => void {
	if (installed) return installed;

	const listener = (event: KeyboardEvent) => {
		if (event.key !== 'a' || !(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) return;
		const selection = root.getSelection();
		const anchor = selection?.anchorNode;
		const code = (anchor instanceof Element ? anchor : anchor?.parentElement)?.closest('pre > code');
		if (!selection || !code) return;
		const range = root.createRange();
		range.selectNodeContents(code);
		if (selection.rangeCount && selection.getRangeAt(0).toString() === range.toString()) return;
		event.preventDefault();
		selection.removeAllRanges();
		selection.addRange(range);
	};

	root.addEventListener('keydown', listener);
	installed = () => {
		root.removeEventListener('keydown', listener);
		installed = null;
	};
	return installed;
}
