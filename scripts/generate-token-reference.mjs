#!/usr/bin/env node
/*
 * Component token reference generator.
 *
 * Emits `styles/interop.tokens.css` — one commented block per component,
 * listing every lever that component actually has, with its current value.
 *
 * ── Why this is separate from the starter ─────────────────────────────────
 *
 * interop.starter.css is 19 global knobs and its whole value is being short
 * enough to read: every line is a decision someone might make about the whole
 * product. There are 700-odd component levers. Putting them in the same file
 * would bury the four knobs that matter under a wall of per-component detail,
 * and the two have different lifecycles anyway — the starter is edit-once-and-
 * keep, this is look-up-one-thing-and-close.
 *
 * ── Why generated ─────────────────────────────────────────────────────────
 *
 * A component's levers are mechanically derivable: every `var(--itx-X-…)` its
 * own stylesheet reads IS a lever, by definition. That is the kind of list a
 * script gets exhaustively right and a person does not.
 *
 * The hand-written version had already drifted. The demo carries token tables
 * in markdown, and when --itx-button-background-image was removed the rows had
 * to be deleted by hand in two files; nothing would have caught them.
 *
 * ── State chains ──────────────────────────────────────────────────────────
 *
 * A flat list would imply the button has 45 independent dials. It does not:
 * state tokens fall back to their base, so `--itx-button-background-hover`
 * inherits from `--itx-button-background` unless you set it. Those are
 * detected and annotated, because "setting the base moves hover too" is the
 * single most useful thing to know before overriding anything.
 *
 * Usage:
 *   node scripts/generate-token-reference.mjs          write the file
 *   node scripts/generate-token-reference.mjs --check  verify, write nothing
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import {
	decomment,
	readDeclaration,
	readFallback,
	SYSTEM_TOKEN,
} from "./lib/css-read.mjs";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(REPO, "projects/interop/src/lib/styles");
const OUT = join(STYLES, "interop.tokens.css");

/** Structural stylesheets, i.e. the things that READ tokens. */
const SOURCE_DIRS = ["components", "composites", "rigs"];

/** Suffixes that make a token a state OF another token rather than its own dial. */
const STATE_SUFFIX =
	/-(hover|active|focus|focused|selected|checked|disabled|current|open|expanded|stuck|invalid|readonly)$/;

function walk(dir, out = []) {
	if (!existsSync(dir)) return out;
	for (const e of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, e.name);
		if (e.isDirectory()) walk(p, out);
		else if (e.name.endsWith(".css")) out.push(p);
	}
	return out;
}

/** styles/components/X.css -> styles/themes/protocol/components/X.css */
const themeCounterpart = (file) => {
	const rel = relative(STYLES, file);
	return join(STYLES, "themes/protocol", rel);
};

/* ── Collect ──────────────────────────────────────────────────────────── */

const components = [];

