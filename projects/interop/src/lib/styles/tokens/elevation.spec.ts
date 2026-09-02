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
	 * The deepest layer the engine emits, read from the shipped engine's own
	 * absolute pins rather than written down here. These assertions used to
	 * carry the ceiling as a literal, and every change to the depth broke five
	 * of them for no reason worth reading.
	 */
	const CEILING = Math.max(
		...[...ENGINE_CSS.matchAll(/\[itx-layer="(\d+)"\]/g)].map((m) =>
			Number(m[1]),
		),
	);

	/**
	 * The surface oracle.
	 *
	 * Surfaces are authored values now, so there is no formula left to
	 * reimplement — reading one back would be an echo. What the engine can
	 * still get wrong is the MAP: which surface each depth indexes. The map is
	 * the identity, written here as the contract rather than assumed, and the
	 * lightness is read from the theme — so a change to either side shows up.
	 */
	const SURFACE_AT = [0, 1, 2] as const;

	const surfaceL = (scheme: "light" | "dark", layer: number): number => {
		const index = SURFACE_AT[Math.min(layer, SURFACE_AT.length - 1)];
		const found = LADDER_CSS.match(
			new RegExp(
				`--itx-surface-${index}:\\s*light-dark\\(\\s*` +
					`oklch\\(\\s*([\\d.]+)[\\s\\S]*?\\)\\s*,\\s*oklch\\(\\s*([\\d.]+)`,
			),
		);
		if (!found) throw new Error(`no --itx-surface-${index} in the theme`);
		return Number(scheme === "light" ? found[1] : found[2]);
	};

	/** Chrome resolves calc() and serializes as oklch(L C H). */
	const lightnessOf = (color: string): number => {
		const found = color.match(/oklch\(\s*([\d.]+)/);
		if (!found) throw new Error(`not an oklch colour: ${color}`);
		return Number(found[1]);
	};

	/** Assert a node paints the surface its layer computes to. */
	const expectSurface = (node: HTMLElement, layer: number): void =>
		expect(lightnessOf(surfaceOf(node))).toBeCloseTo(
			surfaceL("dark", layer),
			3,
		);

	const layerOf = (node: HTMLElement): string =>
		getComputedStyle(node).getPropertyValue("--itx-layer").trim();
	const surfaceOf = (node: HTMLElement): string =>
		getComputedStyle(node).backgroundColor;

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
			expectSurface(root, 0);
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
			nested.forEach((n, i) => expectSurface(n, i + 1));
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
			expectSurface(node, CEILING);
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
			expectSurface(node, CEILING);
		});

		it("honours an absolute pin regardless of inherited depth, and counts on from it", () => {
			// A dialog must not take its depth from wherever it happens to sit.
			const deep = el(el(el(root, { "itx-layer": "" }), { "itx-layer": "" }), {
				"itx-layer": "",
			});
			expect(layerOf(deep)).toEqual(String(Math.min(3, CEILING)));

			const pinned = el(deep, { "itx-layer": "1" });
			expect(layerOf(pinned)).toEqual("1");
			expectSurface(pinned, 1);

			expect(layerOf(el(pinned, { "itx-layer": "" }))).toEqual("2");
		});

		it("holds a role at exactly one colour, whatever the depth", () => {
			const a = el(root, { "itx-layer": "" });
			const b = el(a, { "itx-layer": "" });

			const paint = (node: HTMLElement, token: string) => {
				const probe = el(node);
				probe.style.backgroundColor = `var(${token})`;
				return getComputedStyle(probe).backgroundColor;
			};

			// The bargain: a role means one colour everywhere, so a developer can
			// hold it in their head. The surfaces still move underneath it.
			for (const node of [a, b])
				expect(paint(node, "--itx-role-text")).toEqual(
					paint(root, "--itx-role-text"),
				);
			expect(surfaceOf(a)).not.toEqual(surfaceOf(root));
		});

		it("moves the derived fills with the surface, which is the exception", () => {
			// The two roles computed FROM --itx-surface rather than authored
			// beside it. They have to move, or a hovered row at depth would paint
			// the page's hover colour.
			const a = el(root, { "itx-layer": "" });

			const paint = (node: HTMLElement, token: string) => {
				const probe = el(node);
				probe.style.backgroundColor = `var(${token})`;
				return getComputedStyle(probe).backgroundColor;
			};

			for (const token of [
				"--itx-role-background-interactive",
				"--itx-role-background-control",
			])
				expect(paint(a, token))
					.withContext(`${token} should follow the surface`)
					.not.toEqual(paint(root, token));
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

		it("retints the whole substrate when the tint pack is set at the root", () => {
			// Two declarations move all six surfaces, because chroma and hue live
			// in one pack rather than being repeated per value.
			const before = surfaceOf(el(root, { "itx-layer": "" }));
			root.style.setProperty("--itx-tint-dark", "0.09 30");

			expect(surfaceOf(el(root, { "itx-layer": "" }))).not.toEqual(before);
		});

		it("does NOT retint from mid-tree — the surfaces are composed at the root", () => {
			/*
			 * The trade behind declaring the six surfaces at [interop-root] alone.
			 * Repeating them on [itx-layer] would leave --itx-tint-* unresolved
			 * until the layer, so a mid-tree pack would reach it — but a
			 * declaration beats inheritance, so every layer would also stomp
			 * whatever a consumer set above it, and the values would stop being
			 * overridable. Retinting a subtree is redeclaring the surfaces on it,
			 * which the next test shows working.
			 */
			const before = surfaceOf(el(root, { "itx-layer": "" }));

			const branch = el(root);
			branch.style.setProperty("--itx-tint-dark", "0.09 30");

			expect(surfaceOf(el(branch, { "itx-layer": "" }))).toEqual(before);
		});

		it("moves every layer that indexes it when a surface VALUE is set on any ancestor", () => {
			// Retuning the ramp is redeclaring a surface, which is ordinary CSS and
			// is also how a subtree gets a different tint. The engine reads the six
			// values at use time rather than baking them, so an override on any
			// ancestor reaches every layer beneath it — and only the layers that
			// index that surface.
			const branch = el(root);
			branch.style.setProperty("--itx-surface-1", "rgb(9, 8, 7)");

			// Layer 1 indexes surface-1.
			expect(surfaceOf(el(branch, { "itx-layer": "" }))).toEqual(
				"rgb(9, 8, 7)",
			);
			// Layer 2 indexes surface-2 and is untouched.
			const two = el(el(branch, { "itx-layer": "" }), { "itx-layer": "" });
			expect(surfaceOf(two)).not.toEqual("rgb(9, 8, 7)");
			expect(surfaceOf(two)).toEqual(
				surfaceOf(el(el(root, { "itx-layer": "" }), { "itx-layer": "" })),
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
			expectSurface(below, 1);
		});
	});
	/**
	 * How a THEME may alias a layer-owned token into a component token.
	 *
	 * This is the rule the whole theme layer depends on, and getting it wrong is
	 * invisible: the component renders, in a plausible grey, just the wrong one.
	 * Fourteen theme files shipped the broken form.
	 */
	describe("component aliases onto a layer-owned token", () => {
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
				--itx-widget-background: var(--itx-surface);
			}`);

			const deep = el(root, { "itx-layer": "" });

			// The alias substituted --itx-surface at the ROOT, so what inherits
			// down is a finished colour: layer 0's grey, everywhere, forever.
			expect(painted(deep)).toEqual(painted(root));
		});

		it("tracks the layer when co-declared on the elevation boundaries — the fix", () => {
			theme(`:where([interop-root], [itx-layer], [itx-sink]) {
				--itx-widget-background: var(--itx-surface);
			}`);

			const deep = el(root, { "itx-layer": "" });

			expect(painted(deep)).not.toEqual(painted(root));
			// And it is the surface the deeper layer actually computes.
			const probe = el(deep);
			probe.style.backgroundColor = "var(--itx-surface)";
			expect(painted(deep)).toEqual(getComputedStyle(probe).backgroundColor);
		});

		it("still lets an ancestor override the component token", () => {
			// The ergonomic the bare-root form was written for, and the reason
			// co-declaration beats scoping the block to the component element:
			// a rule on the component itself would outrank this inherited value.
			theme(`:where([interop-root], [itx-layer], [itx-sink]) {
				--itx-widget-background: var(--itx-surface);
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
				--itx-widget-background: var(--itx-surface);
			}`);

			const region = el(root);
			region.style.setProperty("--itx-widget-background", "rgb(7, 8, 9)");
			const boundary = el(region, { "itx-layer": "" });

			expect(painted(boundary)).not.toEqual("rgb(7, 8, 9)");
		});
	});
});
