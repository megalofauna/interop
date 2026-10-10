/**
 * Accent families — one hue number each, and the roles derived from it.
 *
 * Runs the shipped CSS, same as elevation.spec.ts.
 */
import { ENGINE_CSS, LADDER_CSS } from "./ladder.css-source";

describe("Accent families", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (
		parent: HTMLElement,
		attrs: Record<string, string> = {},
	): HTMLElement => {
		const node = document.createElement("div");
		for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
		parent.appendChild(node);
		return node;
	};

	/** Resolve a token to a real colour by painting a probe with it. */
	const resolve = (token: string, host: HTMLElement): string => {
		const probe = el(host);
		probe.style.backgroundColor = `var(${token})`;
		return getComputedStyle(probe).backgroundColor;
	};

	const makeRoot = (
		attrs: Record<string, string> = {},
		scheme = "dark",
	): HTMLElement => {
		const node = el(document.body, { "interop-root": "", ...attrs });
		node.style.colorScheme = scheme;
		return node;
	};

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = `${LADDER_CSS}\n${ENGINE_CSS}`;
		document.head.appendChild(style);
		root = makeRoot();
	});

	afterEach(() => {
		style.remove();
		document.querySelectorAll("[interop-root]").forEach((n) => n.remove());
	});

	describe("identity is invariant", () => {
		it("holds the solid fill across layers", () => {
			// A brand colour that drifts as it gets nested is not an identity.
			const deep = el(el(el(root, { "itx-layer": "" }), { "itx-layer": "" }), {
				"itx-layer": "",
			});

			expect(resolve("--itx-role-background-colorway", deep)).toEqual(
				resolve("--itx-role-background-colorway", root),
			);
			expect(resolve("--itx-role-text-inverse", deep)).toEqual(
				resolve("--itx-role-text-inverse", root),
			);
		});

		it("holds the solid fill across colour schemes", () => {
			// The recorded win from amber-lab Strategy 2: the same vivid colour in
			// both schemes, rather than dark-mode mud.
			const light = makeRoot({}, "light");

			expect(resolve("--itx-role-background-colorway", light)).toEqual(
				resolve("--itx-role-background-colorway", root),
			);
			expect(resolve("--itx-role-text-inverse", light)).toEqual(
				resolve("--itx-role-text-inverse", root),
			);
		});
	});

	describe("roles are absolute, not surface-relative solves", () => {
		it("holds the wash, the edge and the text at one colour, whatever the depth", () => {
			// The inverse of what this asserted while roles were solved per layer.
			// A role is one colour everywhere — that is the trade the ranks were
			// retired for. Depth safety comes from the ramp being short and from
			// every role being measured at every depth, not from re-solving.
			const one = el(root, { "itx-layer": "" });
			const two = el(one, { "itx-layer": "" });

			for (const role of [
				"background-colorway-subtle",
				"edge-colorway",
				"text-colorway",
			]) {
				const token = `--itx-role-${role}`;
				expect(resolve(token, one))
					.withContext(`${token} should not move between layer 0 and 1`)
					.toEqual(resolve(token, root));
				expect(resolve(token, two))
					.withContext(`${token} should not move between layer 1 and 2`)
					.toEqual(resolve(token, one));
			}
		});

		it("differs between schemes, unlike the solid", () => {
			const light = makeRoot({}, "light");
			expect(
				resolve("--itx-role-background-colorway-subtle", light),
			).not.toEqual(resolve("--itx-role-background-colorway-subtle", root));
		});
	});

	describe("status families", () => {
		it("gives every status a solid and a label", () => {
			for (const status of ["danger", "info", "success", "warning"]) {
				expect(resolve(`--itx-role-background-${status}`, root))
					.withContext(`--itx-role-background-${status}`)
					.toBeTruthy();
			}
			expect(resolve("--itx-role-text-inverse", root)).toBeTruthy();
		});

		it("swaps the whole set on a PLAIN DESCENDANT carrying itx-status-palette", () => {
			// Deliberately not a root. The demo binds [attr.itx-status-palette] on an
			// ordinary <div> wrapping the toast viewport, and an earlier revision
			// emitted the numbers in the variant block but the composition only on
			// [interop-root] — so the swap resolved at the root, inherited already
			// substituted, and did nothing here. Asserting on a root hides this,
			// because both blocks then land on the same element.
			const eighties = el(root, { "itx-status-palette": "eighties" });

			for (const status of ["danger", "success", "warning"]) {
				expect(resolve(`--itx-role-background-${status}`, eighties))
					.withContext(`${status} should differ between palettes`)
					.not.toEqual(resolve(`--itx-role-background-${status}`, root));
			}
		});

		it("needs no per-family label, because one clears every fill", () => {
			// Four tokens the measurements retired rather than renamed. The worst
			// reading is 4.75 on info, against a 4.5 floor, and every fill is
			// scheme-invariant — so the label is too.
			const eighties = el(root, { "itx-status-palette": "eighties" });

			expect(resolve("--itx-role-text-inverse", eighties)).toEqual(
				resolve("--itx-role-text-inverse", root),
			);
		});
	});

	/*
	 * One colourway ships. The switching mechanism still has a contract, and
	 * breaking it is silent, so it is tested against a colourway defined here.
	 *
	 * The contract: a block that redeclares a family's HUE must also redeclare
	 * its roles. A role written at [interop-root] composes there and inherits as
	 * a finished colour, so a block that changes only the hue keeps the root's
	 * roles — the whole swap resolves to nothing, visibly correct in the
	 * stylesheet and inert on screen.
	 */
	describe("a colourway block redeclares its roles", () => {
		let colorway: HTMLStyleElement;

		const define = (css: string) => {
			colorway = document.createElement("style");
			colorway.textContent = css;
			document.head.appendChild(colorway);
		};

		afterEach(() => colorway?.remove());

		/** A hue the shipped colourway does not use. */
		const HUE = "--itx-colorway-hue: 140;";
		const ROLES = [
			"--itx-role-background-colorway",
			"--itx-role-background-colorway-subtle",
			"--itx-role-edge-colorway",
			"--itx-role-text-colorway",
		];
		const derived = ROLES.map((r) =>
			r.endsWith("-subtle")
				? `${r}: light-dark(oklch(0.89 0.064 140), oklch(0.28 0.064 140));`
				: r.endsWith("colorway") && r.startsWith("--itx-role-background")
					? `${r}: oklch(0.5 0.16 140);`
					: `${r}: light-dark(oklch(0.4 0.16 140), oklch(0.8 0.16 140));`,
		).join("\n");

		it("moves every role when the block redeclares both", () => {
			define(`:where([itx-colorway="test"]) { ${HUE} ${derived} }`);

			const swapped = el(root, { "itx-colorway": "test" });

			for (const token of ROLES) {
				expect(resolve(token, swapped))
					.withContext(`${token} did not follow the colourway`)
					.not.toEqual(resolve(token, root));
			}
		});

		it("leaves roles behind when the block redeclares only the hue", () => {
			define(`:where([itx-colorway="test"]) { ${HUE} }`);

			const swapped = el(root, { "itx-colorway": "test" });

			expect(
				getComputedStyle(swapped).getPropertyValue("--itx-colorway-hue").trim(),
			).toEqual("140");
			for (const token of ROLES) {
				expect(resolve(token, swapped))
					.withContext(`${token} should have kept the root's value`)
					.toEqual(resolve(token, root));
			}
		});

		it("follows the colourway at depth", () => {
			define(`:where([itx-colorway="test"]) { ${HUE} ${derived} }`);

			const deep = (host: HTMLElement) =>
				el(el(host, { "itx-layer": "" }), { "itx-layer": "" });

			expect(
				resolve(
					"--itx-role-edge-colorway",
					deep(el(root, { "itx-colorway": "test" })),
				),
			).not.toEqual(resolve("--itx-role-edge-colorway", deep(root)));
		});
	});
});
