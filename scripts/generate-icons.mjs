#!/usr/bin/env node
/**
 * Icon codegen — generates InteropIconDefinition TypeScript files from SVG sources.
 *
 * Sources:   IconSetsSVG/PhosphorSVG/{regular,fill,duotone}/*.svg
 *            IconSetsSVG/TablerSVG/{outline,filled}/*.svg
 *
 * Outputs:   src/lib/iconsets/phosphor/{regular,fill,duotone}/
 *            src/lib/iconsets/tabler/{outline,filled}/
 *            + index.ts for each set with re-exports and provider functions.
 *
 * Extraction rules
 * ────────────────
 * All variants:
 *   - Strip outer <svg> wrapper (keep inner content only)
 *   - Strip XML comments
 *   - Collapse runs of whitespace / normalise newlines to single spaces
 *
 * Phosphor (256×256 viewBox, defaultStrokeWidth: 16 for stroke variants):
 *   - Strip <rect width="256" height="256" fill="none"/> (invisible sizing rect)
 *   - Strip stroke-width="16" from all elements (moved to outer <svg> via defaultStrokeWidth)
 *   - regular: no wrapper (each path already carries fill="none" and stroke attrs)
 *   - fill:    wrap in <g fill="currentColor"> (paths have no fill attr — inherit currentColor)
 *   - duotone: wrap in <g fill="currentColor"> (fill shape inherits currentColor @0.2 opacity;
 *              stroke paths override with explicit fill="none")
 *
 * Tabler (24×24 viewBox, defaultStrokeWidth: 2 for outline):
 *   - Strip leading SVG comment block
 *   - outline: wrap in <g fill="none" stroke="currentColor" stroke-linecap="round"
 *              stroke-linejoin="round"> (paths have no stroke attrs — rely on inheritance)
 *   - filled:  wrap in <g fill="currentColor"> (paths have no fill attr — inherit currentColor)
 */

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from "fs";
import { join, basename, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const SVG_ROOT = join(ROOT, "IconSetsSVG");
const OUT_ROOT = join(ROOT, "projects/interop/src/lib/iconsets");

/**
 * Material Symbols comes from npm rather than IconSetsSVG. The generated .ts is
 * the committed artifact either way — the SVGs are only build input — and a
 * dependency is a version bump instead of a 7,792-file vendoring commit.
 *
 * Weight is chosen by which package this points at (svg-100 … svg-700). These
 * are font-derived filled contours, so weight cannot vary at runtime the way
 * Tabler's stroke-width can; see the note on defaultStrokeWidth below.
 */
const MS_ROOT = join(ROOT, "node_modules/@material-symbols/svg-400");

// ── Helpers ────────────────────────────────────────────────────────────────────

function toPascalCase(hyphenated) {
	return hyphenated
		.split("-")
		.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
		.join("");
}

function extractViewBox(svg) {
	const m = svg.match(/viewBox="([^"]+)"/);
	return m ? m[1] : "0 0 256 256";
}

function extractInner(svg) {
	// Strip outer <svg ...> and </svg>
	return svg
		.replace(/^[\s\S]*?<svg[^>]*>/, "")
		.replace(/<\/svg>\s*$/, "")
		.trim();
}

function stripComments(content) {
	return content.replace(/<!--[\s\S]*?-->/g, "");
}

function normalise(content) {
	return content.replace(/\s+/g, " ").trim();
}

function stripPhosphorSizingRect(content) {
	return content
		.replace(/<rect[^>]*width="256"[^>]*height="256"[^>]*\/>/g, "")
		.replace(/<rect[^>]*height="256"[^>]*width="256"[^>]*\/>/g, "");
}

function stripStrokeWidth(content) {
	// Remove stroke-width="16" (and any numeric value) — will be applied by InteropIcon
	return content.replace(/\s+stroke-width="[^"]*"/g, "");
}

function writeFile(path, content) {
	writeFileSync(path, content, "utf8");
}

function ensureDir(dir) {
	mkdirSync(dir, { recursive: true });
}

// ── Per-variant processing ─────────────────────────────────────────────────────

