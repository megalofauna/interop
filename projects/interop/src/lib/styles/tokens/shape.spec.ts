/**
 * Radius system — the global knob and its override contract.
 *
 * `--itx-radius` is the one value every component falls back to. The contract
 * is that setting it ANYWHERE — root, a subtree, a single element — reaches
 * every component below, and that more specific intent still wins.
 *
 * These assert it rather than assume it, because the shape that fails looks
 * almost identical to the shape that works. If a theme declared
 * `--itx-button-radius-default: var(--itx-radius)` on [interop-root] instead of
 * on the button, the property would substitute AT THE ROOT and freeze; every
 * mid-tree override below would silently do nothing. That is exactly how the
 * focus system was broken before ITX-42, so it is worth a test that fails loudly.
 */

/* prettier-ignore */
const SHAPE_CSS = `
	.shape-root {
		--itx-radius-none: 0px;
		--itx-radius-md: 8px;

		/* The global knob, defaulting to square. */
		--itx-radius: var(--itx-radius-none);
	}

	/* The per-element attribute, non-inheriting so it cannot leak downward. */
	@property --itx-radius-attr { syntax: "*"; inherits: false; }
	.shape-root [itx-radius="md"] { --itx-radius-attr: var(--itx-radius-md); }

	/*
	 * A participating component, exactly as the library writes it: the whole
	 * chain lives in the STRUCTURAL rule and stays unresolved until the element.
	 * A component that follows the knob declares no theme default at all.
	 */
	.widget {
		border-radius: var(--itx-widget-border-radius,
			var(--itx-radius-attr,
				var(--itx-radius)));
	}

	/* A component that PINS its shape — a pill is a pill. */
	.pill { --itx-pill-radius-default: 9999px; }
	.pill { border-radius: var(--itx-pill-border-radius, var(--itx-pill-radius-default)); }

	/*
	 * The ANTI-PATTERN, kept here on purpose: a theme alias parked on the root.
	 * It reads the knob, so it looks equivalent to .widget — and it is not.
	 */
	.shape-root { --itx-baked-radius: var(--itx-radius); }
	.baked { border-radius: var(--itx-baked-radius); }
`;

describe("Radius system — global knob", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (
		parent: HTMLElement,
		cls = "",
		attrs: Record<string, string> = {},
	): HTMLElement => {
		const node = document.createElement("div");
		if (cls) node.className = cls;
		for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
		parent.appendChild(node);
		return node;
	};

	const radius = (node: HTMLElement) =>
		getComputedStyle(node).borderTopLeftRadius;

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = SHAPE_CSS;
		document.head.appendChild(style);
		root = el(document.body, "shape-root");
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("defaults to square, so adopting the knob changes nothing on screen", () => {
		expect(radius(el(root, "widget"))).toEqual("0px");
	});

	it("follows the knob set at the root", () => {
		root.style.setProperty("--itx-radius", "12px");
		expect(radius(el(root, "widget"))).toEqual("12px");
	});

	it("follows the knob set on ANY mid-tree ancestor, not just the root", () => {
		// The case a root-parked alias would silently fail.
		const branch = el(root);
		branch.style.setProperty("--itx-radius", "16px");

		expect(radius(el(branch, "widget"))).toEqual("16px");
		// A sibling outside that subtree is untouched.
		expect(radius(el(root, "widget"))).toEqual("0px");
	});

	it("lets the nearest ancestor win when the knob is set at two depths", () => {
		root.style.setProperty("--itx-radius", "4px");
		const branch = el(root);
		branch.style.setProperty("--itx-radius", "20px");

		expect(radius(el(branch, "widget"))).toEqual("20px");
		expect(radius(el(root, "widget"))).toEqual("4px");
	});

	it("lets the itx-radius attribute beat the global on the element carrying it", () => {
		root.style.setProperty("--itx-radius", "4px");
		expect(radius(el(root, "widget", { "itx-radius": "md" }))).toEqual("8px");
	});

	it("does not let the attribute leak into nested children", () => {
		// The reason the attribute token is registered non-inheriting: a container
		// marked itx-radius="md" must not round every descendant.
		root.style.setProperty("--itx-radius", "4px");
		const container = el(root, "", { "itx-radius": "md" });
		expect(radius(el(container, "widget"))).toEqual("4px");
	});

	it("lets a component token beat the global, and an instance beat that", () => {
		root.style.setProperty("--itx-radius", "4px");
		root.style.setProperty("--itx-widget-border-radius", "10px");

		const one = el(root, "widget");
		one.style.setProperty("--itx-widget-border-radius", "2px");

		expect(radius(one)).toEqual("2px");
		expect(radius(el(root, "widget"))).toEqual("10px");
	});

	it("leaves a pinned component alone when the knob moves", () => {
		root.style.setProperty("--itx-radius", "4px");
		expect(radius(el(root, "pill"))).toEqual("9999px");
	});

	it("demonstrates why a root-parked theme alias cannot work", () => {
		// 17 of the library's 29 radius defaults were written this way. The alias
		// substitutes on .shape-root, so it freezes at whatever the knob was THERE
		// — a mid-tree override changes an input to a calculation that already ran.
		// Kept as a test so the failure mode is executable rather than folklore.
		const branch = el(root);
		branch.style.setProperty("--itx-radius", "16px");

		expect(radius(el(branch, "baked"))).toEqual("0px"); // ignored the override
		expect(radius(el(branch, "widget"))).toEqual("16px"); // the correct shape
	});
});

