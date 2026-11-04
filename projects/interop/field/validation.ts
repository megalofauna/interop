import { bindChildren, bindValidation, type ValidationOptions } from 'interop';

/** On a server there is no DOM; the class still has to be declared, and is never defined there. */
const Element = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * `<interop-validation>`: shows the errors of the form inside it in the page, using the browser's
 * own validity, at the right time. Importing `interop/field` defines the element, so the markup
 * works wherever it appears, in any framework or none.
 *
 * ```html
 * <interop-validation>
 *   <div interop-error-summary hidden>
 *     <h2>There is a problem</h2>
 *     <ul></ul>
 *   </div>
 *   <h1>Your details</h1>
 *   <form action="/details" method="post">…</form>
 * </interop-validation>
 * ```
 *
 * The element has no role. It calls `bindValidation()` on the form, which must be a direct child,
 * once it is in place. An `[interop-error-summary]`, also a direct child, lists the errors of a
 * failed submit and takes focus. Without script the browser checks the form itself.
 *
 * `messages` replaces the wording per validity key, merged over the defaults.
 */
export class InteropValidationElement extends Element {
	#unbind: (() => void) | null = null;
	#messages: ValidationOptions['messages'];

	/** Messages per validity key, merged over `defaultValidationMessages`. */
	get messages(): ValidationOptions['messages'] {
		return this.#messages;
	}
	set messages(messages: ValidationOptions['messages']) {
		this.#messages = messages;
		if (!this.#unbind) return;
		this.#unbind();
		this.#bind();
	}

	connectedCallback(): void {
		// A framework can set a property before the element is defined; it lands on the instance, over the accessor.
		if (Object.hasOwn(this, 'messages')) {
			const messages = this.messages;
			delete this.messages;
			this.messages = messages;
		}
		this.#bind();
	}

	disconnectedCallback(): void {
		this.#unbind?.();
		this.#unbind = null;
	}

	#bind(): void {
		this.#unbind = bindChildren(
			this,
			() => [this.querySelector<HTMLFormElement>(':scope > form'), this.querySelector<HTMLElement>(':scope > [interop-error-summary]')],
			(form, summary) => form && bindValidation(form, { summary, messages: this.#messages }),
		);
	}
}

if (typeof customElements !== 'undefined' && !customElements.get('interop-validation')) {
	customElements.define('interop-validation', InteropValidationElement);
}

declare global {
	interface HTMLElementTagNameMap {
		'interop-validation': InteropValidationElement;
	}
}
