import { isRtl } from './direction';
import { isFocusable, OWNS_ARROW_KEYS } from './focusable';

/**
 * Gives a toolbar one Tab stop and arrow-key movement in browsers without the `focusgroup`
 * attribute. Where the browser supports it (`'focusGroup' in HTMLElement.prototype`), this does
 * nothing and the browser does the same job.
 *
 * The consumer writes the markup; the helper reads the same `focusgroup` tokens the browser does:
 *
 *   <div interop-toolbar role="toolbar" focusgroup="toolbar" aria-label="Formatting">…</div>
 *
 * - The items are the focusable elements inside `root`, in document order. Natively disabled and
 *   hidden items are skipped; `aria-disabled` items are not. Items inside a popover, or inside a
 *   nested `[focusgroup]` (including `focusgroup="none"`), are left out.
 * - One item holds the Tab stop. It is the last item focused, or with `nomemory`, the first.
 * - The arrow keys move between items: Left and Right, flipped in right-to-left text, or Up and Down
 *   with `block`. They wrap with `wrap`. Home and End go to the first and last item. Keys held with a
 *   modifier are left alone.
 * - A text field, select or radio button keeps its arrow keys while it has focus.
 * - Items added or removed later join or leave the Tab stop rules.
 *
 * Returns a function that removes the behavior and restores each item's `tabindex`.
 */
export function bindToolbar(root: HTMLElement): () => void {
	if ('focusGroup' in HTMLElement.prototype) return () => {};

	/** Each item's own `tabindex` attribute before the helper changed it, or null when it had none. */
	const original = new Map<HTMLElement, string | null>();
	let stop: HTMLElement | null = null;

	const tokens = () => (root.getAttribute('focusgroup') ?? '').split(/\s+/);
	/** An element made focusable only by its own `tabindex` stays an item after the helper sets it to -1. */
	const reachable = (element: HTMLElement) =>
		isFocusable(element) || (original.has(element) && original.get(element) !== '-1' && element.checkVisibility?.() !== false);
	const items = () =>
		Array.from(root.querySelectorAll<HTMLElement>('*')).filter((item) => {
			const nested = item.parentElement?.closest('[focusgroup]');
			return reachable(item) && (!nested || nested === root || !root.contains(nested)) && !item.closest('[popover]');
		});

	const setTabIndex = (item: HTMLElement, value: number) => {
		if (!original.has(item)) original.set(item, item.getAttribute('tabindex'));
		item.tabIndex = value;
	};

	/** Gives the Tab stop to `stop`, or to the first item when `stop` is gone. */
	const reconcile = () => {
		const all = items();
		if (!stop || !all.includes(stop)) stop = all[0] ?? null;
		for (const item of all) setTabIndex(item, item === stop ? 0 : -1);
	};

	const onFocusin = (event: FocusEvent) => {
		const item = event.target as HTMLElement;
		if (item === stop || !items().includes(item)) return;
		stop = item;
		reconcile();
	};

	const onFocusout = (event: FocusEvent) => {
		if (root.contains(event.relatedTarget as Node | null) || !tokens().includes('nomemory')) return;
		stop = null;
		reconcile();
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
		const item = event.target as HTMLElement;
		if (item.matches(OWNS_ARROW_KEYS)) return;
		const all = items();
		const index = all.indexOf(item);
		if (index < 0) return;
		const block = tokens().includes('block');
		const rtl = !block && isRtl(root);
		const forward = block ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight';
		const back = block ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
		const wrap = tokens().includes('wrap');
		const last = all.length - 1;
		const next =
			event.key === forward
				? index < last
					? index + 1
					: wrap
						? 0
						: index
				: event.key === back
					? index > 0
						? index - 1
						: wrap
							? last
							: index
					: event.key === 'Home'
						? 0
						: event.key === 'End'
							? last
							: -1;
		if (next < 0) return;
		event.preventDefault();
		all[next].focus();
	};

	const observer = new MutationObserver(reconcile);
	observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'hidden'] });
	const listening = new AbortController();
	const { signal } = listening;
	root.addEventListener('focusin', onFocusin, { signal });
	root.addEventListener('focusout', onFocusout, { signal });
	root.addEventListener('keydown', onKeydown, { signal });

	reconcile();
	observer.takeRecords();

	return () => {
		observer.disconnect();
		listening.abort();
		for (const [item, value] of original) {
			if (value === null) item.removeAttribute('tabindex');
			else item.setAttribute('tabindex', value);
		}
	};
}
