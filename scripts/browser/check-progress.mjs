// Checks progress[interop-progress="ring"] in Chromium and WebKit: the fill angle read from value and
// max with typed attr(), a value set from script, the spinner, the sizes, forced colors, and that the
// bar is unchanged. Reduced motion makes a new value land at once. Returns a list of failures; empty
// means it passed. Run through run-checks.mjs.

const read = () => {
	const ring = (id) => {
		const style = getComputedStyle(document.getElementById(id));
		return {
			fill: style.getPropertyValue("--itx-progress-ring-fill").trim(),
			inline: parseFloat(style.width),
			block: parseFloat(style.height),
			animation: style.animationName,
			duration: style.animationDuration,
			image: style.backgroundImage,
		};
	};
	return {
		quarter: ring("quarter"),
		fraction: ring("fraction"),
		full: ring("full"),
		spinner: ring("spinner"),
		scripted: ring("scripted"),
		sm: ring("sm"),
		md: ring("md"),
		lg: ring("lg"),
		bar: ring("bar"),
		button: document.querySelector("button").getBoundingClientRect().height,
	};
};

export async function checkProgress(page, base) {
	const failures = [];
	const expect = (label, actual, wanted) => {
		if (actual !== wanted)
			failures.push(`${label}: ${actual}, wanted ${wanted}`);
	};
	const degrees = (angle) =>
		Math.round(parseFloat(angle) * (angle.endsWith("turn") ? 360 : 1));

	await page.emulateMedia({ reducedMotion: "reduce" });
	await page.goto(`${base}/progress.html`);
	await page.evaluate(() => (document.getElementById("scripted").value = 80));
	let now = await page.evaluate(read);
	expect("25 of 100", degrees(now.quarter.fill), 90);
	expect("0.66 of 1", degrees(now.fraction.fill), 238);
	expect("7 of 7", degrees(now.full.fill), 360);
	expect("80 set from script", degrees(now.scripted.fill), 288);
	expect("spinner turns", now.spinner.animation, "itx-progress-ring-turn");
	expect("spinner slows with reduced motion", now.spinner.duration, "1.5s");
	expect("determinate ring stays still", now.quarter.animation, "none");
	expect("ring is round", now.md.inline, now.md.block);
	expect(
		"sizes",
		[now.sm.inline, now.md.inline, now.lg.inline].join(" "),
		"32 40 56",
	);
	expect("large ring is a large button's height", now.lg.block, now.button);
	expect(
		"bar keeps its band, not the ring",
		now.bar.fill === "" || degrees(now.bar.fill) === 0,
		true,
	);
	expect("bar keeps its width", now.bar.inline > now.lg.inline, true);

	await page.emulateMedia({ forcedColors: "active" });
	now = await page.evaluate(read);
	expect(
		"forced colors keep the ring",
		now.quarter.image.includes("conic-gradient"),
		true,
	);
	return failures;
}
