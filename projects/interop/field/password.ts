import { bindPasswordToggle } from 'interop';

/** On a server there is no DOM; the class still has to be declared, and is never defined there. */
const Element = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * `<interop-password>`: a password input and the button that shows it. Importing `interop/field`
 * defines the element, so the markup works wherever it appears, in any framework or none.
 *
 * ```html
 * <div interop-field>
 *   <label for="password">Password</label>
 *   <interop-password>
 *     <input interop-input id="password" type="password" autocomplete="current-password">
 *     <button interop-button type="button" commandfor="password" command="--toggle-password" aria-pressed="false">
 *       Show password
 *     </button>
 *   </interop-password>
 * </div>
 * ```
 *
 * The element lays out the row and has no role of its own. The button stays hidden until the
 * element is defined, so it never shows where script does not run. The element owns the input's
 * `type` and the button's `aria-pressed`.
 */
export class InteropPasswordElement extends Element {
	#unbind: (() => void) | null = null;

	connectedCallback(): void {
		this.#unbind = bindPasswordToggle(this);
	}

	disconnectedCallback(): void {
		this.#unbind?.();
		this.#unbind = null;
	}
}

if (typeof customElements !== 'undefined' && !customElements.get('interop-password')) {
	customElements.define('interop-password', InteropPasswordElement);
}

declare global {
	interface HTMLElementTagNameMap {
		'interop-password': InteropPasswordElement;
	}
}
