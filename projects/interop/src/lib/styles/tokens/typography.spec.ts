/**
 * Staked line-height — the mechanism, proven.
 *
 * `--itx-line-height` promises a CONSTANT leading over each element's own
 * font-size, so the resulting ratio loosens as text shrinks. That promise rests
 * on two facts about CSS that are easy to state wrongly and impossible to see
 * in a rendered page, which is why they are asserted here rather than trusted:
 *
 *   1. Staked leading needs an ABSOLUTE unit. A leading written in `em` scales
 *      with the font-size it is added to, which produces a constant ratio —
 *      exactly the behaviour the mechanism exists to avoid. The library shipped
 *      `--itx-lh-leading: 0.875em` and was therefore flat.
 *
 *   2. Units inside a custom property stay LIVE through an alias. A custom
 *      property's computed value is a token stream with `var()` references
 *      substituted; lengths are not resolved until the property is finally used
 *      in a real declaration. So `1em` in --itx-line-height resolves against the
 *      element that reads it, not the element that declared it — unlike a var()
 *      reference, which bakes where it is declared. Four theme files alias this
 *      token, so if that were wrong they would all be frozen.
 *
 * These are deliberately MECHANISM tests: they build the expression from the
 * same shape the token uses rather than importing the token file, so they stay
 * true if the chosen leading value changes.
 */
describe("Staked line-height", () => {
	let host: HTMLElement;

	const el = (parent: HTMLElement, css: Partial<CSSStyleDeclaration> = {}) => {
		const node = document.createElement("div");
		Object.assign(node.style, css);
		node.textContent = "Ag";
		parent.appendChild(node);
		return node;
	};

	/** Resolved line-height as a RATIO of the element's own font-size. */
	const ratio = (node: HTMLElement): number => {
		const cs = getComputedStyle(node);
		return parseFloat(cs.lineHeight) / parseFloat(cs.fontSize);
	};

	beforeEach(() => {
		host = document.createElement("div");
		document.body.appendChild(host);
	});

	afterEach(() => host.remove());

	describe("the unit of the leading decides everything", () => {
		it("em leading gives a CONSTANT ratio — the bug that shipped", () => {
			const expr = "clamp(1em, 1em + 0.875em, 3em)";
			const big = el(host, { fontSize: "48px", lineHeight: expr });
			const small = el(host, { fontSize: "12px", lineHeight: expr });

			// Identical, because the leading grew with the text.
			expect(ratio(big)).toBeCloseTo(ratio(small), 5);
			expect(ratio(big)).toBeCloseTo(1.875, 5);
		});

		it("absolute leading gives an INVERSE ratio — the intent", () => {
			const expr = "clamp(1em, 1em + 0.5rem, 3em)";
			const big = el(host, { fontSize: "48px", lineHeight: expr });
			const body = el(host, { fontSize: "16px", lineHeight: expr });
			const small = el(host, { fontSize: "12px", lineHeight: expr });

			// Bigger text, tighter ratio. Monotonic, which is the whole claim.
			expect(ratio(big)).toBeLessThan(ratio(body));
			expect(ratio(body)).toBeLessThan(ratio(small));

			expect(ratio(big)).toBeCloseTo(1 + 8 / 48, 2);
			expect(ratio(body)).toBeCloseTo(1.5, 2);
		});
	});

	describe("the bounds", () => {
		it("the ceiling binds for small text, which is what it is for", () => {
			// 12px + 8px = 1.667, above a 1.6 ceiling.
			const capped = el(host, {
				fontSize: "12px",
				lineHeight: "clamp(1em, 1em + 0.5rem, 1.6em)",
			});
			expect(ratio(capped)).toBeCloseTo(1.6, 3);
		});

		it("the floor cannot bind while the leading is positive", () => {
			// Documented as a negative: 1em + anything > 0 always clears a 1em
			// floor, so --itx-lh-tight only guards a negative override. Anyone
			// tuning it to fix gappy headings is adjusting a disconnected dial.
			const node = el(host, {
				fontSize: "48px",
				lineHeight: "clamp(1em, 1em + 0.5rem, 3em)",
			});
			expect(ratio(node)).toBeGreaterThan(1);
		});
	});

	describe("aliasing", () => {
		it("keeps 1em live — it resolves where it is READ, not where declared", () => {
			// The load-bearing fact for the four theme files that alias this
			// token. If lengths resolved at declaration time, every one of them
			// would freeze at its own font-size and the mechanism would be dead
			// downstream — the same failure mode as a baked var() reference,
			// which does NOT apply here.
			host.style.fontSize = "100px";
			host.style.setProperty("--lh", "clamp(1em, 1em + 0.5rem, 3em)");
			host.style.setProperty("--alias", "var(--lh)");

			const big = el(host, { fontSize: "48px", lineHeight: "var(--alias)" });
			const small = el(host, { fontSize: "12px", lineHeight: "var(--alias)" });

			// Declared on a 100px ancestor, through one alias, and each element
			// still resolves 1em against ITSELF.
			expect(ratio(big)).toBeCloseTo(1 + 8 / 48, 2);
			expect(ratio(small)).toBeCloseTo(1 + 8 / 12, 2);
			expect(ratio(big)).not.toBeCloseTo(ratio(small), 2);
		});
	});
});
