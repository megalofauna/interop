// Checks <interop-password> with real invoker clicks in Chromium and WebKit: the button hidden until
// the element is defined, the toggle, and the password hidden again on submit and reset. Returns a
// list of failures; empty means it passed. Run through run-checks.mjs.

const state = () => {
	const input = document.querySelector("#password");
	const button = document.querySelector('[command="--toggle-password"]');
	return {
		type: input.type,
		pressed: button.getAttribute("aria-pressed"),
		buttonShown: getComputedStyle(button).display !== "none",
		sameRow:
			Math.round(button.getBoundingClientRect().top) ===
			Math.round(input.getBoundingClientRect().top),
	};
};

export async function checkPassword(page, base) {
	const failures = [];
	const expect = (label, actual, wanted) => {
		if (actual !== wanted)
			failures.push(`${label}: ${actual}, wanted ${wanted}`);
	};

	await page.route("**/dist/password.js", (route) => route.abort());
	await page.goto(`${base}/field.html`);
	expect(
		"without script, button shown",
		(await page.evaluate(state)).buttonShown,
		false,
	);
	await page.unroute("**/dist/password.js");

	await page.goto(`${base}/field.html`);
	await page.waitForFunction(() => customElements.get("interop-password"));
	let now = await page.evaluate(state);
	expect("with script, button shown", now.buttonShown, true);
	expect("button beside the input", now.sameRow, true);

	const toggle = page.locator('[command="--toggle-password"]');
	await toggle.click();
	now = await page.evaluate(state);
	expect("after a click, type", now.type, "text");
	expect("after a click, aria-pressed", now.pressed, "true");
	await toggle.click();
	expect(
		"after a second click, type",
		(await page.evaluate(state)).type,
		"password",
	);

	await toggle.click();
	await page.locator('[type="submit"]').click();
	now = await page.evaluate(state);
	expect("after submit, type", now.type, "password");
	expect("after submit, aria-pressed", now.pressed, "false");

	await toggle.click();
	await page.locator('[type="reset"]').click();
	expect("after reset, type", (await page.evaluate(state)).type, "password");
	return failures;
}
