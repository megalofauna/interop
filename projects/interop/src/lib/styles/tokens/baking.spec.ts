/**
 * Token baking — the rule every cross-cutting system in this library depends on.
 *
 * A custom property is substituted where it is DECLARED, using that element's
 * computed values. So a theme alias parked on [interop-root]:
 *
 *   :where([interop-root]) { --itx-chip-transition-duration: var(--itx-duration-fast); }
 *
 * freezes at the root. A media override that ALSO lands on the root still works
 * — same element, so it applies before the alias substitutes. A consumer
 * override on a SUBTREE does not, and that is the half that keeps getting
 * shipped by accident.
 *
 * These two facts look contradictory until you see them side by side, which is
 * why they are asserted together here rather than reasoned about in a comment.
 */

/* prettier-ignore */
const BAKED_CSS = `
	.bk-root {
		--itx-duration-base: 200ms;
		--itx-duration-fast: calc(var(--itx-duration-base) * 0.5);

		/* THE ANTI-PATTERN — a component alias parked on the root. */
		--itx-baked-duration: var(--itx-duration-fast);
	}

	/* Stands in for the reduced-motion media rule, which also targets the root. */
	.bk-root.reduced { --itx-duration-base: 0ms; }

	.baked { transition-duration: var(--itx-baked-duration); }

	/* THE CORRECT SHAPE — the chain lives in the structural rule. */
	.chained { transition-duration: var(--itx-chained-duration, var(--itx-duration-fast)); }
`;

describe("Token baking — why a root alias is not equivalent to a chain", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, cls = ""): HTMLElement => {
		const node = document.createElement("div");
		if (cls) node.className = cls;
		parent.appendChild(node);
		return node;
	};

	const dur = (node: HTMLElement) => getComputedStyle(node).transitionDuration;

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = BAKED_CSS;
		document.head.appendChild(style);
		root = el(document.body, "bk-root");
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("both shapes agree by default", () => {
		expect(dur(el(root, "baked"))).toEqual("0.1s");
		expect(dur(el(root, "chained"))).toEqual("0.1s");
	});

	it("a root-level media override reaches BOTH — this is why the bug hides", () => {
		// The reduced-motion and high-contrast rules target [interop-root], the
		// same element the alias sits on, so the alias substitutes after them.
		root.classList.add("reduced");
		expect(dur(el(root, "baked"))).toEqual("0s");
		expect(dur(el(root, "chained"))).toEqual("0s");
	});

	it("a SUBTREE override reaches only the chained shape", () => {
		const branch = el(root);
		branch.style.setProperty("--itx-duration-fast", "0ms");

		expect(dur(el(branch, "chained"))).toEqual("0s"); // follows
		expect(dur(el(branch, "baked"))).toEqual("0.1s"); // frozen at the root
	});

	it("a subtree rescale of the BASE reaches NEITHER — the ramp itself bakes", () => {
		// A second, independent instance of the same rule, one level up: the ramp
		// step `--itx-duration-fast: calc(var(--itx-duration-base) * 0.5)` is
		// declared on the root, so it substitutes there. Rescaling the base on a
		// subtree changes an input to a calculation that already ran.
		//
		// This is why a chain alone is not sufficient — it makes the LEAF tokens
		// overridable anywhere, but the DERIVED ramp is still root-only. Rescaling
		// a whole subtree needs the ramp re-declared there; see [itx-scale-scope]
		// in tokens/shape.css.
		const branch = el(root);
		branch.style.setProperty("--itx-duration-base", "1000ms");

		expect(dur(el(branch, "chained"))).toEqual("0.1s");
		expect(dur(el(branch, "baked"))).toEqual("0.1s");
	});

	it("re-declaring the ramp on the subtree is what makes a base rescale work", () => {
		const branch = el(root);
		branch.style.setProperty("--itx-duration-base", "1000ms");
		// What a scope attribute does: re-derive the step HERE, so it substitutes
		// against this element's base rather than the root's.
		branch.style.setProperty("--itx-duration-fast", "calc(var(--itx-duration-base) * 0.5)");

		expect(dur(el(branch, "chained"))).toEqual("0.5s");
	});
});
