// Checks <interop-tabs> rendered by React 19: it binds, follows React adding and removing tabs, keeps
// manual activation, and reports changes. Returns a list of failures; empty means it passed.

/** @param {import("playwright").Page} page @param {string} base */
export async function checkReact(page, base) {
	const failures = [];
	await page.goto(`${base}/react.html`);
	await page.waitForFunction(() =>
		document.querySelector("interop-tabs [role=tab][tabindex]"),
	);
	const state = () =>
		page.evaluate(() =>
			[...document.querySelectorAll("interop-tabs [role=tab]")]
				.map((tab) => {
					const panel = document.getElementById(
						tab.getAttribute("aria-controls"),
					);
					return `${tab.textContent}${tab.getAttribute("aria-selected") === "true" ? "*" : ""}:${panel?.hidden === false ? "shown" : panel?.getAttribute("hidden")}`;
				})
				.join(" "),
		);
	const expect = async (label, expected) => {
		const actual = await state();
		if (actual !== expected) failures.push(`${label}: ${actual}`);
	};

	await expect("bound", "Log 1*:shown Log 2:until-found");
	await page.click("#add");
	await page.waitForFunction(
		() => document.querySelectorAll("interop-tabs [role=tab]").length === 3,
	);
	await expect(
		"after adding",
		"Log 1*:shown Log 2:until-found Log 3:until-found",
	);
	await page.click("interop-tabs [aria-controls=log-3]");
	await expect(
		"after a click",
		"Log 1:until-found Log 2:until-found Log 3*:shown",
	);
	// React renders the text after the event, so wait for it rather than read it at once.
	const reported = await page
		.waitForFunction(
			() =>
				document.querySelector("#last").textContent === "Last change: log-3",
			null,
			{ timeout: 2000 },
		)
		.then(
			() => true,
			() => false,
		);
	if (!reported)
		failures.push(`change event: ${await page.textContent("#last")}`);
	await page.click("#remove");
	await page.waitForFunction(
		() => document.querySelectorAll("interop-tabs [role=tab]").length === 2,
	);
	await expect(
		"after removing the selected tab",
		"Log 1:until-found Log 2*:shown",
	);
	await page.focus("interop-tabs [aria-selected=true]");
	await page.keyboard.press("ArrowLeft");
	const manual = await page.evaluate(
		() =>
			`${document.activeElement.textContent} ${document.activeElement.getAttribute("aria-selected")}`,
	);
	if (manual !== "Log 1 false") failures.push(`manual activation: ${manual}`);

	// React changes an input: it disables the selected tab, so the selection passes to a neighbor.
	await page.click("#disable");
	await page.waitForFunction(
		() => document.querySelector("interop-tabs [aria-controls=log-2]").disabled,
	);
	await expect(
		"after React disables the selected tab",
		"Log 1*:shown Log 2:until-found",
	);

	// React inserts a tab already marked selected: it takes the selection.
	await page.click("#add-selected");
	await page.waitForFunction(
		() => document.querySelectorAll("interop-tabs [role=tab]").length === 3,
	);
	await expect(
		"after React inserts a selected tab",
		"Log 1:until-found Log 2:until-found Log 3*:shown",
	);
	return failures;
}
