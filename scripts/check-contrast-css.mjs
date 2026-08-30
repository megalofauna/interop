#!/usr/bin/env node
/*
 * Contrast verification against the SHIPPED CSS, as a consumer receives it.
 *
 * The companion check — check-contrast-render.mjs — reads the palette's own
 * literal values and proves the internal rule (borders 7 steps apart, text 8,
 * enhanced 10). It never loads a stylesheet, so it cannot see whether a ROLE
 * points at the step it claims to.
 *
 * This one resolves everything from the DOM: it loads interop.css and the
 * protocol theme, mounts real elements in real layer contexts, and reads back
 * what getComputedStyle says. It checks what a consumer actually gets.
 *
 * ── What changed, and why this file is worth more than it was ───────────
 *
 * It used to check --itx-contrast-2..5, and its own header recorded why it
 * could not check the roles: "those labels are not token names — the shipped
 * tokens are --itx-danger-1..14, and the role-to-step mapping lives inside
 * the generator. That is a finding, not an omission."
 *
 * The roles ARE token names now. --itx-danger-text is a declaration pointing
 * at a step, so the pairing a component actually paints can be resolved from
 * CSS — which is what this now does.
 *
 * ── The depth question this answers ─────────────────────────────────────
 *
 * Palette steps are page-relative and fixed, while the surface keeps climbing
 * with elevation. That trade was made deliberately: position carries the
 * guarantee, and the ramp is kept short enough that the loss stays inside the
 * floor. "Stays inside" is a claim, and depth is the axis it fails on — so
 * every pairing here is measured at EVERY layer the engine can reach.
 *
 * Usage: node scripts/check-contrast-css.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const STYLES = join(REPO, "projects/interop/src/lib/styles");

/*
 * The contract, transcribed once — not generated, not derived from the values
 * it judges. Each entry is a real pairing some component paints.
 *
 *   on: the background the foreground sits on, as a token or "" for the surface
 */
const FAMILIES = ["colorway", "danger", "info", "success", "warning"];
const PAIRINGS = [
	{ role: "text", on: "", floor: 4.5 },
	{ role: "border", on: "", floor: 3 },
	{ role: "on-tint", on: "tint", floor: 4.5 },
];
/** The page's own text, which is not a family role. */
const PAGE_TEXT = { fg: "--itx-neutral-14", on: "", floor: 7 };
const DEPTHS = [0, 1, 2];
const SCHEMES = ["light", "dark"];

const CHROME = [
	process.env["CHROME_PATH"],
	process.env["CHROME_BIN"],
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/usr/bin/google-chrome",
	"/usr/bin/chromium",
]
	.filter(Boolean)
	.find((p) => existsSync(p));

if (!CHROME) {
	console.warn("⚠ no Chrome found; skipped.");
	process.exit(0);
}

const cases = [];
for (const scheme of SCHEMES)
	for (const depth of DEPTHS) {
		cases.push({ scheme, depth, ...PAGE_TEXT, label: "page text" });
		for (const family of FAMILIES)
			for (const { role, on, floor } of PAIRINGS)
				cases.push({
					scheme,
					depth,
					fg: `--itx-${family}-${role}`,
					on: on ? `--itx-${family}-${on}` : "",
					floor,
					label: `${family} ${role}${on ? ` on ${on}` : ""}`,
				});
	}

/** Nest [itx-layer] to `depth`, innermost carrying the probe. */
const nest = (depth, inner) =>
	depth === 0 ? inner : `<div itx-layer>${nest(depth - 1, inner)}</div>`;

const probes = cases
	.map((c, i) => {
		const bg = c.on
			? `background-color: var(${c.on})`
			: "background-color: var(--itx-surface)";
		const probe =
			`<div class="bg" id="b${i}" style="${bg}">` +
			`<span class="fg" id="f${i}" style="color: var(${c.fg})">x</span>` +
			`</div>`;

		return `<div interop-root style="color-scheme: ${c.scheme}">${nest(c.depth, probe)}</div>`;
	})
	.join("\n");

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="file://${join(STYLES, "interop.css")}">
<link rel="stylesheet" href="file://${join(STYLES, "themes/protocol.css")}">
<style>.bg { padding: 4px }</style>
${probes}
<pre id="out"></pre>
<script>
/* Through a canvas: getComputedStyle returns oklch() strings, and what matters
   is the sRGB the screen actually shows — including the 8-bit rounding that
   made --itx-contrast-4 render at 4.48 while the generator computed 4.52. */
const cv = document.createElement('canvas'); cv.width = cv.height = 1;
const cx = cv.getContext('2d', { willReadFrequently: true });
const lin = (v) => { v /= 255; return v <= 0.04045 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
const lum = (s) => {
  cx.fillStyle = '#000'; cx.fillRect(0,0,1,1);
  cx.fillStyle = s; cx.fillRect(0,0,1,1);
  const [r,g,b] = cx.getImageData(0,0,1,1).data;
  return 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
};
const out = [];
for (let i = 0; i < ${cases.length}; i++) {
  const bg = getComputedStyle(document.getElementById('b'+i)).backgroundColor;
  const fg = getComputedStyle(document.getElementById('f'+i)).color;
  const a = lum(fg), b = lum(bg);
  const hi = Math.max(a,b), lo = Math.min(a,b);
  out.push(((hi + 0.05) / (lo + 0.05)).toFixed(4) + ' ' + bg + ' | ' + fg);
}
document.getElementById('out').textContent = out.join('\\n');
</script>`;

const page = join(tmpdir(), `itx-contrast-css-${process.pid}.html`);
writeFileSync(page, html);
let dom;
try {
	dom = execFileSync(
		CHROME,
		[
			"--headless",
			"--disable-gpu",
			"--no-sandbox",
			"--virtual-time-budget=15000",
			"--dump-dom",
			`file://${page}`,
		],
		{
			encoding: "utf8",
			stdio: ["ignore", "pipe", "ignore"],
			maxBuffer: 1 << 24,
		},
	);
} finally {
	unlinkSync(page);
}

const body = dom.match(/<pre id="out">([\s\S]*?)<\/pre>/);
if (!body) {
	console.error("✗ probe produced no output");
	process.exit(1);
}
const rows = body[1].trim().split("\n");
if (rows.length !== cases.length) {
	console.error(`✗ measured ${rows.length}, expected ${cases.length}`);
	process.exit(1);
}

const fails = [];
let tightest = { margin: Infinity };
rows.forEach((row, i) => {
	const c = cases[i];
	const ratio = Number(row.split(" ")[0]);
	const margin = ratio - c.floor;
	if (margin < tightest.margin) tightest = { margin, ratio, ...c };
	if (ratio + 1e-4 < c.floor)
		fails.push(
			`  ${c.scheme} depth ${c.depth} ${c.label}: ${ratio} < ${c.floor}   ${row.slice(row.indexOf(" ") + 1)}`,
		);
});

if (fails.length) {
	console.error(
		`✗ ${fails.length} of ${cases.length} role pairings fail their floor as Chrome renders the SHIPPED CSS:\n`,
	);
	console.error(fails.join("\n"));
	process.exit(1);
}
console.log(
	`✓ all ${cases.length} role pairings clear their floor in the shipped CSS — tightest ${tightest.ratio} against ${tightest.floor} (${tightest.scheme} depth ${tightest.depth} ${tightest.label})`,
);
