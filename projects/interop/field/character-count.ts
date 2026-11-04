import { bindCharacterCount, bindChildren, type CharacterCountOptions } from 'interop';

/** On a server there is no DOM; the class still has to be declared, and is never defined there. */
const Element = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * `<interop-character-count>`: counts the characters in the field inside it against a limit,
 * without stopping the user typing past it. Importing `interop/field` defines the element, so the
 * markup works wherever it appears, in any framework or none.
 *
 * ```html
 * <div interop-field>
 *   <label for="summary">Summary</label>
 *   <p interop-hint id="summary-hint">You can enter up to 200 characters</p>
 *   <p interop-error hidden></p>
 *   <interop-character-count itx-limit="200">
 *     <textarea interop-input id="summary" name="summary" aria-describedby="summary-hint"></textarea>
 *     <p interop-count></p>
 *   </interop-character-count>
 * </div>
 * ```
 *
 * The element has no box and no role: its children stack in the field as if it were not there.
 * It calls `bindCharacterCount()` once its children are in place.
 *
 * - `itx-limit` is the most characters the field takes. Not `maxlength`, which stops typing.
 * - `itx-threshold`, e.g. `0.75`, shows the count only from that share of the limit.
 * - A visually hidden `role="status"` child speaks the count in browsers without `ariaNotify()`.
 * - `message` and `tooLong` replace the wording, for translations.
 *
 * The count is hidden until the element is defined. Put the limit in the hint, so it shows without
 * script; the server checks the length.
 */
export class InteropCharacterCountElement extends Element {
	static readonly observedAttributes = ['itx-limit', 'itx-threshold'];

	#unbind: (() => void) | null = null;
	#message: CharacterCountOptions['message'];
	#tooLong: CharacterCountOptions['tooLong'];

	/** The count's text. `left` is negative when over the limit. */
	get message(): CharacterCountOptions['message'] {
		return this.#message;
	}
	set message(message: CharacterCountOptions['message']) {
		this.#message = message;
		this.#rebind();
	}

	/** The error when over the limit. Default: "<label> must be <limit> characters or fewer". */
	get tooLong(): CharacterCountOptions['tooLong'] {
		return this.#tooLong;
	}
	set tooLong(tooLong: CharacterCountOptions['tooLong']) {
		this.#tooLong = tooLong;
		this.#rebind();
	}

	connectedCallback(): void {
		// A framework can set a property before the element is defined; it lands on the instance, over the accessor.
		for (const key of ['message', 'tooLong'] as const) {
			if (!Object.hasOwn(this, key)) continue;
			const value = this[key];
			delete this[key];
			this[key] = value as never;
		}
		this.#bind();
	}

	disconnectedCallback(): void {
		this.#unbind?.();
		this.#unbind = null;
	}

	attributeChangedCallback(): void {
		this.#rebind();
	}

	#rebind(): void {
		if (!this.#unbind) return;
		this.#unbind();
		this.#bind();
	}

	#bind(): void {
		const limit = Number(this.getAttribute('itx-limit'));
		const threshold = Number(this.getAttribute('itx-threshold') ?? 0) || 0;
		this.#unbind = bindChildren(
			this,
			() => [
				this.querySelector<HTMLTextAreaElement | HTMLInputElement>(':scope > :is(textarea, input)'),
				this.querySelector<HTMLElement>(':scope > [interop-count]'),
				this.querySelector<HTMLElement>(':scope > [role="status"]'),
			],
			(control, count, status) =>
				control &&
				limit > 0 &&
				bindCharacterCount(control, { limit, threshold, count, status, message: this.#message, tooLong: this.#tooLong }),
		);
	}
}

if (typeof customElements !== 'undefined' && !customElements.get('interop-character-count')) {
	customElements.define('interop-character-count', InteropCharacterCountElement);
}

declare global {
	interface HTMLElementTagNameMap {
		'interop-character-count': InteropCharacterCountElement;
	}
}
