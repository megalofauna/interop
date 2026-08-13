#!/usr/bin/env node
/*
 * Private-token boundary guard.
 *
 * `--_`-prefixed custom properties are private resolved slots, internal to the
 * component that declares them (see .agent/css-strategy.md). Nothing enforces
 * that: custom properties inherit and have no encapsulation, so any component
 * can read another's slot and the compiler will not complain.
 *
 * It happened once. The stepper's cancel button bound
 * `[color]="'var(--_icon-color)'"`, reaching into button.css — which meant half
 * of the button's icon-colour mechanism lived in a different component, and a
 * bug in the button's fallback chain could only be found by reading the
 * stepper. Reading another component's private slot always means the owning
 * component has an unfinished public API; finish it there instead.
 *
 * Keys on the component NAME rather than the directory, because a component's
 * code lives under lib/components/<name>/ while its stylesheet lives under
 * lib/styles/components/<name>.css — a directory comparison reads that split as
 * a violation. Also counts setProperty("--_x", …) as a declaration, so a
 * component setting its own private from its own TypeScript (the toast does
 * this for swipe offsets) is correctly not a finding.
 */
import { readdirSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const ROOT = process.argv[2] ?? "projects";

function walk(dir, out = []) {
	for (const entry of readdirSync(dir, { withFileTypes: true })) {
		const p = join(dir, entry.name);
		if (p.includes("node_modules")) continue;
		if (entry.isDirectory()) walk(p, out);
		else if (/\.(css|scss|html|ts)$/.test(entry.name)) out.push(p);
	}
	return out;
}

/** Component a file belongs to, normalised across the code/style split. */
function componentOf(file) {
	const m = file.match(/lib\/components\/([a-z0-9-]+)\//);
	if (m) return m[1].replace(/^interop-/, "");
	return basename(file)
		.replace(/\.[^.]+$/, "")
		.replace(/^interop-/, "");
}

const declared = new Map();
const read = [];
const add = (map, token, value) => {
	if (!map.has(token)) map.set(token, new Set());
	map.get(token).add(value);
};

for (const file of walk(ROOT)) {
	const source = readFileSync(file, "utf8");
	const owner = componentOf(file);
	for (const m of source.matchAll(/(--_[a-z0-9-]+)\s*:/g))
		add(declared, m[1], owner);
	for (const m of source.matchAll(/setProperty\(\s*["'`](--_[a-z0-9-]+)/g))
		add(declared, m[1], owner);
	for (const m of source.matchAll(/var\(\s*(--_[a-z0-9-]+)/g))
		read.push({ token: m[1], owner, file });
}

const violations = read.filter(
	({ token, owner }) => !(declared.get(token) ?? new Set()).has(owner),
);

for (const { token, owner, file } of violations) {
	console.error(`CROSS-BOUNDARY: ${token} read by "${owner}" in ${file}`);
}

if (violations.length) {
	console.error(`\n${violations.length} cross-boundary private token read(s).`);
	process.exit(1);
}
console.log("No cross-boundary private token reads.");
