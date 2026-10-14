/** Elements the keyboard can reach by markup alone, before checking that they are rendered and not inert. */
const FOCUSABLE = [
	'a[href]',
	'area[href]',
	'button:not(:disabled)',
	'input:not(:disabled):not([type="hidden"])',
	'select:not(:disabled)',
	'textarea:not(:disabled)',
	'summary',
	'iframe',
	'audio[controls]',
	'video[controls]',
	'[contenteditable]:not([contenteditable="false"])',
	'[tabindex]:not([tabindex="-1"])',
].join(', ');

/** Whether the keyboard can reach `element`: focusable by markup, rendered, and not inside `inert`. */
export function isFocusable(element: Element): boolean {
	return element.matches(FOCUSABLE) && !element.closest('[inert]') && (element as HTMLElement).checkVisibility?.() !== false;
}

/** The elements in `root` the keyboard can reach, in document order. */
export function focusables(root: ParentNode): HTMLElement[] {
	return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((element) => isFocusable(element));
}
