/*
 * Casting — `itx-as-button` and the two ways to get it backwards.
 *
 * A cast borrows a component's appearance without its identity. The case it
 * exists for is a link that design has given the button treatment: the element
 * must stay an <a> because it navigates, and the alternatives both trade
 * semantics for pixels — a <button> that fakes navigation, or an <a
 * role="button"> that announces wrongly and then owes you a Space handler.
 *
 * Two mistakes are worth failing a build over, because both look right:
 *
 *   1. A cast on a real <button>. You have given up the activation guardrails
 *      — debounce, throttle, reentrancy — and the ARIA wiring, in exchange for
 *      nothing at all. `interop-button` is the same pixels plus all of that.
 *
 *   2. `interop-button` on something that is not a <button>. It gets the base
 *      block and nothing else, because every other rule is keyed
 *      `button[interop-button]`. The result is a half-styled control, which is
 *      what casting was built to replace.
 *
 * And one that is a warning rather than an error, because the fix is a
 * judgement call: a cast anchor with no href. Without one it is not focusable
 * and not interactive, so it is the single case where casting produces a
 * genuinely broken control rather than a legitimate one. `routerLink` counts —
 * Angular resolves it to an href.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = [
	join(REPO, "projects/interop/src"),
	join(REPO, "projects/demo/src"),
];

/** Templates live in .html, and in `template:` strings inside .ts. */
const SCANNABLE = /\.(html|ts)$/;

const walk = (dir) =>
	readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		if (statSync(p).isDirectory())
			return name === "node_modules" ? [] : walk(p);
		return SCANNABLE.test(p) ? [p] : [];
	});

const findings = [];
const warnings = [];

for (const file of ROOTS.flatMap(walk)) {
	const src = readFileSync(file, "utf8");
	if (!src.includes("itx-as-") && !src.includes("interop-button")) continue;
	const rel = relative(REPO, file);
	const lines = src.split("\n");

	// Tags can wrap across lines, so match on the whole source and map back.
	for (const m of src.matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
		const [tag, attrs] = [m[1].toLowerCase(), m[2]];
		const line = src.slice(0, m.index).split("\n").length;
		const text = " ".repeat(0) + lines[line - 1].trim();

		const cast = /\bitx-as-([a-z-]+)\s*=/.exec(attrs);
		if (cast && tag === "button") {
			findings.push({
				file: rel,
				line,
				text,
				why:
					`itx-as-${cast[1]} on a <button> — this is the element the cast ` +
					`imitates. Use interop-${cast[1]}, which is the same pixels plus the ` +
					`activation guardrails and ARIA wiring a cast deliberately omits.`,
			});
		}

		if (/\binterop-button\s*[=\s>]/.test(attrs) && tag !== "button") {
			findings.push({
				file: rel,
				line,
				text,
				why:
					`interop-button on <${tag}> — every rule but the base block is keyed ` +
					`button[interop-button], so this is half-styled. Use ` +
					`itx-as-button="…" for the appearance, and leave the element alone.`,
			});
		}

		if (cast && tag === "a" && !/\b(href|routerLink)\b/i.test(attrs)) {
			warnings.push({
				file: rel,
				line,
				text,
				why:
					"cast anchor with no href or routerLink — not focusable, not " +
					"interactive. It looks like a control and is not one.",
			});
		}
	}
}

for (const w of warnings) {
	console.warn(
		`  ⚠ ${w.file}:${w.line}\n    ${w.text.slice(0, 100)}\n    ${w.why}\n`,
	);
}

if (!findings.length) {
	console.log(
		`✓ casts clean — appearance borrowed, identity intact${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? "" : "s"})` : ""}`,
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} cast violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.text.slice(0, 100)}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
