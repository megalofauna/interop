// Checks that server-rendered <interop-tabs> hydrates in Angular without a mismatch, and that the
// tabs work afterwards. Returns a list of failures; empty means it passed.

/** @param {import("playwright").Page} page @param {string} base */
export async function checkHydration(page, base) {
	const failures = [];
	const messages = [];
	page.on("console", (message) =>
		messages.push(`${message.type()}: ${message.text()}`),
	);
	page.on("pageerror", (error) => messages.push(`pageerror: ${error.message}`));

	// Before the script runs: only the first panel shows, at the height the element keeps.
	const measure = () =>
		page.evaluate(() => ({
			shown: [...document.querySelectorAll("[role=tabpanel]")]
				.filter(
					(panel) =>
						getComputedStyle(panel).display !== "none" && !panel.hidden,
				)
				.map((panel) => panel.id)
				.join(","),
			height: Math.round(
				document.querySelector("interop-tabs").getBoundingClientRect().height,
			),
		}));
	await page.route("**/hydration-client.js", (route) => route.abort());
	await page.goto(`${base}/dist/hydration.html`);
	const before = await measure();
	await page.unroute("**/hydration-client.js");
	// The blocked script logs a failed load; only the real load's messages count.
	messages.length = 0;
	if (before.shown !== "log-1")
		failures.push(`before the script runs, panels shown: ${before.shown}`);

	await page.goto(`${base}/dist/hydration.html`);
	await page.waitForFunction(() =>
		document.querySelector("interop-tabs [role=tab][tabindex]"),
	);
	await page.waitForTimeout(300);

	const errors = messages.filter((m) => /^(error|pageerror)|NG0\d{3}/.test(m));
	if (errors.length) failures.push(`console errors: ${errors.join(" | ")}`);
	if (!messages.some((m) => /hydrated/i.test(m)))
		failures.push("Angular did not report hydration");

	const state = () =>
		page.evaluate(() =>
			[...document.querySelectorAll("interop-tabs [role=tab]")]
				.map((tab) => {
					const panel = document.getElementById(
						tab.getAttribute("aria-controls"),
					);
					return `${tab.textContent.trim()}${tab.getAttribute("aria-selected") === "true" ? "*" : ""}:${panel?.hidden === false ? "shown" : panel?.getAttribute("hidden")}`;
				})
				.join(" "),
		);

	const after = await measure();
	if (after.height !== before.height)
		failures.push(
			`height ${before.height} before the script, ${after.height} after`,
		);

	const bound = await state();
	if (bound !== "Log 1*:shown Log 2:until-found")
		failures.push(`after hydration: ${bound}`);

	await page.click("#add");
	await page.waitForTimeout(100);
	const added = await state();
	if (added !== "Log 1*:shown Log 2:until-found Log 3:until-found")
		failures.push(`after adding a log: ${added}`);

	await page.focus("interop-tabs [role=tab]");
	await page.keyboard.press("End");
	const keyed = await state();
	if (keyed !== "Log 1:until-found Log 2:until-found Log 3*:shown")
		failures.push(`after End: ${keyed}`);

	return failures;
}
