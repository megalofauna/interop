#!/usr/bin/env node
/*
 * Contrast verification, in a real rendering engine.
 *
 * Nothing solves contrast any more — a palette step is a literal colour, and
 * its contrast is a consequence of where it sits on the ramp. So the guarantee
 * has to be MEASURED, and this is what measures it.
 *
 * The manifest below is the guarantee stated directly:
 *
 *     borders 7 steps from the background, text 8, enhanced text 10
 *
 * enumerated over every palette in the shipped CSS. That is deliberately not
 * derived from the values it checks — it is the rule the palette was built to
 * satisfy, so a palette edited into breaking it fails here.
 *
 * Measuring in a browser rather than in JS is not belt-and-braces: the two
 * round 8-bit channels differently and green carries 0.7152 of the luminance
 * weight, which has already shipped a real defect — a step rendering 4.48:1
 * in Chrome while arithmetic said 4.52:1.
 *
 * Usage:
 *   node scripts/check-contrast-render.mjs
 *
 * Chrome is located via CHROME_PATH / CHROME_BIN, then the usual install
 * locations. When it cannot be found the check WARNS AND PASSES rather than
 * failing, so a contributor without Chrome is not blocked by a check CI runs
 * anyway. Set REQUIRE_BROWSER=1 to turn that into a failure.
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

/*
 * The floor rule. Distances are from the BACKGROUND step, not absolute
 * positions, which is why one table covers every family and both schemes.
 */
const FLOORS = [
	{ distance: 7, ratio: 3, what: "border" },
	{ distance: 8, ratio: 4.5, what: "text" },
	{ distance: 10, ratio: 7, what: "enhanced text" },
];

/* Backgrounds a palette is read against: the page, and a tint. */
const BACKGROUND_STEPS = [1, 3];

const CANDIDATES = [
	process.env["CHROME_PATH"],
	process.env["CHROME_BIN"],
	"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
	"/Applications/Chromium.app/Contents/MacOS/Chromium",
	"/usr/bin/google-chrome",
	"/usr/bin/google-chrome-stable",
	"/usr/bin/chromium",
	"/usr/bin/chromium-browser",
].filter(Boolean);

function findChrome() {
	return CANDIDATES.find((p) => existsSync(p)) ?? null;
}

/**
 * Read every palette out of the shipped CSS, per block, so a colourway or a
 * status-palette variant is checked against its OWN steps rather than the
 * root's. A block that redeclares a family owns it.
 */
