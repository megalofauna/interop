/**
 * Accent families — the contract that a seed drives a whole family.
 *
 * There was previously no test of any kind covering colourway or status, which
 * is how the amber colourway shipped with a live defect: re-pointing the accent
 * from slot 8 to slot 5 moved most consumers and left the ones reading slots
 * 7/8 behind, so tree, code-block, resizable and visimorph rendered burnt
 * caramel while everything else changed. The last group here is that regression.
 *
 * Runs the REAL generated CSS, same as elevation.spec.ts.
 */
import { ENGINE_CSS, LADDER_CSS } from "./ladder.css-source";

describe("Accent families", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, attrs: Record<string, string> = {}): HTMLElement => {
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

	const makeRoot = (attrs: Record<string, string> = {}, scheme = "dark"): HTMLElement => {
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
			const deep = el(el(el(root, { "itx-layer": "" }), { "itx-layer": "" }), { "itx-layer": "" });

			expect(resolve("--itx-colorway-solid", deep)).toEqual(resolve("--itx-colorway-solid", root));
			expect(resolve("--itx-colorway-on-solid", deep)).toEqual(resolve("--itx-colorway-on-solid", root));
		});

		it("holds the solid fill across colour schemes", () => {
			// The recorded win from amber-lab Strategy 2: the same vivid colour in
			// both schemes, rather than dark-mode mud.
			const light = makeRoot({}, "light");

			expect(resolve("--itx-colorway-solid", light)).toEqual(resolve("--itx-colorway-solid", root));
			expect(resolve("--itx-colorway-on-solid", light)).toEqual(resolve("--itx-colorway-on-solid", root));
		});
	});

	describe("surface-relative roles re-derive", () => {
		it("moves tint, border and text with the layer", () => {
			const one = el(root, { "itx-layer": "" });
			const two = el(one, { "itx-layer": "" });

			for (const role of ["tint", "on-tint", "border", "text"]) {
				const token = `--itx-colorway-${role}`;
				expect(resolve(token, one))
					.withContext(`${token} should differ between layer 0 and 1`)
					.not.toEqual(resolve(token, root));
				expect(resolve(token, two))
					.withContext(`${token} should differ between layer 1 and 2`)
					.not.toEqual(resolve(token, one));
			}
		});

		it("differs between schemes, unlike the solid", () => {
			const light = makeRoot({}, "light");
			expect(resolve("--itx-colorway-tint", light)).not.toEqual(resolve("--itx-colorway-tint", root));
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

		it("swaps the whole set on itx-status-palette", () => {
			const eighties = makeRoot({ "itx-status-palette": "eighties" });

			for (const status of ["danger", "success", "warning"]) {
				expect(resolve(`--itx-${status}-solid`, eighties))
					.withContext(`${status} should differ between palettes`)
					.not.toEqual(resolve(`--itx-${status}-solid`, root));
			}
		});

		it("gives eighties real per-family labels, not one flat value", () => {
			// seventies documents this as a dark-mode AA failure it had to fix;
			// eighties still carried the flat values before they were generated.
			const eighties = makeRoot({ "itx-status-palette": "eighties" });
			const labels = ["danger", "info", "success", "warning"].map((s) =>
				resolve(`--itx-${s}-on-solid`, eighties),
			);

			expect(new Set(labels).size).toBeGreaterThan(1);
		});
	});

	describe("colourway switching — the amber regression", () => {
		it("moves EVERY accent role together, leaving nothing behind", () => {
			// The defect this replaces: re-pointing the accent moved some consumers
			// and not others, because the ones reading a slot index kept reading it.
			const amber = makeRoot({ "itx-colorway": "amber" });

			for (const role of ["solid", "on-solid", "tint", "on-tint", "border", "text"]) {
				const token = `--itx-colorway-${role}`;
				expect(resolve(token, amber))
					.withContext(`${token} did not follow the colourway switch`)
					.not.toEqual(resolve(token, root));
			}
		});

		it("keeps following the switch at depth", () => {
			const amber = makeRoot({ "itx-colorway": "amber" });
			const amberDeep = el(el(amber, { "itx-layer": "" }), { "itx-layer": "" });
			const baseDeep = el(el(root, { "itx-layer": "" }), { "itx-layer": "" });

			expect(resolve("--itx-colorway-border", amberDeep)).not.toEqual(
				resolve("--itx-colorway-border", baseDeep),
			);
		});
	});
});
