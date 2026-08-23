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
import { ENGINE_CSS, LADDER_CSS, SURFACE_L } from "./ladder.css-source";

describe("Layer engine", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (
		parent: HTMLElement,
		attrs: Record<string, string> = {},
		tag = "div",
	): HTMLElement => {
		const node = document.createElement(tag);
		for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
		parent.appendChild(node);
		return node;
	};

	/**
	 * The deepest layer the engine emits, read from the generated ramp rather
	 * than written down here. These assertions used to carry the ceiling as a
	 * literal, and every change to DEPTH broke five of them for no reason worth
	 * reading.
	 */
	const CEILING = Math.max(...Object.keys(SURFACE_L["dark"]).map(Number));

	const layerOf = (node: HTMLElement): string =>
		getComputedStyle(node).getPropertyValue("--itx-layer").trim();
	const surfaceOf = (node: HTMLElement): string =>
		getComputedStyle(node).backgroundColor;

	/**
	 * Resolve a ramp entry to a real colour, composing it the same way the engine
	 * does — the theme publishes lightness numbers, not finished colours.
	 *
	 * Surfaces take a different path from the ranks. Ranks are SOLVED per layer
	 * and published as discrete numbers, so the probe reads those. Surfaces are
	 * COMPUTED by the engine from the ramp spec, so reading a published number
	 * would only prove the engine agrees with itself; the probe uses SURFACE_L
	 * instead — the same formula evaluated in JS by the generator, which is an
	 * oracle the CSS cannot influence.
	 */
	const ramp = (name: string, host: HTMLElement = root): string => {
		const probe = el(host);
		if (name.startsWith("surface-")) {
			const layer = name.slice("surface-".length);
			probe.style.backgroundColor =
				`light-dark(oklch(${SURFACE_L["light"][layer]} var(--itx-tint-light)),` +
				` oklch(${SURFACE_L["dark"][layer]} var(--itx-tint-dark)))`;
		} else {
			probe.style.backgroundColor =
				`light-dark(oklch(var(--itx-ramp-${name}-light) var(--itx-tint-light)),` +
				` oklch(var(--itx-ramp-${name}-dark) var(--itx-tint-dark)))`;
		}
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
			const nested: HTMLElement[] = [];
			let node = root;
			for (let i = 0; i < CEILING; i++) {
				node = el(node, { "itx-layer": "" });
				nested.push(node);
			}

			expect(nested.map(layerOf)).toEqual(
				Array.from({ length: CEILING }, (_, i) => String(i + 1)),
			);
			nested.forEach((n, i) =>
				expect(surfaceOf(n)).toEqual(ramp(`surface-${i + 1}`)),
			);
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

		it("sinks count away from the page, exactly like raises", () => {
			/*
			 * A sink used to count DOWN and net against a raise, because tone
			 * carried direction: a recess was a step toward the page's opposite.
			 * Under one direction of travel both move away from the page by the
			 * same amount, and what separates them is the shadow rather than the
			 * tone. So a sink inside a card is deeper than the card, not back at
			 * the page — which is what every other system does, and what stops
			 * the light page having to sit at mid-grey to leave room both ways.
			 */
			const card = el(root, { "itx-layer": "" });
			const well = el(card, { "itx-sink": "" });
			const inner = el(well, { "itx-layer": "" });

			expect(layerOf(card)).toEqual("1");
			expect(layerOf(well)).toEqual("2");
			// Past the ceiling it clamps rather than counting on, which is the
			// whole point of capping the ramp at three shades.
			expect(layerOf(inner)).toEqual(String(Math.min(3, CEILING)));
		});

		it("clamps at the ceiling instead of falling back to the tier-2 floor", () => {
			// Without a terminal block, an element already at the ceiling would match
			// no counter block, drop through to the one-step floor, and snap to 1.
			let node = root;
			for (let i = 0; i < CEILING + 3; i++)
				node = el(node, { "itx-layer": "" });

			expect(layerOf(node)).toEqual(String(CEILING));
			expect(surfaceOf(node)).toEqual(ramp(`surface-${CEILING}`));
		});

		it("has no floor to clamp at — the ramp only goes one way", () => {
			/*
			 * There is no below any more. DEPTH.below is 0, the n1..n4 keys are
			 * gone, and a stack of sinks walks up to the ceiling like a stack of
			 * layers. The old floor test asserted the mirrored half of a ramp
			 * that no longer exists.
			 */
			let node = root;
			for (let i = 0; i < CEILING + 3; i++) node = el(node, { "itx-sink": "" });

			expect(layerOf(node)).toEqual(String(CEILING));
			expect(surfaceOf(node)).toEqual(ramp(`surface-${CEILING}`));
		});

		it("honours an absolute pin regardless of inherited depth, and counts on from it", () => {
			// A dialog must not take its depth from wherever it happens to sit.
			const deep = el(el(el(root, { "itx-layer": "" }), { "itx-layer": "" }), {
				"itx-layer": "",
			});
			expect(layerOf(deep)).toEqual(String(Math.min(3, CEILING)));

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

		it("re-scales EVERY layer below when a ramp DIAL is set on any ancestor", () => {
			// The ramp spec is read at use time rather than baked, so one number
			// retunes the whole ladder underneath it. Strictly more reach than the
			// per-layer numbers it replaced: those moved one rung, this moves all
			// of them, and the steps stay proportional to each other.
			const branch = el(root);
			branch.style.setProperty("--itx-ramp-dark-step", "0.09");

			const one = el(branch, { "itx-layer": "" });
			const two = el(one, { "itx-layer": "" });

			// page .17 + step .09 per rung, uniform in dark.
			const expected = (l: number): string => {
				const probe = el(branch);
				probe.style.backgroundColor = `oklch(${l} var(--itx-tint-dark))`;
				return getComputedStyle(probe).backgroundColor;
			};

			expect(surfaceOf(one)).toEqual(expected(0.17 + 0.09));
			expect(surfaceOf(two)).toEqual(expected(0.17 + 0.18));
			expect(surfaceOf(one)).not.toEqual(
				surfaceOf(el(root, { "itx-layer": "" })),
			);
		});

		it("no longer honours a per-layer ramp number — that override became a dial", () => {
			/*
			 * A deliberate, documented break. --itx-ramp-surface-N-light/dark used
			 * to be settable on any ancestor; the engine now computes lightness from
			 * the ramp spec and never reads those names, so they are gone rather
			 * than inert. Asserted so the removal stays visible instead of being
			 * rediscovered by whoever relied on it.
			 */
			const branch = el(root);
			branch.style.setProperty("--itx-ramp-surface-1-dark", "0.9");

			expect(surfaceOf(el(branch, { "itx-layer": "" }))).toEqual(
				surfaceOf(el(root, { "itx-layer": "" })),
			);
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
	/**
	 * How a THEME may alias a contrast rank into a component token.
	 *
	 * This is the rule the whole theme layer depends on, and getting it wrong is
	 * invisible: the component renders, in a plausible grey, just the wrong one.
	 * Fourteen theme files shipped the broken form.
	 */
	describe("component aliases onto a rank", () => {
		let themeStyle: HTMLStyleElement;

		const theme = (css: string) => {
			themeStyle = document.createElement("style");
			themeStyle.textContent = css;
			document.head.appendChild(themeStyle);
		};

		afterEach(() => themeStyle?.remove());

		/** Paint a probe with the component token and read it back. */
		const painted = (host: HTMLElement) => {
			const probe = el(host);
			probe.style.backgroundColor = "var(--itx-widget-background)";
			return getComputedStyle(probe).backgroundColor;
		};

		it("FREEZES when declared on the bare root — the bug", () => {
			theme(`:where([interop-root]) {
				--itx-widget-background: var(--itx-contrast-2);
			}`);

			const deep = el(root, { "itx-layer": "" });

			// The alias substituted --itx-contrast-2 at the ROOT, so what inherits
			// down is a finished colour: layer 0's grey, everywhere, forever.
			expect(painted(deep)).toEqual(painted(root));
		});

		it("tracks the layer when co-declared on the elevation boundaries — the fix", () => {
			theme(`:where([interop-root], [itx-layer], [itx-sink]) {
				--itx-widget-background: var(--itx-contrast-2);
			}`);

			const deep = el(root, { "itx-layer": "" });

			expect(painted(deep)).not.toEqual(painted(root));
			// And it is the rank the deeper layer actually solves for.
			const probe = el(deep);
			probe.style.backgroundColor = "var(--itx-contrast-2)";
			expect(painted(deep)).toEqual(getComputedStyle(probe).backgroundColor);
		});

		it("still lets an ancestor override the component token", () => {
			// The ergonomic the bare-root form was written for, and the reason
			// co-declaration beats scoping the block to the component element:
			// a rule on the component itself would outrank this inherited value.
			theme(`:where([interop-root], [itx-layer], [itx-sink]) {
				--itx-widget-background: var(--itx-contrast-2);
			}`);

			const region = el(root);
			region.style.setProperty("--itx-widget-background", "rgb(7, 8, 9)");

			expect(painted(region)).toEqual("rgb(7, 8, 9)");
		});

		it("but a layer boundary below that override reclaims the token", () => {
			// The negative case, asserted on purpose — the same trade-off
			// --itx-radius already makes at an [itx-scale-scope]. Co-declaration
			// means re-declaration, and re-declaration clobbers what it inherits.
			theme(`:where([interop-root], [itx-layer], [itx-sink]) {
				--itx-widget-background: var(--itx-contrast-2);
			}`);

			const region = el(root);
			region.style.setProperty("--itx-widget-background", "rgb(7, 8, 9)");
			const boundary = el(region, { "itx-layer": "" });

			expect(painted(boundary)).not.toEqual("rgb(7, 8, 9)");
		});
	});
});
