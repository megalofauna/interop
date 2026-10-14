import { watchInteropInDevMode } from './audit';

type TextControl = HTMLInputElement | HTMLTextAreaElement;

export interface CharacterCountOptions {
	/** The most characters the field takes. Typing past it is allowed; the field is then invalid. */
	limit: number;
	/** The visible count, an empty `[interop-count]`. It updates on every keystroke and is hidden from screen readers. */
	count?: HTMLElement | null;
	/** A visually hidden `role="status"` element. The count is announced there once the user pauses. */
	status?: HTMLElement | null;
	/** Show the count only from this share of the limit, e.g. `0.75`. Default `0`: always. */
	threshold?: number;
	/** The count's text, so translations can replace it. `left` is negative when over the limit. */
	message?: (left: number) => string;
	/** The error when over the limit. Default: "<label> must be <limit> characters or fewer". */
	tooLong?: (limit: number, label: string) => string;
}

/** How long typing has to pause before the count is announced. */
const PAUSE = 1000;

const segmenter = typeof Intl !== 'undefined' && 'Segmenter' in Intl ? new Intl.Segmenter() : null;
/** Characters as people count them: an emoji or an accented letter is one. */
const length = (text: string) => (segmenter ? Array.from(segmenter.segment(text)).length : Array.from(text).length);

const defaultMessage = (left: number) =>
	left >= 0
		? `You have ${left} character${left === 1 ? '' : 's'} remaining`
		: `You have ${-left} character${left === -1 ? '' : 's'} too many`;

/**
 * Counts the characters in a field against a limit, without stopping the user typing past it.
 *
 * - `count` shows how many are left, or how many too many, as the user types. Over the limit it
 *   gets `data-over`. It is `aria-hidden`: a count that changes on every keystroke would talk over
 *   the typing.
 * - `status` announces the same text once typing pauses for a second.
 * - Over the limit the field's custom validity says so, so the form does not submit and
 *   bindValidation() shows the error. It fires `interop-validity-change` as that changes.
 * - Put the limit in the field's hint too: "You can enter up to 200 characters".
 *
 * Returns a function that removes the behavior and the validity it set.
 */
export function bindCharacterCount(control: TextControl, options: CharacterCountOptions): () => void {
	const { limit, count = null, status = null, threshold = 0 } = options;
	const message = options.message ?? defaultMessage;
	const label = (control.labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim() || 'This field';
	const tooLong = options.tooLong ?? ((max: number, name: string) => `${name} must be ${max} characters or fewer`);
	let over = false;
	let timer: ReturnType<typeof setTimeout> | undefined;

	const update = (announce: boolean) => {
		const used = length(control.value);
		const left = limit - used;
		const text = message(left);
		if (count) {
			count.textContent = text;
			count.hidden = used < limit * threshold;
			count.toggleAttribute('data-over', left < 0);
		}
		if (left < 0 !== over) {
			over = left < 0;
			control.setCustomValidity(over ? tooLong(limit, label) : '');
			control.dispatchEvent(new Event('interop-validity-change', { bubbles: true }));
		}
		if (!announce || !status) return;
		clearTimeout(timer);
		timer = setTimeout(() => (status.textContent = text), PAUSE);
	};

	const listening = new AbortController();
	control.addEventListener('input', () => update(true), { signal: listening.signal });
	// The reset event fires before the form resets, so count after it.
	control.form?.addEventListener('reset', () => setTimeout(() => update(false)), { signal: listening.signal });
	count?.setAttribute('aria-hidden', 'true');
	update(false);
	watchInteropInDevMode();

	return () => {
		listening.abort();
		clearTimeout(timer);
		if (over) control.setCustomValidity('');
	};
}
