import { watchInteropInDevMode } from './audit';
import { isFocusable } from './focusable';

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
	/**
	 * With a message, the input is required: `aria-required="true"`, and invalid while the list has no
	 * tags, so a form will not submit without one.
	 */
	required?: string;
	/** A visually hidden `role="status"` element. When given, each added tag is announced in it. */
	status?: HTMLElement | null;
	/** The announcement for an added tag, so translations can replace it. */
	added?: (text: string) => string;
	/**
	 * The message for a value the consumer rejected, e.g. "Football is already added". The input
	 * shows it as its validation message until the user types again. Without it, a rejection keeps
	 * the text and says nothing, so give one.
	 */
	rejected?: (value: string) => string;
	/**
	 * Passed to bindTags() for the list; the input is the fallback unless another is given. `false`
	 * when the list is bound elsewhere, e.g. by the InteropTags directive.
	 */
	tags?: TagsOptions | false;
}

export interface TagAddDetail {
	value: string;
}

/**
 * Writes a message to a live region. It empties the region first, so the same message twice in a row
 * is announced twice.
 */
function announce(status: HTMLElement, message: string): void {
	status.textContent = '';
	setTimeout(() => (status.textContent = message), 50);
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
		if (options.status) announce(options.status, gone.map((tag) => removed(tagText(tag))).join('. '));
		if (!focusedTag || !gone.includes(focusedTag)) return;
		const remaining = tags();
		const next = remaining[Math.min(focusedIndex, remaining.length - 1)]?.querySelector<HTMLElement>('button');
		const target = next ?? options.fallback;
		focusedTag = null;
		if (!target) return;
		if (!next && !isFocusable(target) && !target.hasAttribute('tabindex')) target.tabIndex = -1;
		target.focus();
	});

	const listening = new AbortController();
	list.addEventListener('focusin', onFocusin, { signal: listening.signal });
	list.addEventListener('focusout', onFocusout, { signal: listening.signal });
	observer.observe(list, { childList: true });
	watchInteropInDevMode();

	return () => {
		observer.disconnect();
		listening.abort();
	};
}

/**
 * Turns a text input into a way to add tags to a list.
 *
 * - Enter with text fires `interop-tags-add` on the input, detail `{ value }`, and stops the form
 *   submitting. The consumer adds the tag, and with `status` it is announced. Calling
 *   `preventDefault()` on the event rejects the value, e.g. a duplicate: the text stays, and the
 *   `rejected` message is shown and spoken as the input's validation message.
 * - Enter during IME composition is left alone. Commas do not add a tag.
 * - Backspace in the empty input moves focus to the last remove button. It deletes nothing.
 * - With `required`, the input is `aria-required` and invalid while the list is empty. It is
 *   `aria-invalid="false"` until a value is rejected, so it is not announced as invalid before the
 *   user has done anything; bindValidation() takes over from there when the form has it.
 * - The list gets bindTags(), with the input as the fallback for focus, unless `tags` is `false`.
 *
 * Returns a function that removes the behavior.
 */
export function bindTagInput(input: HTMLInputElement, options: TagInputOptions): () => void {
	const { list } = options;
	const added = options.added ?? ((text: string) => `${text} added`);
	/** A rejection's message, kept until the user types again. */
	let rejection = '';

	const validate = () => {
		const empty = options.required && !list.querySelector(':scope > li') ? options.required : '';
		input.setCustomValidity(rejection || empty);
	};

	const onKeydown = (event: KeyboardEvent) => {
		if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
		if (event.key === 'Enter') {
			const value = input.value.trim();
			if (!value) return;
			event.preventDefault();
			const add = new CustomEvent<TagAddDetail>('interop-tags-add', { bubbles: true, cancelable: true, detail: { value } });
			if (input.dispatchEvent(add)) {
				input.value = '';
				if (options.status) announce(options.status, added(value));
			} else if (options.rejected) {
				rejection = options.rejected(value);
				validate();
				input.setAttribute('aria-invalid', 'true');
				input.reportValidity();
			}
		} else if (event.key === 'Backspace' && !input.value) {
			const buttons = list.querySelectorAll<HTMLElement>(':scope > li button');
			const last = buttons[buttons.length - 1];
			if (!last) return;
			event.preventDefault();
			last.focus();
		}
	};

	const onInput = () => {
		if (!rejection) return;
		rejection = '';
		validate();
		input.setAttribute('aria-invalid', 'false');
	};

	const observer = new MutationObserver(validate);
	observer.observe(list, { childList: true });
	const listening = new AbortController();
	input.addEventListener('keydown', onKeydown, { signal: listening.signal });
	input.addEventListener('input', onInput, { signal: listening.signal });
	if (options.required) input.setAttribute('aria-required', 'true');
	// setCustomValidity() marks a field invalid for screen readers at once; it waits for the user.
	const addedInvalid = !input.hasAttribute('aria-invalid');
	if (addedInvalid) input.setAttribute('aria-invalid', 'false');
	const unbindTags = options.tags === false ? () => {} : bindTags(list, { fallback: input, ...options.tags });
	validate();

	return () => {
		observer.disconnect();
		listening.abort();
		unbindTags();
		input.setCustomValidity('');
		if (options.required) input.removeAttribute('aria-required');
		if (addedInvalid) input.removeAttribute('aria-invalid');
	};
}
