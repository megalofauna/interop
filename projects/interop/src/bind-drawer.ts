import { focusables } from './focusable';

/**
 * Makes a popover behave as a drawer over the page.
 *
 * - When it opens, focus moves into it: to the link marked `aria-current`, else the first thing
 *   that takes focus.
 * - When focus leaves it, it closes. A popover is not modal, so without this the keyboard can move
 *   on to page content hidden behind it (WCAG 2.4.11).
 * - Following a link in it closes it, since in an app the page changes under it without a reload.
 *
 * The platform does the rest: Escape and a click outside close it, and closing returns focus to the
 * button that opened it. Returns a function that removes the behavior.
 */
export function bindDrawer(popover: HTMLElement): () => void {
	let open = false;

	const onToggle = (event: Event) => {
		open = (event as ToggleEvent).newState === 'open';
		if (!open) return;
		const target = popover.querySelector<HTMLElement>('[aria-current]:is(a[href], button)') ?? focusables(popover)[0];
		target?.focus();
	};

	const onFocusout = (event: FocusEvent) => {
		const next = event.relatedTarget as Node | null;
		// Focus leaving the window entirely is not focus leaving the drawer.
		if (open && next && !popover.contains(next)) popover.hidePopover();
	};

	const onClick = (event: MouseEvent) => {
		if (open && (event.target as Element).closest('a[href]')) popover.hidePopover();
	};

	const listening = new AbortController();
	const { signal } = listening;
	popover.addEventListener('toggle', onToggle, { signal });
	popover.addEventListener('focusout', onFocusout, { signal });
	popover.addEventListener('click', onClick, { signal });

	return () => listening.abort();
}
