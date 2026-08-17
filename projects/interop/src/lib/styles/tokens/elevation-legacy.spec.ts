/**
 * Elevation — proof of the legacy "sliding window" failure.
 *
 * This spec exists to pin down WHY the colour system is being rewritten, and it
 * asserts the BROKEN behaviour on purpose. It is deleted together with the last
 * of the legacy rules.
 *
 * `docs/ELEVATION_SYSTEM.md` justified the sliding window with this claim:
 *
 *   "Custom properties declared in the same rule block resolve against
 *    inherited (parent) values, not sibling declarations in the same block.
 *    There is no circularity."
 *
 * That is false. Per css-variables-1 §2, "Variables always draw from the
 * computed value of the associated custom property ON THE SAME ELEMENT", so
 * same-block declarations do see each other. `.agent/workflows/carbon-borrow.md`
 * has the rule stated correctly; the two documents contradict, and the shipped
 * code was built on the wrong one.
 *
 * Two distinct failure modes follow, and both are asserted below.
 *
 * The CSS under test is copied VERBATIM from the shipped files — paraphrasing it
 * would prove only that the paraphrase is broken:
 *   projects/interop/src/lib/styles/tokens/elevation.css
 *   projects/interop/src/lib/styles/themes/protocol/foundation.css
 */

/* prettier-ignore */
const LEGACY_CSS = `
@property --itx-elevation {
	syntax: "<integer>";
	inherits: true;
	initial-value: 0;
}

/* foundation.css — neutral palette + elevation slots, verbatim */
.legacy-root {
	color-scheme: dark;

	--itx-neutral-1: light-dark(oklch(0.99 0.003 250), oklch(0.1 0.003 250));
	--itx-neutral-2: light-dark(oklch(0.96 0.005 250), oklch(0.15 0.004 250));
	--itx-neutral-3: light-dark(oklch(0.93 0.007 250), oklch(0.22 0.005 250));
	--itx-neutral-4: light-dark(oklch(0.89 0.008 250), oklch(0.27 0.006 250));
	--itx-neutral-5: light-dark(oklch(0.83 0.012 250), oklch(0.33 0.007 250));
	--itx-neutral-6: light-dark(oklch(0.76 0.012 250), oklch(0.38 0.009 250));
	--itx-neutral-7: light-dark(oklch(0.68 0.012 250), oklch(0.46 0.01 250));
	--itx-neutral-8: light-dark(oklch(0.58 0.011 250), oklch(0.55 0.01 250));

	--_e-n5: light-dark(var(--itx-neutral-7), var(--itx-neutral-1));
	--_e-n4: light-dark(var(--itx-neutral-6), var(--itx-neutral-1));
	--_e-n3: light-dark(var(--itx-neutral-5), var(--itx-neutral-1));
	--_e-n2: light-dark(var(--itx-neutral-4), var(--itx-neutral-2));
	--_e-n1: light-dark(var(--itx-neutral-3), var(--itx-neutral-2));
	--_e-0: light-dark(var(--itx-neutral-2), var(--itx-neutral-3));
	--_e-p1: light-dark(var(--itx-neutral-1), var(--itx-neutral-4));
	--_e-p2: light-dark(var(--itx-neutral-1), var(--itx-neutral-5));
	--_e-p3: light-dark(var(--itx-neutral-1), var(--itx-neutral-6));
	--_e-p4: light-dark(var(--itx-neutral-1), var(--itx-neutral-7));
	--_e-p5: light-dark(var(--itx-neutral-1), var(--itx-neutral-8));

	--itx-surface: var(--_e-0);
	--itx-surface-above: var(--_e-p1);
	--itx-surface-below: var(--_e-n1);
}

/* elevation.css — Raise by 1, verbatim */
:where([itx-raise]) {
	--_e-n5: var(--_e-n4);
	--_e-n4: var(--_e-n3);
	--_e-n3: var(--_e-n2);
	--_e-n2: var(--_e-n1);
	--_e-n1: var(--_e-0);
	--_e-0: var(--_e-p1);
	--_e-p1: var(--_e-p2);
	--_e-p2: var(--_e-p3);
	--_e-p3: var(--_e-p4);
	--_e-p4: var(--_e-p5);

	--itx-surface: var(--_e-0);
	--itx-surface-above: var(--_e-p1);
	--itx-surface-below: var(--_e-n1);
	--itx-elevation: calc(var(--itx-elevation) + 1);
	background-color: var(--itx-surface);
}

/* elevation.css — Raise by 3, verbatim. Note --_e-p3: var(--_e-p3). */
:where([itx-raise="3"]) {
	--_e-n3: var(--_e-0);
	--_e-n2: var(--_e-p1);
	--_e-n1: var(--_e-p2);
	--_e-0: var(--_e-p3);
	--_e-p1: var(--_e-p3);
	--_e-p2: var(--_e-p3);
	--_e-p3: var(--_e-p3);

	--itx-surface: var(--_e-0);
	--itx-surface-above: var(--_e-p1);
	--itx-surface-below: var(--_e-n1);
	--itx-elevation: calc(var(--itx-elevation) + 3);
	background-color: var(--itx-surface);
}

/* Probes — resolve a named ramp step to a real sRGB colour for comparison. */
.probe-n4 { background-color: var(--itx-neutral-4); }
.probe-n8 { background-color: var(--itx-neutral-8); }
`;