const PROCESSORS = {
	"phosphor/regular": {
		srcDir: join(SVG_ROOT, "PhosphorSVG/regular"),
		outDir: join(OUT_ROOT, "phosphor/regular"),
		registryPrefix: "ph-",
		variantSuffix: "", // registry name gets no extra suffix
		exportPrefix: "Ph",
		defaultStrokeWidth: 16,
		viewBox: "0 0 256 256",
		process(inner) {
			let c = stripPhosphorSizingRect(inner);
			c = stripStrokeWidth(c);
			return normalise(c);
		},
		wrap: null, // no wrapper; paths carry their own stroke attrs
		// Strip the "-regular" variant suffix from filenames if present
		nameFromFile: (file) => basename(file, ".svg"),
	},

	"phosphor/fill": {
		srcDir: join(SVG_ROOT, "PhosphorSVG/fill"),
		outDir: join(OUT_ROOT, "phosphor/fill"),
		registryPrefix: "ph-",
		variantSuffix: "-fill",
		exportPrefix: "Ph",
		defaultStrokeWidth: undefined,
		viewBox: "0 0 256 256",
		process(inner) {
			let c = stripPhosphorSizingRect(inner);
			c = stripStrokeWidth(c);
			return normalise(c);
		},
		wrap: `fill="currentColor"`,
		// Filenames: "copy-fill.svg" → base name "copy"
		nameFromFile: (file) => basename(file, ".svg").replace(/-fill$/, ""),
	},

	"phosphor/duotone": {
		srcDir: join(SVG_ROOT, "PhosphorSVG/duotone"),
		outDir: join(OUT_ROOT, "phosphor/duotone"),
		registryPrefix: "ph-",
		variantSuffix: "-duotone",
		exportPrefix: "Ph",
		defaultStrokeWidth: 16,
		viewBox: "0 0 256 256",
		process(inner) {
			let c = stripPhosphorSizingRect(inner);
			c = stripStrokeWidth(c);
			return normalise(c);
		},
		wrap: `fill="currentColor"`,
		nameFromFile: (file) => basename(file, ".svg").replace(/-duotone$/, ""),
	},

	"tabler/outline": {
		srcDir: join(SVG_ROOT, "TablerSVG/outline"),
		outDir: join(OUT_ROOT, "tabler/outline"),
		registryPrefix: "tabler-",
		variantSuffix: "",
		exportPrefix: "Tabler",
		defaultStrokeWidth: 2,
		viewBox: "0 0 24 24",
		process(inner) {
			return normalise(inner);
		},
		wrap: `fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`,
		nameFromFile: (file) => basename(file, ".svg"),
	},

	"tabler/filled": {
		srcDir: join(SVG_ROOT, "TablerSVG/filled"),
		outDir: join(OUT_ROOT, "tabler/filled"),
		registryPrefix: "tabler-",
		variantSuffix: "-filled",
		exportPrefix: "Tabler",
		defaultStrokeWidth: undefined,
		viewBox: "0 0 24 24",
		process(inner) {
			return normalise(inner);
		},
		wrap: `fill="currentColor"`,
		nameFromFile: (file) => basename(file, ".svg"),
	},

	/*
	 * Material Symbols — Sharp. Both variants live in ONE source directory
	 * (`sharp/face.svg` and `sharp/face-fill.svg`), so each variant selects its
	 * half with fileFilter rather than pointing at its own folder.
	 *
	 * Both are `fill="currentColor"` wrapped and carry no defaultStrokeWidth,
	 * because BOTH are filled contours — the "outline" look is a frame: two
	 * nested contours filled by winding rule, not a stroked line. Nothing here
	 * responds to stroke-width, which is why InteropIcon emits none.
	 *
	 * Names use `_` between words and `-fill` for the variant, so word
	 * separators are normalised to `-` to match every other set:
	 *   arrow_back.svg       → ms-arrow-back
	 *   arrow_back-fill.svg  → ms-arrow-back-fill
	 */
	"material-symbols/sharp": {
		srcDir: join(MS_ROOT, "sharp"),
		outDir: join(OUT_ROOT, "material-symbols/sharp"),
		registryPrefix: "ms-",
		variantSuffix: "",
		exportPrefix: "Ms",
		defaultStrokeWidth: undefined,
		viewBox: "0 -960 960 960",
		fileFilter: (file) => !file.endsWith("-fill.svg"),
		process(inner) {
			return normalise(inner);
		},
		wrap: `fill="currentColor"`,
		nameFromFile: (file) => basename(file, ".svg").replace(/_/g, "-"),
	},

	"material-symbols/sharp-fill": {
		srcDir: join(MS_ROOT, "sharp"),
		outDir: join(OUT_ROOT, "material-symbols/sharp-fill"),
		registryPrefix: "ms-",
		variantSuffix: "-fill",
		exportPrefix: "Ms",
		defaultStrokeWidth: undefined,
		viewBox: "0 -960 960 960",
		fileFilter: (file) => file.endsWith("-fill.svg"),
		process(inner) {
			return normalise(inner);
		},
		wrap: `fill="currentColor"`,
		nameFromFile: (file) =>
			basename(file, ".svg")
				.replace(/-fill$/, "")
				.replace(/_/g, "-"),
	},
};

// ── File generator ─────────────────────────────────────────────────────────────

