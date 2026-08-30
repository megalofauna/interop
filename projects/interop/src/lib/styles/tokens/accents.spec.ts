/**
 * Accent families — a family's steps, and the roles built on them.
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

			expect(resolve("--itx-colorway-solid", deep)).toEqual(
				resolve("--itx-colorway-solid", root),
			);
			expect(resolve("--itx-colorway-on-solid", deep)).toEqual(
				resolve("--itx-colorway-on-solid", root),
			);
		});

		it("holds the solid fill across colour schemes", () => {
			// The recorded win from amber-lab Strategy 2: the same vivid colour in
			// both schemes, rather than dark-mode mud.
			const light = makeRoot({}, "light");

			expect(resolve("--itx-colorway-solid", light)).toEqual(
				resolve("--itx-colorway-solid", root),
			);
			expect(resolve("--itx-colorway-on-solid", light)).toEqual(
				resolve("--itx-colorway-on-solid", root),
			);
		});
	});

	describe("roles are fixed steps, not surface-relative solves", () => {
		it("holds tint, border and text at one colour, whatever the depth", () => {
			// The inverse of what this asserted while roles were solved per layer.
			// A role is now a palette step, and a step is one colour everywhere —
			// that is the trade the ranks were retired for. Depth safety comes
			// from the elevation ramp being short, not from re-solving.
			const one = el(root, { "itx-layer": "" });
			const two = el(one, { "itx-layer": "" });

			for (const role of ["tint", "on-tint", "border", "text"]) {
				const token = `--itx-colorway-${role}`;
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
			expect(resolve("--itx-colorway-tint", light)).not.toEqual(
				resolve("--itx-colorway-tint", root),
			);
		});
	});

	describe("status families", () => {
		it("gives every status a solid and a label", () => {
			for (const status of ["danger", "info", "success", "warning"]) {
				expect(resolve(`--itx-${status}-solid`, root))
					.withContext(`--itx-${status}-solid`)
					.toBeTruthy();
				expect(resolve(`--itx-${status}-on-solid`, root))
					.withContext(`--itx-${status}-on-solid`)
					.toBeTruthy();
			}
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
				expect(resolve(`--itx-${status}-solid`, eighties))
					.withContext(`${status} should differ between palettes`)
					.not.toEqual(resolve(`--itx-${status}-solid`, root));
			}
		});

		it("gives eighties real per-family labels, not one flat value", () => {
			// seventies documents this as a dark-mode AA failure it had to fix;
			// eighties still carried the flat values before they were generated.
			const eighties = el(root, { "itx-status-palette": "eighties" });
			const labels = ["danger", "info", "success", "warning"].map((s) =>
				resolve(`--itx-${s}-on-solid`, eighties),
			);

			expect(new Set(labels).size).toBeGreaterThan(1);
		});
	});

	/*
	 * One colourway ships. The switching mechanism still has a contract, and
	 * breaking it is silent, so it is tested against a colourway defined here.
	 *
	 * The contract: a block that redeclares a family's steps must also
	 * redeclare its roles. A role written at [interop-root] composes there and
	 * inherits as a finished colour, so a block that changes only the steps
	 * keeps the root's roles.
	 */
	describe("a colourway block redeclares its roles", () => {
		let colorway: HTMLStyleElement;

		const define = (css: string) => {
			colorway = document.createElement("style");
			colorway.textContent = css;
			document.head.appendChild(colorway);
		};

		afterEach(() => colorway?.remove());

		/** Fourteen steps at a hue the shipped colourway does not use. */
		const steps = Array.from(
			{ length: 14 },
			(_, i) =>
				`--itx-colorway-${i + 1}: light-dark(oklch(${(0.97 - i * 0.06).toFixed(3)} 0.1 140), oklch(${(0.17 + i * 0.06).toFixed(3)} 0.1 140));`,
		).join("\n");

		const ROLES = ["tint", "on-tint", "border", "text"];

		it("moves every role when the block redeclares both", () => {
			define(`:where([itx-colorway="test"]) {
				${steps}
				--itx-colorway-tint: var(--itx-colorway-3);
				--itx-colorway-on-tint: var(--itx-colorway-13);
				--itx-colorway-border: var(--itx-colorway-9);
				--itx-colorway-text: var(--itx-colorway-11);
			}`);

			const swapped = el(root, { "itx-colorway": "test" });

			for (const role of ROLES) {
				const token = `--itx-colorway-${role}`;
				expect(resolve(token, swapped))
					.withContext(`${token} did not follow the colourway`)
					.not.toEqual(resolve(token, root));
			}
		});

		it("leaves roles behind when the block redeclares only the steps", () => {
			define(`:where([itx-colorway="test"]) { ${steps} }`);

			const swapped = el(root, { "itx-colorway": "test" });

			expect(resolve("--itx-colorway-3", swapped)).not.toEqual(
				resolve("--itx-colorway-3", root),
			);
			expect(resolve("--itx-colorway-tint", swapped)).toEqual(
				resolve("--itx-colorway-tint", root),
			);
		});

		it("follows the colourway at depth", () => {
			define(`:where([itx-colorway="test"]) {
				${steps}
				--itx-colorway-border: var(--itx-colorway-9);
			}`);

			const deep = (host: HTMLElement) =>
				el(el(host, { "itx-layer": "" }), { "itx-layer": "" });

			expect(
				resolve(
					"--itx-colorway-border",
					deep(el(root, { "itx-colorway": "test" })),
				),
			).not.toEqual(resolve("--itx-colorway-border", deep(root)));
		});
	});
});
