import { watchInteropInDevMode } from './audit';

export interface TagsOptions {
	/** Where focus goes when the last tag is removed: the tag input, or a heading. Given tabindex="-1" if it needs one. */
	fallback?: HTMLElement | null;
	/** A visually hidden `role="status"` element. When given, each removal is announced in it. */
	status?: HTMLElement | null;
	/** The announcement for a removed tag, so translations can replace it. */
	removed?: (text: string) => string;
}

export interface TagInputOptions {
	/** The tag list the input adds to. Backspace in the empty input moves focus to its last remove button. */
	list: HTMLElement;
	/** With a message, the input is invalid while the list has no tags, so a form will not submit without one. */
	required?: string;
	/**
	 * Passed to bindTags() for the list; the input is the fallback unless another is given. `false`
	 * when the list is bound elsewhere, e.g. by the InteropTags directive.
	 */
	tags?: TagsOptions | false;
}

export interface TagAddDetail {
	value: string;
}

/** A tag's own text: everything in it but its button and its hidden input. */
function tagText(tag: Element): string {
	return Array.from(tag.childNodes)
		.filter((node) => !(node instanceof HTMLButtonElement) && !(node instanceof HTMLInputElement))
		.map((node) => node.textContent ?? '')
		.join('')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * Keeps focus in place as tags are removed from a `ul[interop-tags]`. The consumer removes the tag;
 * when the removed tag held focus, focus moves to the remove button now at its place, else the one
 * before it, else `fallback`. Without this, focus falls to the page.
 *
 * With `status`, each removal is announced there ("Football removed"), because moving focus to the
 * next tag does not say the last one went.
 *
 * Returns a function that removes the behavior.
 */
export function bindTags(list: HTMLElement, options: TagsOptions = {}): () => void {
	const removed = options.removed ?? ((text: string) => `${text} removed`);
	let focusedTag: Element | null = null;
	let focusedIndex = -1;

	const tags = () => Array.from(list.children).filter((child) => child.tagName === 'LI');

	const onFocusin = (event: FocusEvent) => {
		const tag = (event.target as Element).closest('li');
		focusedTag = tag && tag.parentElement === list ? tag : null;
		focusedIndex = focusedTag ? tags().indexOf(focusedTag) : -1;
	};

	const onFocusout = (event: FocusEvent) => {
		// Focus left the list for somewhere real; a removal moves it to nowhere.
		if (event.relatedTarget) focusedTag = null;
	};

	const observer = new MutationObserver((records) => {
		const gone = records.flatMap((record) => Array.from(record.removedNodes)).filter((node): node is Element => node instanceof Element && node.tagName === 'LI');
		if (!gone.length) return;
		if (options.status) options.status.textContent = gone.map((tag) => removed(tagText(tag))).join('. ');
		if (!focusedTag || !gone.includes(focusedTag)) return;
		const remaining = tags();
		const next = remaining[Math.min(focusedIndex, remaining.length - 1)]?.querySelector<HTMLElement>('button');
		const target = next ?? options.fallback;
		focusedTag = null;
		if (!target) return;
		if (!next && !target.matches('a[href], button, input, select, textarea, [tabindex]')) target.tabIndex = -1;
		target.focus();
	});

	list.addEventListener('focusin', onFocusin);
	list.addEventListener('focusout', onFocusout);
	observer.observe(list, { childList: true });
	watchInteropInDevMode();

	return () => {
		observer.disconnect();
		list.removeEventListener('focusin', onFocusin);
		list.removeEventListener('focusout', onFocusout);
	};
}

/**
 * Turns a text input into a way to add tags to a list.
 *
 * - Enter with text fires `interop-tags-add` on the input, detail `{ value }`, and stops the form
 *   submitting. The consumer adds the tag. Calling `preventDefault()` on the event rejects the
 *   value, e.g. a duplicate, and keeps it in the input; otherwise the input empties.
 * - Enter during IME composition is left alone. Commas do not add a tag.
 * - Backspace in the empty input moves focus to the last remove button. It deletes nothing.
 * - With `required`, the input is invalid while the list is empty.
 * - The list gets bindTags(), with the input as the fallback for focus, unless `tags` is `false`.
 *
 * Returns a function that removes the behavior.
 */
export function bindTagInput(input: HTMLInputElement, options: TagInputOptions): () => void {
	const { list } = options;

	const validate = () => {
		if (options.required) input.setCustomValidity(list.querySelector(':scope > li') ? '' : options.required);
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'Enter') {
			const value = input.value.trim();
			if (!value) return;
			event.preventDefault();
			const add = new CustomEvent<TagAddDetail>('interop-tags-add', { bubbles: true, cancelable: true, detail: { value } });
			if (input.dispatchEvent(add)) input.value = '';
		} else if (event.key === 'Backspace' && !input.value) {
			const buttons = list.querySelectorAll<HTMLElement>(':scope > li button');
			const last = buttons[buttons.length - 1];
			if (!last) return;
			event.preventDefault();
			last.focus();
		}
	};

	const observer = new MutationObserver(validate);
	observer.observe(list, { childList: true });
	input.addEventListener('keydown', onKeydown);
	const unbindTags = options.tags === false ? () => {} : bindTags(list, { fallback: input, ...options.tags });
	validate();

	return () => {
		observer.disconnect();
		input.removeEventListener('keydown', onKeydown);
		unbindTags();
		if (options.required) input.setCustomValidity('');
	};
}
