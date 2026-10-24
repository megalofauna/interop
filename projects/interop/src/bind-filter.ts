import { announce } from './announce';
import { focusables, OWNS_ARROW_KEYS } from './focusable';

export interface FilterOptions {
	/** Shown when nothing matches, hidden otherwise: "No pages match". Its text is announced then. */
	empty?: HTMLElement | null;
	/** Whether an item matches the query. Default: its text contains the query, ignoring case and accents. */
	match?: (item: HTMLElement, query: string) => boolean;
	/** The count's text, so translations can replace it. Default: "1 result", "12 results". */
	message?: (count: number) => string;
	/** A visually hidden `role="status"` element, for browsers without `ariaNotify()`. See `announce()`. */
	status?: HTMLElement | null;
}

/** How long typing has to pause before the count is announced. */
const PAUSE = 500;

/** Lowercase, without accents, so "e" finds "é". */
const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();

const defaultMatch = (item: HTMLElement, query: string) => fold(item.textContent ?? '').includes(fold(query));
const defaultMessage = (count: number) => (count === 0 ? 'No results' : `${count} result${count === 1 ? '' : 's'}`);

/**
 * Filters a list as the user types in a search field: "go to page", a long list of settings.
 *
 *   <input type="search" id="go-to-query">
 *   <ul>…<li><a href="/components/button">Button</a></li>…</ul>
 *   <p hidden>No pages match</p>
 *   bindFilter(input, list, { empty });
 *
 * - The items are the list's children. One that does not match gets `hidden`; an empty query
 *   shows them all. The page decides the order.
 * - When typing pauses, the count is announced from the field, only when it has changed. With no
 *   match, `empty` shows and its text is announced.
 * - Arrow Down in the field moves focus to the first item shown, and Arrow Up and Down move between
 *   items. Arrow Up from the first item goes back to the field. Focus stays real: each item keeps
 *   its own role, and Tab, Enter and a phone's swipe work as on any list of links or buttons.
 * - In a `<dialog>`, closing it clears the field, so the next open starts fresh.
 *
 * Returns a function that removes the behavior and shows every item.
 */
export function bindFilter(input: HTMLInputElement, list: HTMLElement, options: FilterOptions = {}): () => void {
	const { empty = null, status = null } = options;
	const match = options.match ?? defaultMatch;
	const message = options.message ?? defaultMessage;
	const items = () => Array.from(list.children) as HTMLElement[];
	const shown = () => items().filter((item) => !item.hidden);
	let spoken: number | null = null;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const update = (speak: boolean) => {
		const query = input.value.trim();
		let count = 0;
		for (const item of items()) {
			item.hidden = query !== '' && !match(item, query);
			if (!item.hidden) count++;
		}
		if (empty) empty.hidden = count > 0;
		clearTimeout(timer);
		// An empty query shows the whole list, which needs no count. The next query is counted afresh.
		if (!query) spoken = null;
		if (!speak || !query) return;
		timer = setTimeout(() => {
			if (count === spoken) return;
			spoken = count;
			const text = (count === 0 && empty?.textContent?.trim()) || message(count);
			announce(text, { from: input, status });
		}, PAUSE);
	};

	/** Focus the first focusable element in the item `step` places from the one holding focus. */
	const move = (event: KeyboardEvent, from: number, step: number) => {
		const all = shown();
		const next = from + step;
		event.preventDefault();
		if (next < 0) input.focus();
		else focusables(all[Math.min(next, all.length - 1)])[0]?.focus();
	};

	const listening = new AbortController();
	const { signal } = listening;
	input.addEventListener('input', () => update(true), { signal });
	input.addEventListener(
		'keydown',
		(event) => {
			if (event.key !== 'ArrowDown' || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.isComposing) return;
			if (shown().length) move(event, -1, 1);
		},
		{ signal },
	);
	list.addEventListener(
		'keydown',
		(event) => {
			if ((event.key !== 'ArrowDown' && event.key !== 'ArrowUp') || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
				return;
			if ((event.target as Element).matches(OWNS_ARROW_KEYS)) return;
			const index = shown().findIndex((item) => item.contains(event.target as Node));
			if (index >= 0) move(event, index, event.key === 'ArrowDown' ? 1 : -1);
		},
		{ signal },
	);
	input.closest('dialog')?.addEventListener(
		'close',
		() => {
			input.value = '';
			update(false);
		},
		{ signal },
	);
	update(false);

	return () => {
		listening.abort();
		clearTimeout(timer);
		for (const item of items()) item.hidden = false;
	};
}