describe("Elevation — legacy sliding window (proof of failure)", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	/** Nest `depth` elements carrying `attr`, return the innermost. */
	const nest = (
		parent: HTMLElement,
		attr: string,
		value: string,
		depth: number,
	): HTMLElement => {
		let node = parent;
		for (let i = 0; i < depth; i++) {
			const child = document.createElement("div");
			child.setAttribute(attr, value);
			node.appendChild(child);
			node = child;
		}
		return node;
	};

	const probe = (className: string): string => {
		const el = document.createElement("div");
		el.className = className;
		root.appendChild(el);
		return getComputedStyle(el).backgroundColor;
	};

	const bg = (el: HTMLElement): string => getComputedStyle(el).backgroundColor;

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = LEGACY_CSS;
		document.head.appendChild(style);

		root = document.createElement("div");
		root.className = "legacy-root";
		document.body.appendChild(root);
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("resolves light-dark() against color-scheme (sanity check for the rest of this suite)", () => {
		const n4 = probe("probe-n4");
		const n8 = probe("probe-n8");

		// Chrome serialises a resolved oklch() background as oklch(), not rgb().
		expect(n4).toBeTruthy();
		expect(n8).toBeTruthy();
		// The dark branch must have been taken — the light values are 0.89 / 0.58.
		expect(n4).toContain("0.27");
		expect(n8).toContain("0.55");
		// Distinct steps must not collapse, or every assertion below is vacuous.
		expect(n4).not.toEqual(n8);
	});

	it("collapses the whole window on a single raise: --_e-0 resolves to the inherited --_e-p5, not --_e-p1", () => {
		const raised = nest(root, "itx-raise", "", 1);

		// What the design intended: one step up from neutral-3 is neutral-4.
		expect(bg(raised)).not.toEqual(probe("probe-n4"));

		// What actually happens: --_e-0 → --_e-p1 → ... → --_e-p4 → the inherited
		// --_e-p5, which is the only slot the rule block does not redeclare.
		expect(bg(raised)).toEqual(probe("probe-n8"));
	});

	it("does not compound: a second raise lands on the same colour as the first", () => {
		const once = nest(root, "itx-raise", "", 1);
		const twice = nest(root, "itx-raise", "", 2);

		expect(bg(twice)).toEqual(bg(once));
		expect(bg(twice)).toEqual(probe("probe-n8"));
	});

	it('poisons the subtree on [itx-raise="3"]: the self-edge --_e-p3: var(--_e-p3) is a cycle', () => {
		const raised3 = document.createElement("div");
		raised3.setAttribute("itx-raise", "3");
		root.appendChild(raised3);

		const descendant = document.createElement("div");
		descendant.style.backgroundColor = "var(--itx-surface)";
		raised3.appendChild(descendant);

		// Cycle → guaranteed-invalid. --_e-0 substitutes it, so --itx-surface is
		// guaranteed-invalid too, and background-color falls to `unset` → initial.
		expect(bg(raised3)).toEqual("rgba(0, 0, 0, 0)");

		// Guaranteed-invalid INHERITS, so descendants reading --itx-surface break
		// as well. This is the failure mode that is silent in light mode.
		expect(bg(descendant)).toEqual("rgba(0, 0, 0, 0)");
	});

	it("never increments --itx-elevation: calc(var(--itx-elevation) + 1) is a self-cycle", () => {
		const once = nest(root, "itx-raise", "", 1);
		const thrice = nest(root, "itx-raise", "", 3);

		const read = (el: HTMLElement) =>
			getComputedStyle(el).getPropertyValue("--itx-elevation").trim();

		// Registered <integer> with inherits:true, so invalid-at-computed-value-time
		// resolves to the INHERITED value rather than the initial one. It is 0 at
		// the root, so it is 0 everywhere, forever.
		expect(read(once)).toEqual("0");
		expect(read(thrice)).toEqual("0");
	});
});
