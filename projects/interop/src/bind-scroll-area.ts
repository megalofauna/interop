import { watchInteropInDevMode } from './audit';

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

/**
 * Makes a scroll container reachable from the keyboard and names it when the author does.
 *
 * - While it overflows and nothing inside can take focus, it gets `tabindex="0"`, so the
 *   keyboard can scroll it. Chrome and Firefox do this on their own; Safari does not. Content
 *   that is hidden, `inert` or disabled does not count as something that can take focus.
 * - It keeps `tabindex` while focused, so focus is not lost when it stops overflowing.
 * - With `aria-label` or `aria-labelledby` and no role, it gets `role="group"`, which carries a
 *   name without adding a landmark. Without a name it gets no role.
 *
 * Returns a function that removes the behavior and the attributes it added.
 */
export function bindScrollArea(element: HTMLElement): () => void {
	const ownTabIndex = element.hasAttribute('tabindex');
	let addedTabIndex = false;
	let addedRole = false;

	const canFocusInside = () =>
		Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE)).some(
			(candidate) => !candidate.closest('[inert]') && candidate.checkVisibility?.() !== false,
		);
	const overflows = () =>
		element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth;

	const update = () => {
		const named = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
		if (named && !element.hasAttribute('role')) {
			element.setAttribute('role', 'group');
			addedRole = true;
		} else if (!named && addedRole) {
			element.removeAttribute('role');
			addedRole = false;
		}

		if (ownTabIndex) return;
		const needed = overflows() && !canFocusInside();
		if (needed && !addedTabIndex) {
			element.tabIndex = 0;
			addedTabIndex = true;
		} else if (!needed && addedTabIndex && element.ownerDocument.activeElement !== element) {
			element.removeAttribute('tabindex');
			addedTabIndex = false;
		}
	};

	// Reading sizes inside a ResizeObserver callback can resize a popover's fallback again in the same
	// frame, so the check waits for the next one.
	let frame = 0;
	const later = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(update);
	};
	const resizes = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(later);
	const observeSizes = () => {
		if (!resizes) return;
		resizes.disconnect();
		resizes.observe(element);
		for (const child of Array.from(element.children)) resizes.observe(child);
	};
	const mutations = new MutationObserver(() => {
		observeSizes();
		update();
	});
	mutations.observe(element, {
		subtree: true,
		childList: true,
		characterData: true,
		attributes: true,
		attributeFilter: ['hidden', 'inert', 'disabled', 'tabindex', 'href', 'contenteditable', 'aria-label', 'aria-labelledby'],
	});
	element.addEventListener('focusout', update);
	observeSizes();
	update();
	watchInteropInDevMode();

	return () => {
		cancelAnimationFrame(frame);
		resizes?.disconnect();
		mutations.disconnect();
		element.removeEventListener('focusout', update);
		if (addedTabIndex) element.removeAttribute('tabindex');
		if (addedRole) element.removeAttribute('role');
	};
}
