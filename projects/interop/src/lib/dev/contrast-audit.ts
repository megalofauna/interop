/**
 * Contrast audit — what the page ACTUALLY measures, in the browser.
 *
 * DEV TOOLING. Not exported from the public barrel — import it by path, the
 * same rule the icons follow:
 *
 *   import { auditContrast, reportContrast } from 'interop/lib/dev/contrast-audit';
 *
 * ── Why this exists ──────────────────────────────────────────────────────
 *
 * The generator proves every value clears its floor where it is DEFINED. That
 * cannot see a token used against the wrong surface, a fill role borrowed as
 * text, or a third-party colour that never went through the token system at
 * all. Those are failures at the point of USE, and the only instrument that
 * sees them is the browser rendering the page.
 *
 * On its first run against this repo's own demo it found three real defects,
 * including a status colour that loses 4.5:1 from one layer down — a fault
 * that had previously needed a purpose-built measuring rig to notice.
 *
 * ── Dedupe by cause, not by instance ─────────────────────────────────────
 *
 * The single most important thing here. A syntax-highlighted code block can
 * put the same wrong colour on fifty spans; reported raw that reads as fifty
 * problems and gets the tool switched off. Grouped by (selector, colour pair)
 * it reads as one, which is what it is. Measured on six demo pages: 110 raw
 * findings, 6 actual causes.
 */
import { contrastRatio, effectiveBackground, usedValue } from "./contrast";

/** One cause, and every place it shows up. */
export interface ContrastFinding {
	/** Coarse selector for the elements sharing this cause. */
	readonly selector: string;
	/** Worst ratio measured for this cause. */
	readonly ratio: number;
	/** The floor it had to clear — 3:1 for large text, else 4.5:1. */
	readonly required: number;
	/** How many elements share it. One cause, many instances. */
	readonly instances: number;
	/** Resolved foreground and background, for diagnosis. */
	readonly foreground: string;
	readonly background: string;
	/** A sample of the offending text, for locating it. */
	readonly sample: string;
	/** The first element, so a caller can highlight or inspect it. */
	readonly element: Element;
}

/**
 * WCAG large text: 24px, or 18.66px at 700+. Those clear at 3:1.
 *
 * Getting this wrong in the lenient direction hides real faults; getting it
 * wrong in the strict direction is what makes a tool feel like it cries wolf.
 */
function requiredFor(el: Element): number {
	const style = getComputedStyle(el);
	const px = Number.parseFloat(style.fontSize);
	const weight = Number(style.fontWeight) || 400;
	return px >= 24 || (px >= 18.66 && weight >= 700) ? 3 : 4.5;
}

/** Text this element renders ITSELF, ignoring what its descendants render. */
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

/** A coarse label for grouping: tag plus the first two classes. */
function labelOf(el: Element): string {
	const classes =
		typeof el.className === "string" && el.className.trim()
			? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".")
			: "";
	return el.tagName.toLowerCase() + classes;
}

/**
 * Measure every text-bearing element under `root` and return the causes that
 * fall short, worst first.
 *
 * Walks the whole subtree and reads computed styles, so it is a deliberate
 * one-shot: call it after a view settles, not on every change detection.
 */
export function auditContrast(root: ParentNode = document): ContrastFinding[] {
	if (typeof getComputedStyle === "undefined") return [];

	const byCause = new Map<string, ContrastFinding & { ratio: number }>();

	for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
		const sample = ownText(el);
		if (!sample || !isVisible(el)) continue;

		const foreground = usedValue(el, "color");
		const background = effectiveBackground(el);
		const ratio = contrastRatio(foreground, background);
		if (!Number.isFinite(ratio)) continue;

		const required = requiredFor(el);
		if (ratio >= required - 0.005) continue;

		const selector = labelOf(el);
		const key = `${selector}|${foreground}|${background}|${required}`;
		const existing = byCause.get(key);
		if (existing) {
			byCause.set(key, {
				...existing,
				instances: existing.instances + 1,
				ratio: Math.min(existing.ratio, ratio),
			});
			continue;
		}
		byCause.set(key, {
			selector,
			ratio,
			required,
			instances: 1,
			foreground,
			background,
			sample: sample.slice(0, 60),
			element: el,
		});
	}

	return [...byCause.values()].sort((a, b) => a.ratio - b.ratio);
}

/**
 * Audit and print. Returns the findings so a caller can assert on them.
 *
 * Prints nothing when the page is clean — a tool that announces its own
 * success on every load is one more thing to tune out.
 */
export function reportContrast(root: ParentNode = document): ContrastFinding[] {
	const findings = auditContrast(root);
	if (!findings.length) return findings;

	const instances = findings.reduce((n, f) => n + f.instances, 0);
	console.groupCollapsed(
		`%c⬤%c interop contrast — ${findings.length} cause${findings.length === 1 ? "" : "s"} under AA (${instances} element${instances === 1 ? "" : "s"})`,
		"color: #d33",
		"",
	);
	for (const f of findings) {
		console.warn(
			`${f.ratio.toFixed(2)}:1 (needs ${f.required}:1) — ${f.selector}` +
				`${f.instances > 1 ? ` ×${f.instances}` : ""}\n` +
				`  ${f.foreground} on ${f.background}\n  “${f.sample}”`,
			f.element,
		);
	}
	console.groupEnd();
	return findings;
}
