/**
 * Layer engine — the contract the colour system rests on.
 *
 * Runs the REAL generated CSS (imported as a string, not hand-copied), so this
 * cannot pass against a replica while the shipped file is broken. That is the
 * exact failure the previous implementation had: a design doc asserted a var()
 * resolution rule that does not exist, nothing exercised it, and the whole
 * mechanism was dead on arrival with zero consumers. See elevation-legacy.spec.ts.
 *
 * Two groups:
 *   "counts"   — depth compounds correctly through real DOM shapes.
 *   "overrides"— the governing principle holds mechanically: rules cohere by
 *                default, and overriding stays trivial everywhere.
 */
import { ENGINE_CSS, LADDER_CSS } from "./ladder.css-source";

describe("Layer engine", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, attrs: Record<string, string> = {}, tag = "div"): HTMLElement => {
		const node = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
		parent.appendChild(node);
		return node;
	};

	const layerOf = (node: HTMLElement): string => getComputedStyle(node).getPropertyValue("--itx-layer").trim();
	const surfaceOf = (node: HTMLElement): string => getComputedStyle(node).backgroundColor;

	/**
	 * Resolve a ramp entry to a real colour, composing it the same way the engine
	 * does — the theme publishes lightness numbers, not finished colours.
	 */
	const ramp = (name: string, host: HTMLElement = root): string => {
		const probe = el(host);
		probe.style.backgroundColor =
			`light-dark(oklch(var(--itx-ramp-${name}-light) var(--itx-tint-light)),` +
			` oklch(var(--itx-ramp-${name}-dark) var(--itx-tint-dark)))`;
		return getComputedStyle(probe).backgroundColor;
	};

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = `${LADDER_CSS}\n${ENGINE_CSS}`;
		document.head.appendChild(style);

		root = document.createElement("div");
		root.setAttribute("interop-root", "");
		root.style.colorScheme = "dark";
		document.body.appendChild(root);
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	describe("counts", () => {
		it("starts at layer 0 and paints the layer-0 surface", () => {
			expect(layerOf(root)).toEqual("0");
			expect(surfaceOf(root)).toEqual(ramp("surface-0"));
		});

		it("compounds: each nested [itx-layer] is one deeper than its parent", () => {
			const a = el(root, { "itx-layer": "" });
			const b = el(a, { "itx-layer": "" });
			const c = el(b, { "itx-layer": "" });

			expect([layerOf(a), layerOf(b), layerOf(c)]).toEqual(["1", "2", "3"]);
			expect(surfaceOf(a)).toEqual(ramp("surface-1"));
			expect(surfaceOf(b)).toEqual(ramp("surface-2"));
			expect(surfaceOf(c)).toEqual(ramp("surface-3"));
		});

		it("compounds through arbitrary intermediate DOM", () => {
			// A style query reads the nearest ANCESTOR container, and --itx-layer
			// inherits — so plain wrappers are transparent to the count. This is the
			// property that makes the system usable inside real component markup.
			const a = el(root, { "itx-layer": "" });
			const filler = el(el(el(a), {}, "section"), {}, "p");
			const b = el(filler, { "itx-layer": "" });

			expect(layerOf(a)).toEqual("1");
			expect(layerOf(b)).toEqual("2");
		});

		it("sinks, and nets correctly against raises", () => {
			const card = el(root, { "itx-layer": "" });
			const well = el(card, { "itx-sink": "" });
			const inner = el(well, { "itx-layer": "" });

			expect(layerOf(card)).toEqual("1");
			expect(layerOf(well)).toEqual("0");
			expect(layerOf(inner)).toEqual("1");
		});

		it("clamps at the ceiling instead of falling back to the tier-2 floor", () => {
			// Without a terminal block, an element already at the ceiling would match
			// no counter block, drop through to the one-step floor, and snap to 1.
			let node = root;
			for (let i = 0; i < 7; i++) node = el(node, { "itx-layer": "" });

			expect(layerOf(node)).toEqual("4");
			expect(surfaceOf(node)).toEqual(ramp("surface-4"));
		});

		it("clamps at the floor", () => {
			let node = root;
			for (let i = 0; i < 5; i++) node = el(node, { "itx-sink": "" });

			expect(layerOf(node)).toEqual("-2");
			expect(surfaceOf(node)).toEqual(ramp("surface-n2"));
		});

		it("honours an absolute pin regardless of inherited depth, and counts on from it", () => {
			// A dialog must not take its depth from wherever it happens to sit.
			const deep = el(el(el(root, { "itx-layer": "" }), { "itx-layer": "" }), { "itx-layer": "" });
			expect(layerOf(deep)).toEqual("3");

			const pinned = el(deep, { "itx-layer": "1" });
			expect(layerOf(pinned)).toEqual("1");
			expect(surfaceOf(pinned)).toEqual(ramp("surface-1"));

			expect(layerOf(el(pinned, { "itx-layer": "" }))).toEqual("2");
		});

		it("re-derives contrast ranks per layer, so a rank is never a fixed grey", () => {
			const a = el(root, { "itx-layer": "" });
			const b = el(a, { "itx-layer": "" });

			const rank = (node: HTMLElement) => {
				const probe = el(node);
				probe.style.backgroundColor = "var(--itx-contrast-3)";
				return getComputedStyle(probe).backgroundColor;
			};

			// Same token, different value at each depth — that is the whole point.
			expect(rank(a)).not.toEqual(rank(root));
			expect(rank(b)).not.toEqual(rank(a));
			expect(rank(a)).toEqual(ramp("contrast-3-1"));
		});
	});

	describe("overrides", () => {
		it("keeps a component token alive across two layer boundaries", () => {
			// The supported way to override. Layer blocks never touch a component
			// namespace, so it survives any depth.
			root.style.setProperty("--itx-card-background", "rgb(1, 2, 3)");

			const deep = el(el(root, { "itx-layer": "" }), { "itx-layer": "" });
			const card = el(deep);
			card.style.backgroundColor = "var(--itx-card-background)";

			expect(getComputedStyle(card).backgroundColor).toEqual("rgb(1, 2, 3)");
		});

		it("retints every layer below when the tint pack is set on any ancestor", () => {
			// The engine composes oklch() inside each layer block, not once at the
			// root, so the tint is still unresolved when it reaches a mid-tree
			// override. A whole-palette retint is one declaration, anywhere.
			const before = surfaceOf(el(root, { "itx-layer": "" }));

			const branch = el(root);
			branch.style.setProperty("--itx-tint-dark", "0.09 30");
			const after = surfaceOf(el(branch, { "itx-layer": "" }));

			expect(after).not.toEqual(before);
		});

		it("re-lightens every layer below when a ramp NUMBER is set on any ancestor", () => {
			// Same reason: the theme publishes lightness numbers rather than finished
			// colours, so an art-direction override reaches layers below it too.
			const branch = el(root);
			branch.style.setProperty("--itx-ramp-surface-1-dark", "0.9");

			const overridden = el(branch, { "itx-layer": "" });
			const untouched = el(root, { "itx-layer": "" });

			expect(surfaceOf(overridden)).not.toEqual(surfaceOf(untouched));
			expect(surfaceOf(overridden)).toEqual(ramp("surface-1", branch));
		});

		it("lets any consumer rule win on contact, at every depth", () => {
			const deep = el(el(root, { "itx-layer": "" }), { "itx-layer": "" });
			deep.style.backgroundColor = "rgb(9, 8, 7)";

			expect(surfaceOf(deep)).toEqual("rgb(9, 8, 7)");
		});

		it("DOES stomp a generic --itx-surface set on an ancestor — which is why overrides go through component namespaces", () => {
			// The negative case, asserted on purpose. Every layer block re-declares
			// --itx-surface unconditionally (it must: a custom property is
			// substituted where it is declared, so it cannot re-evaluate deeper
			// down). An override of the generic token therefore dies at the next
			// boundary. Documented here rather than left as folklore.
			root.style.setProperty("--itx-surface", "rgb(4, 5, 6)");
			expect(surfaceOf(root)).toEqual("rgb(4, 5, 6)");

			const below = el(root, { "itx-layer": "" });
			expect(surfaceOf(below)).not.toEqual("rgb(4, 5, 6)");
			expect(surfaceOf(below)).toEqual(ramp("surface-1"));
		});
	});
});
