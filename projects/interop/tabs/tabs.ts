import { bindTabs, type TabsBinding } from 'interop';

/** On a server there is no DOM; the class still has to be declared, and is never defined there. */
const Element = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement;

/**
 * `<interop-tabs>`: tab behavior for the tab list and panels inside it. Importing `interop/tabs`
 * defines the element, so the markup works wherever it appears, in any framework or none.
 *
 * ```html
 * <interop-tabs>
 *   <div role="tablist" aria-label="Station systems">
 *     <button type="button" role="tab" aria-controls="nav" aria-selected="true">Navigation</button>
 *     <button type="button" role="tab" aria-controls="eng" aria-selected="false" tabindex="-1">Engineering</button>
 *   </div>
 *   <section role="tabpanel" id="nav">…</section>
 *   <section role="tabpanel" id="eng" hidden="until-found">…</section>
 * </interop-tabs>
 * ```
 *
 * The element groups a tab list and its panels and has no role of its own; ARIA has none for the
 * pair. The markup carries every role, so it reads right before the element upgrades.
 *
 * - `itx-activation="manual"` moves focus with the arrow keys and selects on Enter or Space.
 * - `itx-hash` selects the tab whose panel matches the URL fragment.
 * - `itx-variant="segmented"`, and `itx-variant="segmented icon"`, choose the look. `itx-size` sets the size.
 *
 * Listen for `interop-tabs-change` to follow the selection, and call `select()` to change it from
 * code. The element owns `aria-selected`, the tabs' `tabindex` and the panels' `hidden`: write them
 * in the markup, and leave later changes to it.
 */
export class InteropTabsElement extends Element {
	static readonly observedAttributes = ['itx-activation', 'itx-hash'];

	#unbind: TabsBinding | null = null;

	/** Selects a tab from code, by the tab or by the id of the panel it controls. Fires `interop-tabs-change`. */
	select(tab: HTMLElement | string): void {
		const element =
			typeof tab === 'string'
				? Array.from(this.querySelectorAll<HTMLElement>('[role="tab"]')).find(
						(candidate) => candidate.getAttribute('aria-controls') === tab,
					)
				: tab;
		if (element) this.#unbind?.select(element);
	}

	connectedCallback(): void {
		this.#bind();
	}

	/** `moveBefore()` keeps the element bound where the browser supports it. Elsewhere a move disconnects and connects. */
	connectedMoveCallback(): void {}

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

if (typeof customElements !== 'undefined' && !customElements.get('interop-tabs')) {
	customElements.define('interop-tabs', InteropTabsElement);
}

declare global {
	interface HTMLElementTagNameMap {
		'interop-tabs': InteropTabsElement;
	}
}