/**
 * [itx-scale-scope] — rescaling a subtree.
 *
 * The knob sets ONE radius. This sets the whole ramp, proportionally, so a
 * subtree keeps the relationships between sm/md/lg while running bigger or
 * tighter. It exists because a derived step substitutes where it is declared:
 * without re-declaring the ramp, `--itx-radius-base` is root-only.
 */

/* prettier-ignore */
const SCOPE_CSS = `
	.sc-root { --itx-radius-base: 4px; }
	.sc-root, .sc-root [itx-scale-scope] {
		--itx-radius-1: var(--itx-radius-base);
		--itx-radius-2: calc(var(--itx-radius-base) * 2);
		--itx-radius-sm: var(--itx-radius-1);
		--itx-radius-md: var(--itx-radius-2);
	}
	.box { border-radius: var(--itx-radius-md); }
`;

describe("Radius system — [itx-scale-scope]", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, cls = "", attr?: string): HTMLElement => {
		const node = document.createElement("div");
		if (cls) node.className = cls;
		if (attr) node.setAttribute(attr, "");
		parent.appendChild(node);
		return node;
	};
	const radius = (n: HTMLElement) => getComputedStyle(n).borderTopLeftRadius;

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = SCOPE_CSS;
		document.head.appendChild(style);
		root = el(document.body, "sc-root");
	});
	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("derives the ramp from the base at the root", () => {
		expect(radius(el(root, "box"))).toEqual("8px");
	});

	it("rescales a subtree proportionally when the scope carries a new base", () => {
		const scope = el(root, "", "itx-scale-scope");
		scope.style.setProperty("--itx-radius-base", "8px");

		expect(radius(el(scope, "box"))).toEqual("16px"); // md re-derived
		expect(radius(el(root, "box"))).toEqual("8px"); // outside untouched
	});

	it("does NOT rescale without the attribute — the ramp stays root-derived", () => {
		// The behaviour that motivated the attribute: a bare base override below
		// the root changes an input to a calculation that already ran.
		const plain = el(root);
		plain.style.setProperty("--itx-radius-base", "8px");
		expect(radius(el(plain, "box"))).toEqual("8px");
	});

	it("lets a scope inherit a base from above rather than snapping to the default", () => {
		// Why the bases are declared on the root ALONE: if the scope block also
		// declared --itx-radius-base, every scope would reset it to 4px.
		const outer = el(root);
		outer.style.setProperty("--itx-radius-base", "10px");
		const scope = el(outer, "", "itx-scale-scope");

		expect(radius(el(scope, "box"))).toEqual("20px");
	});
});