function processVariant(key, cfg) {
	ensureDir(cfg.outDir);

	const files = readdirSync(cfg.srcDir)
		.filter((f) => f.endsWith(".svg"))
		.filter(cfg.fileFilter ?? (() => true));
	const exports = []; // { exportName, registryName, fileName }

	for (const file of files) {
		const svgRaw = readFileSync(join(cfg.srcDir, file), "utf8");

		// Extract viewBox (fall back to config default)
		const viewBox = extractViewBox(svgRaw) || cfg.viewBox;

		// Extract and process inner content
		let inner = extractInner(svgRaw);
		inner = stripComments(inner);
		inner = cfg.process(inner);

		// Wrap if required by this variant
		const svgContent = cfg.wrap ? `<g ${cfg.wrap}>${inner}</g>` : inner;

		// Derive names
		const baseName = cfg.nameFromFile(file);
		const registryName = `${cfg.registryPrefix}${baseName}${cfg.variantSuffix}`;
		const exportName = toPascalCase(registryName);
		const outFile = `${registryName}.ts`;

		// Build TypeScript source
		const defaultStrokeWidthProp =
			cfg.defaultStrokeWidth !== undefined
				? `,\n  defaultStrokeWidth: ${cfg.defaultStrokeWidth}`
				: "";

		const ts = [
			`import type { InteropIconDefinition } from "../../core";`,
			``,
			`export const ${exportName}: InteropIconDefinition = {`,
			`  name: "${registryName}",`,
			`  viewBox: "${viewBox}",`,
			`  svgContent: ${JSON.stringify(svgContent)}${defaultStrokeWidthProp},`,
			`} as const;`,
			``,
		].join("\n");

		writeFile(join(cfg.outDir, outFile), ts);
		exports.push({ exportName, registryName, fileName: outFile });
	}

	return exports;
}

// ── Index generator ────────────────────────────────────────────────────────────

function writeVariantIndex(cfg, exports) {
	const lines = [
		`// Auto-generated — do not edit. Re-run scripts/generate-icons.mjs to update.`,
		``,
		...exports.map(
			({ exportName, fileName }) =>
				`export { ${exportName} } from "./${fileName.replace(".ts", "")}";`,
		),
	];
	writeFile(join(cfg.outDir, "index.ts"), lines.join("\n") + "\n");
}

function writeSetIndex(setKey, variantConfigs, variantExports) {
	const setDir = join(OUT_ROOT, setKey);
	const { label: setPrefix, provider: providerAlias } = SETS[setKey];

	const lines = [
		`// Auto-generated — do not edit. Re-run scripts/generate-icons.mjs to update.`,
		``,
		`export { provideInteropIcons as ${providerAlias} } from "../core";`,
		``,
	];

	// Re-export each variant
	for (const variantKey of Object.keys(variantConfigs)) {
		const short = variantKey.split("/")[1]; // "regular", "fill", etc.
		lines.push(`// ${short}`);
		lines.push(`export * from "./${short}/index";`);
		lines.push("");
	}

	// Bulk "provide all" functions (non-tree-shakeable — for dev/demo)
	lines.push(
		`// ── Bulk providers (not tree-shakeable — use cherry-picked provideInteropIcons in production) ──`,
		``,
		`import { provideInteropIcons } from "../core";`,
	);

	for (const [variantKey, variantExps] of Object.entries(variantExports)) {
		const short = variantKey.split("/")[1];
		const fnName = `provide${setPrefix}${toPascalCase(short)}Icons`;
		const allImports = variantExps.map((e) => e.exportName).join(",\n  ");
		lines.push(
			``,
			`import {`,
			`  ${allImports}`,
			`} from "./${short}/index";`,
			``,
			`/** Register all ${setPrefix} ${short} icons. Not tree-shakeable — prefer cherry-picking in production. */`,
			`export function ${fnName}() {`,
			`  return provideInteropIcons(`,
			`    ${variantExps.map((e) => e.exportName).join(",\n    ")}`,
			`  );`,
			`}`,
		);
	}

	writeFile(join(setDir, "index.ts"), lines.join("\n") + "\n");
}

// ── Main ───────────────────────────────────────────────────────────────────────

/**
 * Usage: node scripts/generate-icons.mjs [set…]
 *
 * With no arguments every set is regenerated. Name sets to regenerate only
 * those — each set is thousands of files, and rewriting one is no reason to
 * churn the diff of the others.
 */
const SETS = {
	phosphor: {
		label: "Phosphor",
		provider: "providePhosphorIcons",
		variants: ["phosphor/regular", "phosphor/fill", "phosphor/duotone"],
	},
	tabler: {
		label: "Tabler",
		provider: "provideTablerIcons",
		variants: ["tabler/outline", "tabler/filled"],
	},
	"material-symbols": {
		label: "MaterialSymbols",
		provider: "provideMaterialSymbolsIcons",
		variants: ["material-symbols/sharp", "material-symbols/sharp-fill"],
	},
};

const requested = process.argv.slice(2);
const unknown = requested.filter((s) => !SETS[s]);
if (unknown.length) {
	console.error(
		`Unknown set(s): ${unknown.join(", ")}\nKnown: ${Object.keys(SETS).join(", ")}`,
	);
	process.exit(1);
}
const selected = requested.length ? requested : Object.keys(SETS);

console.log(`Generating icons (${selected.join(", ")})…\n`);

for (const setKey of selected) {
	const variantConfigs = Object.fromEntries(
		SETS[setKey].variants.map((v) => [v, PROCESSORS[v]]),
	);
	const setExports = {};

	for (const [key, cfg] of Object.entries(variantConfigs)) {
		console.log(`  ${key}…`);
		const exps = processVariant(key, cfg);
		writeVariantIndex(cfg, exps);
		setExports[key] = exps;
		console.log(`    → ${exps.length} icons`);
	}

	writeSetIndex(setKey, variantConfigs, setExports);
}

console.log("\nDone.");
