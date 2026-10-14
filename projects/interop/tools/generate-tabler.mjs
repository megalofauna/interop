#!/usr/bin/env node
/*
 * Writes one IconDefinition module per name in tabler/icons.json, from @tabler/icons.
 * A name ending in `-filled` reads Tabler's filled style.
 *
 *   node projects/interop/tools/generate-tabler.mjs
 */

import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "../tabler");
const resolve = createRequire(import.meta.url).resolve;
const BOUNDING_BOX = "M0 0h24v24H0z";

const names = JSON.parse(readFileSync(join(OUT, "icons.json"), "utf8"));

const attributes = (tag) =>
	Object.fromEntries(
		[...tag.matchAll(/([a-zA-Z-]+)="([^"]*)"/g)].map((m) => [m[1], m[2]]),
	);
const pascal = (name) =>
	name.replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());

for (const file of readdirSync(OUT)) {
	if (file.endsWith(".ts") && file !== "public-api.ts") rmSync(join(OUT, file));
}

const exports = [];
for (const name of names) {
	const filled = name.endsWith("-filled");
	const svg = readFileSync(
		resolve(
			`@tabler/icons/${filled ? "filled" : "outline"}/${name.replace(/-filled$/, "")}.svg`,
		),
		"utf8",
	);
	const root = attributes(svg.match(/<svg[^>]*>/)[0]);
	const paths = [...svg.matchAll(/<path[^>]*>/g)]
		.map((m) => attributes(m[0]))
		.filter((path) => path.d !== BOUNDING_BOX)
		.map(({ d, fill, stroke, opacity }) => ({
			d,
			...(fill && { fill }),
			...(stroke && { stroke }),
			...(opacity && { opacity }),
		}));

	const symbol = `Tabler${pascal(name)}`;
	const definition = {
		name: `tabler-${name}`,
		viewBox: root.viewBox,
		fill: root.fill,
		stroke: root.stroke ?? "none",
		paths,
	};
	writeFileSync(
		join(OUT, `${name}.ts`),
		`import type { IconDefinition } from 'interop';\n\nexport const ${symbol}: IconDefinition = ${JSON.stringify(definition, null, "\t")};\n`,
	);
	exports.push(`export { ${symbol} } from './${name}';`);
}

writeFileSync(
	join(OUT, "public-api.ts"),
	`/*\n * Public API Surface of interop/tabler\n *\n * Generated from tabler/icons.json by tools/generate-tabler.mjs.\n */\n\n${exports.join("\n")}\n`,
);
console.log(`wrote ${names.length} icons`);
