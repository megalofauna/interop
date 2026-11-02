/**
 * Binds a behavior to an element's own children once they are there, for Interop's elements. A
 * framework can insert an element before its children (Angular does), add one later (`@if`), or
 * replace one; the parse of plain HTML has them in place.
 *
 *   bindChildren(host, () => [host.querySelector(':scope > textarea')], (control) => control && bindIt(control));
 *
 * `find` returns the parts, from `host`'s direct children. `bind` runs with them now and again
 * whenever one of them is a different element, after the last binding is removed. It returns a
 * function that removes what it did, or nothing when a part it needs is missing. Only direct
 * children are watched, not the subtree.
 *
 * Returns a function that stops watching and removes the binding.
 */
export function bindChildren<Parts extends (Element | null)[]>(
	host: Element,
	find: () => [...Parts],
	bind: (...parts: Parts) => (() => void) | null | undefined | false,
): () => void {
	let found: (Element | null)[] | null = null;
	let unbind: (() => void) | null = null;

	const check = () => {
		const parts = find();
		if (found && parts.every((part, index) => part === found![index])) return;
		unbind?.();
		found = parts;
		unbind = bind(...(parts as Parts)) || null;
	};

	const observer = new MutationObserver(check);
	observer.observe(host, { childList: true });
	check();

	return () => {
		observer.disconnect();
		unbind?.();
		unbind = null;
		found = null;
	};
}
