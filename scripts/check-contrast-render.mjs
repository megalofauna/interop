#!/usr/bin/env node
/*
 * Contrast verification against the ladder's LITERAL values, with no DOM.
 *
 * The companion check — check-contrast-css.mjs — loads the shipped stylesheets,
 * mounts real elements in real layer contexts and reads getComputedStyle back.
 * It proves the wiring: that a component reading a role gets a colour clearing
 * its floor at every depth the engine emits.
 *
 * This one proves the VALUES, independently of anything wiring them up. Two
 * things follow from that, and they are why both exist:
 *
 *   - It reaches surfaces the engine never lands on. Depth maps to 2, 4 and 5;
 *     1, 3 and 6 are read directly by components that want page-level texture
 *     or the deepest raise, and the cascade check cannot see them.
 *   - It catches a value that is wrong before anything reads it, so a role can
 *     be added and verified in the same commit.
 *
 * It resolves tokens by substitution rather than by cascade: expand var(),
 * pick an arm of light-dark(), then hand the finished colour to Chrome for the
 * sRGB the screen shows. Relative colour syntax resolves to a real value, so
 * the derived fills are literals here too.
 *
 * Usage: node scripts/check-contrast-render.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const LADDER = join(
	REPO,
	"projects/interop/src/lib/styles/themes/protocol/ladder.css",
);

const FAMILIES = ["colorway", "danger", "info", "success", "warning"];
const SURFACES = [0, 1, 2, 3];

/**
 * Half a step out is the interactive fill; a full step is a control's plane.
 *
 * Both derive from --itx-surface, and the counter only reaches layer 2 — so a
 * fill can only land on surfaces 0, 1 and 2. surface-3 is what
 * --itx-surface-above resolves to at the deepest layer, so it is measured bare.
 *
 * The deepest painted background the system can produce is therefore surface-2
 * plus a control fill, which lands exactly on surface-3's value — inside the
 * worst case the text tiers were solved against.
 */
const FILLED_SURFACES = new Set([0, 1, 2]);
const FILLS = [
	{ suffix: "", delta: 0 },
	{ suffix: " + interactive fill", delta: 0.025 },
	{ suffix: " + control fill", delta: 0.05 },
];

const TEXT_FLOORS = [
	["--itx-role-text", 7],
	["--itx-role-text-quiet", 7],
	["--itx-role-text-quieter", 4.5],
	["--itx-role-text-disabled", 3],
	["--itx-role-edge", 3],
];

/* ── Read the ladder, per block, so a variant is judged against its own hues ── */

