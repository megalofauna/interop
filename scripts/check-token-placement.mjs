/*
 * Token placement — where a theme declaration is allowed to live.
 *
 * One rule: a theme declaration belongs on the component's own selector.
 *
 * `tokens/shape.css` has said this since it was written, and only the radius
 * system followed it. Everything else declared on
 * `:where([interop-root], [itx-layer], [itx-sink])` — co-declared at every
 * elevation boundary — because the colour tokens being aliased were contrast
 * ranks solved per surface, and a rank parked higher up froze layer 0's value
 * for the whole tree. The palette replaced those ranks and is page-relative,
 * so the reason expired while 435 declarations stayed behind.
 *
 * Co-declaration is not free. A block that re-declares at every boundary wipes
 * a consumer's override one layer down, and it cannot see anything an ancestor
 * publishes — which is why the checkbox had nowhere to set its corner radius
 * for as long as it did. `tokens/placement.spec.ts` measures all of it.
 *
 * Two rules, both of which currently hold, so this locks in a property rather
 * than reporting a backlog:
 *
 *   1. No per-layer block in the theme, with ONE exemption: a declaration
 *      DERIVED from `--itx-surface`. Reading the surface at the component
 *      gives the same answer, so a component that just wants the surface needs
 *      no block — but a value computed FROM it composes where it is declared
 *      and inherits finished, so a single root declaration would hand every
 *      depth the root's answer. The interactive fill is the case: one named
 *      role, half a step out from whatever surface it lands on.
 *
 *      The exemption costs what the rule warns about — a consumer override is
 *      wiped one layer down — and that is the same property `--itx-surface`
 *      itself has. Overrides for both go through a component namespace.
 *
 *   2. Nothing declared at [interop-root] or on a layer may read a token a
 *      CONTAINER publishes. A var() inside a custom property substitutes where
 *      it is declared, so such a read resolves where the container's token does
 *      not exist and silently freezes at its fallback. That is the freeze bug,
 *      and it is invisible in review — the broken shape and the working shape
 *      differ only in the selector above them.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const THEMES = join(REPO, "projects/interop/src/lib/styles/themes");

/** A value computed from the boundary's surface, which only composes there. */
const SURFACE_DERIVED = /var\(\s*--itx-surface(-above)?\s*\)/;

/** Selectors that re-declare at every elevation boundary. */
const PER_LAYER = /\[itx-layer\]|\[itx-sink\]/;
/** A bare-root selector: declares once, high above any component. */
const ROOT_ONLY = /^:where\(\s*\[interop-root\]\s*\)$/;

/**
 * Tokens published by a CONTAINER for its children, rather than by the theme.
 * Reading one of these anywhere but on the component is the freeze bug.
 */
const CONTAINER_PUBLISHED =
	/var\(\s*--itx-(inner-radius|outer-radius|context-radius|radius-attr)\b/;

const walk = (dir) =>
	readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : p.endsWith(".css") ? [p] : [];
	});

const findings = [];

for (const file of walk(THEMES)) {
	const src = readFileSync(file, "utf8");
	const rel = relative(REPO, file);

	// Strip comments so a documented anti-pattern is not read as a real one.
	const stripped = src.replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);

	const lineOf = (index) => stripped.slice(0, index).split("\n").length;

	for (const block of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
		const selector = block[1].split("\n").join(" ").trim().replace(/\s+/g, " ");
		const body = block[2];
		if (!selector || selector.startsWith("@")) continue;

		const declarations = [
			...body.matchAll(/(--itx-[a-z0-9-]+)\s*:\s*([^;]+);/g),
		];
		if (!declarations.length) continue;

		if (PER_LAYER.test(selector)) {
			// Derived from the boundary's own surface: nowhere else composes.
			const stray = declarations.filter(
				([, , value]) => !SURFACE_DERIVED.test(value),
			);
			if (!stray.length) continue;
			findings.push({
				file: rel,
				line: lineOf(block.index),
				text: selector,
				why:
					`co-declared on the elevation boundaries (${stray.length} ` +
					`declaration${stray.length === 1 ? "" : "s"}) — this wipes a ` +
					`consumer's override one layer down. Declare on the component instead; ` +
					`--itx-surface* inherits, so a layer-sensitive value still resolves.`,
			});
			continue;
		}

		if (!ROOT_ONLY.test(selector)) continue;

		for (const [, name, value] of declarations) {
			if (!CONTAINER_PUBLISHED.test(value)) continue;
			findings.push({
				file: rel,
				line: lineOf(block.index),
				text: `${name}: ${value.split("\n").join(" ").trim()}`,
				why:
					"reads a token a container publishes, but is declared at the root — " +
					"it substitutes there, where that token does not exist, and freezes " +
					"at its fallback. Declare it on the component.",
			});
		}
	}
}

if (!findings.length) {
	console.log(
		"✓ token placement clean — every theme declaration sits on its component",
	);
	process.exit(0);
}

console.error(
	`✗ ${findings.length} placement violation${findings.length === 1 ? "" : "s"}:\n`,
);
for (const f of findings) {
	console.error(`  ${f.file}:${f.line}`);
	console.error(`    ${f.text.slice(0, 100)}`);
	console.error(`    ${f.why}\n`);
}
process.exit(1);
