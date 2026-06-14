/*
 * Upgrade pass — semantic HTML (from marked) → interop component markup.
 *
 * This is the Layer 1 boundary in action. Some interop components are a pure
 * CSS contract: a tag + class skeleton their stylesheet targets, with no
 * behaviour. For those we don't instantiate anything — we rewrite the DOM into
 * the shape the CSS keys on, and inert tags pick up the styling.
 *
 * Because the rewrite emits custom-element tags (interop-table, itx-inline-code),
 * the result MUST bypass Angular's HTML sanitizer, which would otherwise unwrap
 * unknown elements. Content is first-party (authored in this repo), so that's
 * sound — see ContentPage where the bypass happens.
 *
 * Deliberately NOT handled here: behaviour-contract components. A code fence
 * wants itx-code-block's shiki highlighting + tabs + copy button, and a
 * sortable table wants the real directive — those need instantiation (Layer 2)
 * and can't be faked with markup, so block code is left as a plain <pre>.
 *
 * This is the one file the whole component-mapping question lives in. Today it
 * does string-shaped DOM surgery; swapping it for an AST walk that instantiates
 * components is the Layer 2 move, and nothing upstream or downstream changes.
 */

/** Rewrite marked's HTML into interop markup. Browser-only (uses `document`). */
export function upgradeContentHtml(html: string): string {
	const template = document.createElement("template");
	template.innerHTML = html;
	upgradeTables(template.content);
	upgradeInlineCode(template.content);
	return template.innerHTML;
}

/**
 * GFM table → interop-table skeleton:
 *
 *   <interop-table>
 *     <div class="interop-table__scroll">
 *       <table class="interop-table__table"> … class-tagged rows/cells … </table>
 *     </div>
 *   </interop-table>
 */
function upgradeTables(root: DocumentFragment): void {
	for (const table of Array.from(root.querySelectorAll("table"))) {
		table.classList.add("interop-table__table");
		const tag = (selector: string, className: string): void => {
			for (const el of Array.from(table.querySelectorAll(selector)))
				el.classList.add(className);
		};
		tag("thead tr", "interop-table-header-row");
		tag("thead th", "interop-table-header-cell");
		tag("tbody tr", "interop-table-row");
		tag("tbody td", "interop-table-cell");

		const host = document.createElement("interop-table");
		const scroll = document.createElement("div");
		scroll.className = "interop-table__scroll";
		table.replaceWith(host);
		scroll.appendChild(table);
		host.appendChild(scroll);
	}
}

/**
 * Inline `<code>` → itx-inline-code chip. Block code (`<pre><code>`) is left
 * alone — that's a behaviour-contract component (Layer 2).
 */
function upgradeInlineCode(root: DocumentFragment): void {
	for (const code of Array.from(root.querySelectorAll("code"))) {
		if (code.closest("pre")) continue;

		const host = document.createElement("itx-inline-code");
		const inner = document.createElement("code");
		inner.className = "itx-ic__code";
		inner.textContent = code.textContent;
		host.appendChild(inner);
		code.replaceWith(host);
	}
}