function readBlocks() {
	const css = readFileSync(LADDER, "utf8").replace(/\/\*[\s\S]*?\*\//g, (m) =>
		m.replace(/[^\n]/g, " "),
	);
	const blocks = [];
	for (const m of css.matchAll(/^(:where\([^{]*)\{([\s\S]*?)^\}/gm)) {
		const decls = new Map();
		for (const d of m[2].matchAll(/(--itx-[a-z0-9-]+)\s*:\s*([^;]+);/g))
			decls.set(d[1], d[2].replace(/\s+/g, " ").trim());
		if (decls.size) blocks.push({ selector: m[1].trim(), decls });
	}
	if (!blocks.length) {
		console.error(
			"✗ no declarations found in ladder.css — has its shape changed?",
		);
		process.exit(1);
	}
	return blocks;
}

const BLOCKS = readBlocks();
/* The root block is the base every variant sits on. A variant that redeclares
   a hue must redeclare its roles too, and this composition is what would show
   it up if one ever did not: the variant's own map wins, the root fills gaps. */
const ROOT = new Map();
for (const b of BLOCKS)
	if (/\[interop-root\]/.test(b.selector))
		for (const [k, v] of b.decls) if (!ROOT.has(k)) ROOT.set(k, v);

/** Substitute var(), then pick one arm of light-dark(). */
function resolve(value, decls, scheme, depth = 0) {
	if (depth > 12) throw new Error(`token cycle resolving ${value}`);
	let out = value;
	for (let i = 0; i < 12; i++) {
		const next = out.replace(
			/var\(\s*(--itx-[a-z0-9-]+)\s*(?:,[^)]*)?\)/g,
			(m, name) => decls.get(name) ?? ROOT.get(name) ?? m,
		);
		if (next === out) break;
		out = next;
	}
	const at = out.indexOf("light-dark(");
	if (at === -1) return out;

	let level = 0;
	let split = -1;
	let end = -1;
	for (let i = at + "light-dark(".length; i < out.length; i++) {
		const c = out[i];
		if (c === "(") level++;
		else if (c === ")") {
			if (level === 0) {
				end = i;
				break;
			}
			level--;
		} else if (c === "," && level === 0) split = i;
	}
	const light = out.slice(at + "light-dark(".length, split).trim();
	const dark = out.slice(split + 1, end).trim();
	return resolve(
		out.slice(0, at) + (scheme === "light" ? light : dark) + out.slice(end + 1),
		decls,
		scheme,
		depth + 1,
	);
}

/** A surface with a derived fill on it, composed the way the CSS does. */
function fillOf(surface, delta, scheme) {
	if (!delta) return surface;
	const sign = scheme === "light" ? -1 : 1;
	return `oklch(from ${surface} calc(l + ${(sign * delta).toFixed(3)}) c h)`;
}

/* ── The manifest ────────────────────────────────────────────────────────── */

const pairs = [];
for (const { selector, decls } of BLOCKS) {
	const own = new Map([...ROOT, ...decls]);
	/* Only a block that sets hues owns families; the rest inherit the root's. */
	const owns = FAMILIES.filter((f) => decls.has(`--itx-${f}-hue`));
	const families = /\[interop-root\]/.test(selector) ? FAMILIES : owns;
	if (!families.length && !/\[interop-root\]/.test(selector)) continue;

	for (const scheme of ["light", "dark"]) {
		const R = (token) => resolve(`var(${token})`, own, scheme);

		for (const n of SURFACES) {
			const surface = R(`--itx-surface-${n}`);
			for (const { suffix, delta } of FILLS) {
				if (delta && !FILLED_SURFACES.has(n)) continue;
				const bg = fillOf(surface, delta, scheme);
				for (const [token, floor] of TEXT_FLOORS)
					pairs.push({
						label: `${selector} ${scheme} ${token.replace("--itx-role-", "")} on surface-${n}${suffix}`,
						fg: R(token),
						bg,
						floor,
					});
				for (const f of families) {
					pairs.push({
						label: `${selector} ${scheme} ${f} text on surface-${n}${suffix}`,
						fg: R(`--itx-role-text-${f}`),
						bg,
						floor: 4.5,
					});
					pairs.push({
						label: `${selector} ${scheme} ${f} edge on surface-${n}${suffix}`,
						fg: R(`--itx-role-edge-${f}`),
						bg,
						floor: 3,
					});
				}
			}
		}

		for (const f of families) {
			pairs.push({
				label: `${selector} ${scheme} ${f} text on its own wash`,
				fg: R(`--itx-role-text-${f}`),
				bg: R(`--itx-role-background-${f}-subtle`),
				floor: 4.5,
			});
			pairs.push({
				label: `${selector} ${scheme} the one label on the ${f} fill`,
				fg: R("--itx-role-text-inverse"),
				bg: R(`--itx-role-background-${f}`),
				floor: 4.5,
			});
		}
	}
}

/* ── Measure ─────────────────────────────────────────────────────────────── */

const CHROME = [
	process.env["CHROME_PATH"],
	process.env["CHROME_BIN"],
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/usr/bin/google-chrome",
	"/usr/bin/google-chrome-stable",
	"/usr/bin/chromium",
	"/usr/bin/chromium-browser",
]
	.filter(Boolean)
	.find((p) => existsSync(p));

if (!CHROME) {
	const message =
		"could not find Chrome — set CHROME_PATH to run the render check.";
	if (process.env["REQUIRE_BROWSER"]) {
		console.error(`✗ ${message}`);
		process.exit(1);
	}
	console.warn(
		`\n⚠ ${message}\n  Skipped — this is one of the two things that prove the floors.`,
	);
	process.exit(0);
}

/*
 * A canvas fill resolves oklch() and relative colour syntax through the same
 * pipeline as a painted element, and getImageData returns the 8-bit sRGB the
 * user actually sees — the space WCAG's formula is defined in.
 *
 * The foreground is painted OVER its background, because the edge and the
 * divider are one ink at two opacities. Compositing over black instead reads
 * the ink's own luminance and reports a border far darker than the one on
 * screen. Identical for an opaque foreground.
 */
const page = join(tmpdir(), `itx-render-${process.pid}.html`);
writeFileSync(
	page,
	`<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>
const PAIRS = ${JSON.stringify(pairs.map(({ fg, bg }) => ({ fg, bg })))};
const c = document.createElement("canvas"); c.width = c.height = 1;
const x = c.getContext("2d", { willReadFrequently: true });
function px(css, under) {
  x.fillStyle = "#000"; x.fillRect(0,0,1,1);
  if (under) { x.fillStyle = under; x.fillRect(0,0,1,1); }
  x.fillStyle = css; x.fillRect(0,0,1,1);
  const d = x.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]];
}
const lin = u => u <= 0.04045 ? u/12.92 : ((u+0.055)/1.055)**2.4;
const Y = ([r,g,b]) => 0.2126*lin(r/255) + 0.7152*lin(g/255) + 0.0722*lin(b/255);
const ratio = (a,b) => { const [h,l] = a>=b?[a,b]:[b,a]; return (h+0.05)/(l+0.05); };
document.getElementById("out").textContent = PAIRS
  .map(p => ratio(Y(px(p.fg, p.bg)), Y(px(p.bg))).toFixed(4))
  .join("\\n");
</script></body>`,
);

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
	console.error(
		"✗ the probe page produced no output — is Chrome headless working?",
	);
	process.exit(1);
}
const measured = body[1].trim().split("\n").map(Number);
if (measured.length !== pairs.length) {
	console.error(
		`✗ measured ${measured.length} pairings, expected ${pairs.length}`,
	);
	process.exit(1);
}

const failures = [];
let tightest = null;
pairs.forEach((p, i) => {
	const ratio = measured[i];
	if (Number.isNaN(ratio)) {
		failures.push(`  ${p.label}: did not resolve   ${p.fg} | ${p.bg}`);
		return;
	}
	if (ratio < p.floor)
		failures.push(`  ${p.label}: ${ratio} < ${p.floor}   ${p.fg} | ${p.bg}`);
	const slack = ratio - p.floor;
	if (!tightest || slack < tightest.slack)
		tightest = { slack, ratio, floor: p.floor, label: p.label };
});

if (failures.length) {
	console.error(
		`✗ ${failures.length} of ${pairs.length} pairings fail their floor as Chrome renders the LITERAL values:\n`,
	);
	failures.forEach((f) => console.error(f));
	process.exit(1);
}

console.log(
	`✓ all ${pairs.length} pairings clear their floor as Chrome renders them — tightest ${tightest.ratio} against ${tightest.floor} (${tightest.label})`,
);
