/**
 * Focus system — the override contract.
 *
 * The point of the three-tier chain is that a consumer can set focus styles
 * globally and override at any level. The previous shape looked equivalent and
 * was not: theme files declared `--itx-button-outline-color:
 * var(--itx-focus-color)` on [interop-root], and a custom property is
 * substituted where it is DECLARED — so the value baked at the root and an
 * override anywhere else silently did nothing.
 *
 * These assert the contract rather than assume it. The mid-tree cases are the
 * ones that would have failed before.
 */

/* prettier-ignore */
const FOCUS_CSS = `
	.focus-root {
		--itx-focus-color: rgb(10, 20, 30);
		--itx-focus-width: 2px;
		--itx-focus-style: solid;
		--itx-focus-offset: 2px;
	}

	/* A component participating in the system, exactly as the library does. */
	.widget:focus-visible,
	.widget {
		outline: var(--itx-widget-focus-width, var(--itx-focus-width))
			var(--itx-widget-focus-style, var(--itx-focus-style))
			var(--itx-widget-focus-color, var(--itx-focus-color));
		outline-offset: var(--itx-widget-focus-offset, var(--itx-focus-offset));
	}
`;

describe("Focus system — override contract", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, cls = ""): HTMLElement => {
		const node = document.createElement("div");
		if (cls) node.className = cls;
		parent.appendChild(node);
		return node;
	};

	const ring = (node: HTMLElement) => {
		const s = getComputedStyle(node);
		return { color: s.outlineColor, width: s.outlineWidth, offset: s.outlineOffset };
	};

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = FOCUS_CSS;
		document.head.appendChild(style);
		root = el(document.body, "focus-root");
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("gives every participating component the system ring by default", () => {
		const r = ring(el(root, "widget"));
		expect(r.color).toEqual("rgb(10, 20, 30)");
		expect(r.width).toEqual("2px");
		expect(r.offset).toEqual("2px");
	});

	it("follows a global override set on ANY ancestor, not just the root", () => {
		// The case the previous shape got wrong. A theme alias declared on
		// [interop-root] substitutes there, so this override could not reach it.
		const branch = el(root);
		branch.style.setProperty("--itx-focus-color", "rgb(1, 2, 3)");
		branch.style.setProperty("--itx-focus-width", "4px");

		const inside = ring(el(branch, "widget"));
		expect(inside.color).toEqual("rgb(1, 2, 3)");
		expect(inside.width).toEqual("4px");

		// Siblings outside that subtree are untouched.
		expect(ring(el(root, "widget")).color).toEqual("rgb(10, 20, 30)");
	});

	it("lets a component token beat the system token", () => {
		root.style.setProperty("--itx-widget-focus-color", "rgb(4, 5, 6)");
		expect(ring(el(root, "widget")).color).toEqual("rgb(4, 5, 6)");
	});

	it("lets an instance beat the component token", () => {
		root.style.setProperty("--itx-widget-focus-color", "rgb(4, 5, 6)");

		const one = el(root, "widget");
		one.style.setProperty("--itx-widget-focus-color", "rgb(7, 8, 9)");

		expect(ring(one).color).toEqual("rgb(7, 8, 9)");
		expect(ring(el(root, "widget")).color).toEqual("rgb(4, 5, 6)");
	});

	it("carries a negative offset through, for the inset group", () => {
		// tree, segment, list-row, expansion-panel, chip-remove and field all
		// ring INSIDE their box so stacked instances do not collide.
		root.style.setProperty("--itx-widget-focus-offset", "-2px");
		expect(ring(el(root, "widget")).offset).toEqual("-2px");
	});
});