function readPalettes() {
	const css = readFileSync(LADDER, "utf8");
	const blocks = [...css.matchAll(/^(:where\([^{]*)\{([\s\S]*?)^\}/gm)];
	const out = [];
	for (const [, selector, body] of blocks) {
		const steps = {};
		const re =
			/--itx-([a-z-]+?)-(\d{1,2}):\s*light-dark\(\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\),\s*oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)/g;
		for (const m of body.matchAll(re)) {
			const [, family, n, ll, lc, lh, dl, dc, dh] = m;
			steps[family] ??= { light: {}, dark: {} };
			steps[family].light[+n] = { l: +ll, c: +lc, h: +lh };
			steps[family].dark[+n] = { l: +dl, c: +dc, h: +dh };
		}
		for (const [family, schemes] of Object.entries(steps)) {
			out.push({ selector: selector.trim(), family, schemes });
		}
	}
	if (!out.length) {
		console.error("✗ no palettes found in ladder.css — has its shape changed?");
		process.exit(1);
	}
	return out;
}

/** Enumerate the floor rule over every palette, in both schemes. */
function buildPairs() {
	const pairs = [];
	for (const { selector, family, schemes } of readPalettes()) {
		for (const scheme of ["light", "dark"]) {
			const steps = schemes[scheme];
			for (const bg of BACKGROUND_STEPS) {
				if (!steps[bg]) continue;
				for (const { distance, ratio, what } of FLOORS) {
					const fg = bg + distance;
					if (!steps[fg]) continue;
					pairs.push({
						label: `${selector} ${family} ${scheme} ${what} (step ${fg} on ${bg})`,
						fg: steps[fg],
						bg: steps[bg],
						floor: ratio,
					});
				}
			}
		}
	}
	return pairs;
}

/**
 * Paint each pair on a 1×1 canvas and read the pixels back.
 *
 * A canvas fill resolves oklch() through the same colour pipeline as a painted
 * element, and getImageData returns the 8-bit sRGB the user actually sees —
 * which is the space WCAG's formula is defined in.
 */
function probeHtml(pairs) {
	return `<!doctype html><meta charset="utf-8"><body><pre id="out"></pre><script>
const PAIRS = ${JSON.stringify(pairs)};
const c = document.createElement("canvas"); c.width = c.height = 1;
const x = c.getContext("2d", { willReadFrequently: true });
function px(css) {
  x.clearRect(0,0,1,1); x.fillStyle = "#000"; x.fillRect(0,0,1,1);
  x.fillStyle = css; x.fillRect(0,0,1,1);
  const d = x.getImageData(0,0,1,1).data; return [d[0],d[1],d[2]];
}
const lin = u => u <= 0.04045 ? u/12.92 : ((u+0.055)/1.055)**2.4;
const Y = ([r,g,b]) => 0.2126*lin(r/255) + 0.7152*lin(g/255) + 0.0722*lin(b/255);
const ratio = (a,b) => { const [h,l] = a>=b?[a,b]:[b,a]; return (h+0.05)/(l+0.05); };
const oklch = o => "oklch(" + o.l + " " + o.c + " " + o.h + ")";
document.getElementById("out").textContent = PAIRS
  .map(p => ratio(Y(px(oklch(p.fg))), Y(px(oklch(p.bg)))).toFixed(4))
  .join("\\n");
</script></body>`;
}

const chrome = findChrome();
if (!chrome) {
	const message =
		"could not find Chrome — set CHROME_PATH to run the render check.";
	if (process.env["REQUIRE_BROWSER"]) {
		console.error(`✗ ${message}`);
		process.exit(1);
	}
	console.warn(
		`\n⚠ ${message}\n  Skipped — this is the only thing that proves the floors.`,
	);
	process.exit(0);
}

const pairs = buildPairs();
const page = join(tmpdir(), `itx-contrast-${process.pid}.html`);
writeFileSync(page, probeHtml(pairs));

let dom;
try {
	dom = execFileSync(
		chrome,
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
		`✗ measured ${measured.length} pairs but expected ${pairs.length}.`,
	);
	process.exit(1);
}

const failures = [];
let tightest = null;
pairs.forEach((pair, i) => {
	const ratio = measured[i];
	const slack = ratio - pair.floor;
	if (slack < 0) failures.push({ ...pair, ratio });
	if (!tightest || slack < tightest.slack) tightest = { ...pair, ratio, slack };
});

if (failures.length) {
	console.error(
		`\n✗ ${failures.length} of ${pairs.length} pairings measure under their floor in Chrome:`,
	);
	for (const f of failures.slice(0, 20)) {
		console.error(`   ${f.label}: ${f.ratio.toFixed(2)}:1, needs ${f.floor}:1`);
	}
	if (failures.length > 20) {
		console.error(`   … and ${failures.length - 20} more`);
	}
	console.error(
		"\n  A palette step is not far enough from the step it is read against.\n" +
			"  The rule is borders 7 steps apart, text 8, enhanced 10 — so either a\n" +
			"  step moved in themes/protocol/ladder.css, or a family was added whose\n" +
			"  ramp is flatter than the rule allows.",
	);
	process.exit(1);
}

console.log(
	`✓ all ${pairs.length} pairings clear their floor as Chrome renders them ` +
		`— tightest ${tightest.ratio.toFixed(4)} against ${tightest.floor} ` +
		`(${tightest.label})`,
);