for (const dir of SOURCE_DIRS) {
	for (const file of walk(join(STYLES, dir))) {
		const raw = readFileSync(file, "utf8");
		const src = decomment(raw);

		// Every token this stylesheet reads that is not system-wide and not private.
		const tokens = new Set();
		for (const m of src.matchAll(/var\(\s*(--itx-[a-z0-9-]+)/g)) {
			const t = m[1];
			if (SYSTEM_TOKEN.test(t)) continue;
			tokens.add(t);
		}
		if (!tokens.size) continue;

		const themeFile = themeCounterpart(file);
		const themeSrc = existsSync(themeFile)
			? decomment(readFileSync(themeFile, "utf8"))
			: "";

		const levers = [...tokens].sort().map((token) => {
			// Where the value actually comes from, in the order the cascade resolves it.
			let value = readDeclaration(themeSrc, token);
			let origin = value !== null ? "theme" : null;
			if (value === null) {
				value = readDeclaration(src, token);
				origin = value !== null ? "structural" : null;
			}
			if (value === null) {
				value = readFallback(raw, token);
				origin = value !== null ? "fallback" : null;
			}

			// A state token whose fallback is its own base inherits from it.
			const base = token.replace(STATE_SUFFIX, "");
			const inheritsFrom =
				STATE_SUFFIX.test(token) && tokens.has(base) && base !== token
					? base
					: null;

			// A fallback that is purely another system token means the component
			// has no opinion and the GLOBAL knob governs it — worth saying so.
			let fallsThroughTo = null;
			if (origin === "fallback") {
				const chain = /^var\(\s*(--itx-[a-z0-9-]+)\s*\)$/.exec(value);
				if (chain && SYSTEM_TOKEN.test(chain[1])) {
					fallsThroughTo = chain[1];
					value = null;
					origin = null;
				}
			}

			// A default computed from a component-PRIVATE slot is not a value a
			// consumer can copy — --_ names are internal and may not even be in
			// scope where they would paste it. Report the shape, not the text.
			const derivesFromPrivate = value !== null && value.includes("--_");
			if (derivesFromPrivate) value = null;

			return {
				token,
				value,
				origin,
				inheritsFrom,
				fallsThroughTo,
				derivesFromPrivate,
			};
		});

		components.push({
			name: relative(STYLES, file).replace(/\.css$/, ""),
			structural: relative(STYLES, file),
			theme: existsSync(themeFile) ? relative(STYLES, themeFile) : null,
			levers,
		});
	}
}

components.sort((a, b) => a.name.localeCompare(b.name));

/* ── Emit ─────────────────────────────────────────────────────────────── */

const total = components.reduce((n, c) => n + c.levers.length, 0);
const rule = (n) => "─".repeat(n);

const out = [
	`/*
 * Interop — component token reference.
 *
 * GENERATED by scripts/generate-token-reference.mjs. ${total} levers across
 * ${components.length} components, every value read from the library source.
 *
 * This is a lookup sheet, not a file to adopt wholesale. The companion file
 * interop.starter.css holds the ${"global"} knobs — radius, motion, focus, tint —
 * and is the one you copy and keep. Come here when you want to change one
 * component rather than the whole product.
 *
 * ── Using it ──────────────────────────────────────────────────────────────
 *
 * Uncomment a line and put it in your own stylesheet. The selector shown
 * changes EVERY instance; these are inherited custom properties, so the same
 * declaration on a single element changes only that one:
 *
 *   <button interop-button style="--itx-button-background: rebeccapurple">
 *
 * ── Before you override a state ──────────────────────────────────────────
 *
 * Tokens marked "inherits <base>" have no value of their own: they fall back to
 * the base token, so setting the BASE moves them too. Set a state token only
 * when you want it to diverge. That is why this is not a flat list of ${total}
 * independent dials.
 *
 * ── "falls through to …" ─────────────────────────────────────────────────
 *
 * The component declares nothing of its own and the named system token governs
 * it. Set that one in interop.starter.css to move every component at once, or
 * set the component token here to make this one diverge.
 *
 * ── Values marked (fallback) ─────────────────────────────────────────────
 *
 * The theme declares no value; the default lives in the component's own
 * structural fallback. Still overridable in exactly the same way.
 */
`,
];

for (const c of components) {
	out.push(
		`\n/* ${rule(4)} ${c.name} ${rule(Math.max(4, 62 - c.name.length))} ${c.levers.length} levers */`,
	);
	out.push(`/*
 * structural: ${c.structural}
 * values:     ${c.theme ?? "— none; this component declares no theme values"}
 */
[interop-root] {`);

	for (const l of c.levers) {
		if (l.inheritsFrom) {
			out.push(
				`\t/* --${l.token.slice(2)}: ; */ /* inherits ${l.inheritsFrom} */`,
			);
		} else if (l.fallsThroughTo) {
			out.push(
				`\t/* --${l.token.slice(2)}: ; */ /* falls through to ${l.fallsThroughTo} — set globally in interop.starter.css */`,
			);
		} else if (l.derivesFromPrivate) {
			out.push(
				`\t/* --${l.token.slice(2)}: ; */ /* default is derived internally — set an explicit value to override */`,
			);
		} else if (l.value === null) {
			out.push(
				`\t/* --${l.token.slice(2)}: ; */ /* no default — unset unless you set it */`,
			);
		} else {
			const mark = l.origin === "fallback" ? " /* (fallback) */" : "";
			out.push(`\t/* --${l.token.slice(2)}: ${l.value}; */${mark}`);
		}
	}
	out.push("}\n");
}

const css = out.join("\n").replace(/\n{3,}/g, "\n\n");

if (process.argv.includes("--check")) {
	const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
	if (current !== css) {
		console.error(
			"✗ styles/interop.tokens.css is stale — a component's token surface changed.\n  Run: node scripts/generate-token-reference.mjs",
		);
		process.exit(1);
	}
	console.log(
		`✓ token reference is current — ${total} levers across ${components.length} components`,
	);
	process.exit(0);
}

writeFileSync(OUT, css);
const stated = components.reduce(
	(n, c) =>
		n + c.levers.filter((l) => l.value !== null && !l.inheritsFrom).length,
	0,
);
const inherited = components.reduce(
	(n, c) => n + c.levers.filter((l) => l.inheritsFrom).length,
	0,
);
console.log(`✓ wrote styles/interop.tokens.css`);
console.log(`  ${total} levers across ${components.length} components`);
console.log(
	`  ${stated} with a stated value, ${inherited} inheriting from a base state, ${total - stated - inherited} unset`,
);
