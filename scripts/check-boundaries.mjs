#!/usr/bin/env node
/*
 * Dependency-direction guard.
 *
 * Composites are higher-order assemblies: they may import components (and other
 * lower layers). The reverse must never happen — nothing outside
 * lib/composites/ may import from lib/composites/. This is the invariant most
 * likely to rot silently, so it's checked in CI (npm run lint:boundaries).
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, sep } from "node:path";

const LIB = "projects/interop/src/lib";
const COMPOSITES = join(LIB, "composites");
const IMPORT_RE = /\bfrom\s+["']([^"']+)["']/g;

function* walk(dir) {
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) yield* walk(p);
		else if (p.endsWith(".ts")) yield p;
	}
}

const violations = [];
for (const file of walk(LIB)) {
	if (file === COMPOSITES || file.startsWith(COMPOSITES + sep)) continue;
	const src = readFileSync(file, "utf8");
	for (const [, spec] of src.matchAll(IMPORT_RE)) {
		if (!spec.startsWith(".")) continue; // only relative intra-lib imports
		if (/(^|\/)composites(\/|$)/.test(spec)) {
			violations.push(`  ${file}\n    imports "${spec}"`);
		}
	}
}

if (violations.length) {
	console.error(
		"✖ Dependency-direction violations (non-composite → composite):\n",
	);
	console.error(violations.join("\n"));
	console.error(
		"\nComposites may import components; components must not import composites.",
	);
	process.exit(1);
}
console.log(
	"✓ Dependency direction OK: nothing outside lib/composites/ imports from it.",
);
