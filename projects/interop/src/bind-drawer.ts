import { watchInteropInDevMode } from './audit';

/** Elements that take focus, in the order a drawer prefers them. */
const FOCUSABLE = 'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

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
		const target = popover.querySelector<HTMLElement>('[aria-current]:is(a[href], button)') ?? popover.querySelector<HTMLElement>(FOCUSABLE);
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

	popover.addEventListener('toggle', onToggle);
	popover.addEventListener('focusout', onFocusout);
	popover.addEventListener('click', onClick);
	watchInteropInDevMode();

	return () => {
		popover.removeEventListener('toggle', onToggle);
		popover.removeEventListener('focusout', onFocusout);
		popover.removeEventListener('click', onClick);
	};
}
