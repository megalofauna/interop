// Checks <interop-validation> in Chromium and WebKit with real input: the browser's own validation
// while the script is blocked, then a failed submit in the page, clicked straight from the field: no bubble, the summary filled and
// focused, its link moving to the field, and the password left shown while the user fixes the
// error. Returns a list of failures; empty means it passed. Run through run-checks.mjs.

const state = () => {
	const summary = document.querySelector("[interop-error-summary]");
	return {
		noValidate: document.querySelector("#sign-in").noValidate,
		summaryShown: !summary.hidden,
		summaryFocused: document.activeElement === summary,
		link: summary.querySelector("a")?.textContent ?? "",
		focused: document.activeElement?.id ?? "",
		error: document.querySelector("#summary-field [interop-error]").textContent,
		invalid: document.querySelector("#summary").getAttribute("aria-invalid"),
		password: document.querySelector("#password").type,
	};
};

export async function checkValidation(page, base) {
	const failures = [];
	const expect = (label, actual, wanted) => {
		if (actual !== wanted)
			failures.push(`${label}: ${actual}, wanted ${wanted}`);
	};

	await page.route("**/dist/validation.js", (route) => route.abort());
	await page.goto(`${base}/field.html`);
	expect(
		"without script, novalidate",
		(await page.evaluate(state)).noValidate,
		false,
	);
	await page.unroute("**/dist/validation.js");

	await page.goto(`${base}/field.html`);
	await page.waitForFunction(() =>
		["interop-validation", "interop-character-count", "interop-password"].every(
			(name) => customElements.get(name),
		),
	);
	expect(
		"with script, novalidate",
		(await page.evaluate(state)).noValidate,
		true,
	);

	await page.locator('[command="--toggle-password"]').click();
	await page.locator("#summary").pressSequentially("Twelve chars");
	// Straight from the field: leaving it shows no error, so the button stays put under the click.
	await page.locator('[type="submit"]').click();
	let now = await page.evaluate(state);
	expect("after a failed submit, summary shown", now.summaryShown, true);
	expect("after a failed submit, summary focused", now.summaryFocused, true);
	expect("summary link", now.link, "Summary must be 10 characters or fewer");
	expect("field error", now.error, "Summary must be 10 characters or fewer");
	expect("field aria-invalid", now.invalid, "true");
	expect("password still shown", now.password, "text");

	await page.locator("[interop-error-summary] a").click();
	expect(
		"after the link, focus",
		(await page.evaluate(state)).focused,
		"summary",
	);
	return failures;
}
