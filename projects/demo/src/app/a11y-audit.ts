/**
 * SPIKE — dev-mode contrast audit. Throwaway; see the plan.
 *
 * Answers Q4: if the system stops PREVENTING bad pairings and starts WARNING
 * about them, does the warning survive contact? A guard that cries wolf gets
 * switched off, which costs more than the coverage is worth.
 *
 * Walks every element that renders its own text, measures its colour against
 * the background it actually landed on, and reports what falls under AA.
 */
import { contrastRatio, effectiveBackground, usedValue } from "./pages/color/contrast";

export interface Finding {
	readonly selector: string;
	readonly ratio: number;
	readonly required: number;
	readonly text: string;
	readonly reason: string;
}

/** WCAG large text: 24px, or 18.66px bold. Those clear at 3:1 instead of 4.5:1. */
function requiredFor(el: Element): number {
	const style = getComputedStyle(el);
	const px = parseFloat(style.fontSize);
	const weight = Number(style.fontWeight) || 400;
	return px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
}

/** Text this element renders itself, ignoring what its children render. */
function ownText(el: Element): string {
	let out = "";
	for (const node of Array.from(el.childNodes)) {
		if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? "";
	}
	return out.trim();
}

function isVisible(el: Element): boolean {
	const style = getComputedStyle(el);
	if (style.visibility === "hidden" || style.display === "none") return false;
	if (Number(style.opacity) === 0) return false;
	const rect = el.getBoundingClientRect();
	return rect.width > 0 && rect.height > 0;
}

export function audit(root: ParentNode = document): Finding[] {
	const findings: Finding[] = [];
	for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
		const text = ownText(el);
		if (!text) continue;
		if (!isVisible(el)) continue;

		const fg = usedValue(el, "color");
		const bg = effectiveBackground(el);
		const ratio = contrastRatio(fg, bg);
		if (!Number.isFinite(ratio)) continue;

		const required = requiredFor(el);
		if (ratio >= required - 0.005) continue;

		findings.push({
			selector:
				el.tagName.toLowerCase() +
				(el.className && typeof el.className === "string"
					? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
					: ""),
			ratio: Math.round(ratio * 100) / 100,
			required,
			text: text.slice(0, 40),
			reason: `${fg} on ${bg}`,
		});
	}
	return findings;
}

/** Renders the result into the DOM so a headless --dump-dom can read it. */
export function reportIntoDom(): void {
	const findings = audit();
	const node = document.createElement("div");
	node.id = "a11y-audit";
	node.setAttribute("data-count", String(findings.length));
	node.style.display = "none";
	node.textContent = JSON.stringify(findings, null, 1);
	document.body.appendChild(node);
}
