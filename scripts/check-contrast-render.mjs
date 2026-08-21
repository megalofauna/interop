#!/usr/bin/env node
/*
 * Contrast verification, in a real rendering engine.
 *
 * scripts/generate-color-ladder.mjs proves every floor against its own
 * arithmetic. That is not the same as proving it against what a browser draws,
 * and the difference has already shipped: --itx-contrast-4 rendered at 4.48:1
 * in Chrome while the generator computed 4.52:1, because the two round one
 * 8-bit channel differently and green carries 0.7152 of the luminance weight.
 *
 * The solver now measures pessimistically — each colour nudged one unit toward
 * the thing it sits on — so that cannot recur. "Cannot recur" is a claim. This
 * checks it, by painting every pairing the generator claims a floor for and
 * reading the pixels back.
 *
 * The manifest comes from the generator (CONTRAST_PAIRS), so the two cannot
 * drift: a floor that is not emitted is not checked, and a floor that is
 * emitted is checked against the engine rather than the model.
 *
 * Usage:
 *   node scripts/check-contrast-render.mjs
 *
 * Chrome is located via CHROME_PATH / CHROME_BIN, then the usual install
 * locations. When it cannot be found the check WARNS AND PASSES rather than
 * failing: the generator's own validation still ran, and a contributor without
 * Chrome should not be blocked by a check the CI machine will run anyway. Set
 * REQUIRE_BROWSER=1 to turn that into a failure.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(
	REPO,
	"projects/interop/src/lib/styles/tokens/ladder.css-source.ts",
);

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

/** The manifest is generated, so its shape is stable enough to lift directly. */
function readPairs() {
	const src = readFileSync(SOURCE, "utf8");
	const match = src.match(/export const CONTRAST_PAIRS = (\[[\s\S]*?\]);/);
	if (!match) {
		console.error(
			"✗ no CONTRAST_PAIRS in the ladder fixture — run the generator first.",
		);
		process.exit(1);
	}
	return JSON.parse(match[1]);
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
		`\n⚠ ${message}\n  Skipped; the generator's own validation still ran.`,
	);
	process.exit(0);
}

const pairs = readPairs();
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
		"\n  The generator and the engine disagree about what these colours measure.\n" +
			"  The solver is supposed to make that impossible by measuring\n" +
			"  pessimistically — see luminanceBiased() in\n" +
			"  scripts/generate-color-ladder.mjs. Either its one-unit bound is no\n" +
			"  longer enough, or a value reached the CSS without going through it.",
	);
	process.exit(1);
}

console.log(
	`✓ all ${pairs.length} pairings clear their floor as Chrome renders them ` +
		`— tightest ${tightest.ratio.toFixed(4)} against ${tightest.floor} ` +
		`(${tightest.label})`,
);
