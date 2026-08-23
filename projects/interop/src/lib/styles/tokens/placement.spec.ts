/**
 * Token placement — where a theme declaration goes, and why it matters.
 *
 * `tokens/shape.spec.ts` asserts the radius contract. This asserts the rule
 * underneath it, which applies to every component token: a theme declaration
 * belongs on the component's own selector.
 *
 * The three shapes look almost identical in a stylesheet and behave very
 * differently, which is why they are worth a test rather than a comment:
 *
 *   :where([interop-root])                        declares once, high up
 *   :where([interop-root], [itx-layer], …)        re-declares at every layer
 *   :where(the-component)                         declares at the element
 *
 * Each of these assertions was first run as a throwaway probe in a browser
 * while diagnosing why the checkbox had nowhere to set its corner radius.
 * They are here so the answers stay executable.
 */

/* prettier-ignore */
const PLACEMENT_CSS = `
	.p-root { --p-radius: 12px; --p-surface: rgb(10, 10, 10); }

	/* A layer boundary, standing in for [itx-layer]. Both re-declare the
	   surface, the way the real engine does. */
	.p-root, .p-layer { --p-surface: rgb(90, 90, 90); }
	.p-layer          { --p-surface: rgb(200, 200, 200); }

	/* A container publishing a nested radius for its children — this is
	   segmented-control's --itx-inner-radius. */
	.p-container { --p-inner: 4px; }

	/* THE THREE PLACEMENTS, each declaring the same value. */
	.p-root                { --ctl-high: var(--p-inner, var(--p-radius)); }
	.p-root, .p-layer      { --ctl-layer: var(--p-inner, var(--p-radius)); }
	:where(.p-component)   { --ctl-elem: var(--p-inner, var(--p-radius)); }

	/* The same three, for a layer-sensitive value. */
	.p-root, .p-layer      { --bg-layer: var(--p-surface); }
	:where(.p-component)   { --bg-elem: var(--p-surface); }

	/* A rig restyling a component it contains. Zero specificity on both, so
	   precedence is source order — this rule comes after the component's. */
	:where(.p-rig) :where(.p-component) { --ctl-elem: 99px; }
`;

describe("Token placement", () => {
	let style: HTMLStyleElement;
	let root: HTMLElement;

	const el = (parent: HTMLElement, cls = ""): HTMLElement => {
		const node = document.createElement("div");
		if (cls) node.className = cls;
		parent.appendChild(node);
		return node;
	};

	const prop = (node: HTMLElement, name: string) =>
		getComputedStyle(node).getPropertyValue(name).trim();

	beforeEach(() => {
		style = document.createElement("style");
		style.textContent = PLACEMENT_CSS;
		document.head.appendChild(style);
		root = el(document.body, "p-root");
	});

	afterEach(() => {
		style.remove();
		root.remove();
	});

	it("sees a container's published value only when declared on the component", () => {
		/*
		 * The whole reason --itx-control-radius sits on :where(interop-visimorph).
		 * A var() inside a custom property substitutes where it is DECLARED, so
		 * the two higher placements resolve where --p-inner does not exist and
		 * freeze at the fallback. Only the element-level one sees the container.
		 */
		const component = el(el(root, "p-container"), "p-component");

		expect(prop(component, "--ctl-elem")).toEqual("4px");
		expect(prop(component, "--ctl-high")).toEqual("12px");
		expect(prop(component, "--ctl-layer")).toEqual("12px");
	});

	it("still resolves a layer-sensitive value correctly at the component", () => {
		/*
		 * The objection to moving off the per-layer block, and it does not hold:
		 * --itx-surface* is registered `inherits: true`, so the element inherits
		 * the nearest boundary's value and reading it there gives the same answer
		 * co-declaration would. Measured identical at both depths.
		 */
		const shallow = el(root, "p-component");
		const deep = el(el(root, "p-layer"), "p-component");

		expect(prop(shallow, "--bg-elem")).toEqual(prop(shallow, "--bg-layer"));
		expect(prop(deep, "--bg-elem")).toEqual(prop(deep, "--bg-layer"));
		// …and the two depths genuinely differ, so this is not comparing nothing.
		expect(prop(deep, "--bg-elem")).not.toEqual(prop(shallow, "--bg-elem"));
	});

	it("wipes a consumer's override one layer down when declared per layer", () => {
		/*
		 * The cost of co-declaration. An override on a plain wrapper survives
		 * until the first boundary beneath it, which re-declares and resets it.
		 * This nearly shipped as a regression: adding a token to a per-layer
		 * block makes it LESS overridable than leaving it as a bare fallback.
		 */
		const wrapper = el(root);
		wrapper.style.setProperty("--ctl-layer", "7px");
		wrapper.style.setProperty("--ctl-high", "7px");

		expect(prop(el(wrapper), "--ctl-layer")).toEqual("7px");
		expect(prop(el(el(wrapper, "p-layer")), "--ctl-layer")).not.toEqual("7px");

		// Declared once, high up, it survives any depth.
		expect(prop(el(el(wrapper, "p-layer")), "--ctl-high")).toEqual("7px");
	});

	it("requires a rig to TARGET the component rather than rely on inheritance", () => {
		/*
		 * The trade that comes with element-level placement. An element's own
		 * declaration beats anything it inherits, so a rig setting a component's
		 * token on ITSELF no longer reaches — the toolbar's buttons went back to
		 * the base height and fill when the button theme moved. Targeting the
		 * component restores it, on source order, which is why protocol.css
		 * imports rigs after components.
		 */
		const viaInheritance = el(root, "p-rig-by-inheritance");
		viaInheritance.style.setProperty("--ctl-elem", "50px");
		expect(prop(el(viaInheritance, "p-component"), "--ctl-elem")).not.toEqual(
			"50px",
		);

		expect(prop(el(el(root, "p-rig"), "p-component"), "--ctl-elem")).toEqual(
			"99px",
		);
	});

	it("cannot subtract a unitless zero from a length in calc()", () => {
		/*
		 * How the nested radius stayed broken without anyone noticing.
		 * segmented-control published --itx-inner-radius as
		 * calc(<length> - var(--itx-…-track-padding)) with the padding declared
		 * as a bare `0`. calc() has no rule for <length> minus <number>, so the
		 * whole expression was invalid at computed-value time — and an invalid
		 * value does NOT trigger a var() fallback, it kills the property that
		 * used it. The mechanism was wired correctly and had never produced a
		 * value.
		 */
		const bad = el(root);
		bad.style.setProperty("border-radius", "calc(8px - 0)");
		expect(getComputedStyle(bad).borderTopLeftRadius).toEqual("0px");

		const good = el(root);
		good.style.setProperty("border-radius", "calc(8px - 0px)");
		expect(getComputedStyle(good).borderTopLeftRadius).toEqual("8px");
	});
});
