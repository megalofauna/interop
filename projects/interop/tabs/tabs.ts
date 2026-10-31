import { bindTabs } from 'interop';

/** On a server there is no DOM; the class still has to be declared, and is never defined there. */
const Element = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * `<interop-tablist>`: a tab list with tab behavior. Importing `interop/tabs` defines the element,
 * so the markup works wherever it appears, in any framework or none.
 *
 * ```html
 * <interop-tablist aria-label="Station systems">
 *   <button type="button" role="tab" aria-controls="nav" aria-selected="true">Navigation</button>
 *   <button type="button" role="tab" aria-controls="eng">Engineering</button>
 * </interop-tablist>
 * <section role="tabpanel" id="nav">…</section>
 * <section role="tabpanel" id="eng" hidden="until-found">…</section>
 * ```
 *
 * The element is the tab list: it holds only tabs, and takes `role="tablist"` unless it has one.
 * Each tab names its panel with `aria-controls`; the panels can sit anywhere.
 *
 * - `itx-activation="manual"` moves focus with the arrow keys and selects on Enter or Space.
 * - `itx-hash` selects the tab whose panel matches the URL fragment.
 * - `aria-orientation="vertical"` stacks the tabs; the arrow keys follow.
 * - `itx-variant="segmented"`, and `itx-variant="segmented icon"`, choose the look. `itx-size` sets the size.
 *
 * Listen for `interop-tabs-change` to follow the selection.
 */
export class InteropTablistElement extends Element {
	static readonly observedAttributes = ['itx-activation', 'itx-hash'];

	#unbind: (() => void) | null = null;

	connectedCallback(): void {
		if (!this.hasAttribute('role')) this.setAttribute('role', 'tablist');
		this.#bind();
	}

	disconnectedCallback(): void {
		this.#unbind?.();
		this.#unbind = null;
	}

	attributeChangedCallback(): void {
		if (!this.#unbind) return;
		this.#unbind();
		this.#bind();
	}

	#bind(): void {
		this.#unbind = bindTabs(this, {
			activation: this.getAttribute('itx-activation') === 'manual' ? 'manual' : 'automatic',
			hash: this.hasAttribute('itx-hash'),
		});
	}
}

if (typeof customElements !== 'undefined' && !customElements.get('interop-tablist')) {
	customElements.define('interop-tablist', InteropTablistElement);
}

declare global {
	interface HTMLElementTagNameMap {
		'interop-tablist': InteropTablistElement;
	}
}
