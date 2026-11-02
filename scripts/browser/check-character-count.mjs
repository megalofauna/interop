// Checks <interop-character-count> in Chromium and WebKit with real typing: the count hidden until
// the element is defined, its parts laid out as a plain field's (the element has no box), and going
// over the limit. Returns a list of failures; empty means it passed. Run through run-checks.mjs.

const state = () => {
	const field = document.querySelector("#summary-field");
	const control = document.querySelector("#summary");
	const count = field.querySelector("[interop-count]");
	const gap = parseFloat(getComputedStyle(field).rowGap);
	const below =
		count.getBoundingClientRect().top - control.getBoundingClientRect().bottom;
	return {
		countShown: getComputedStyle(count).display !== "none",
		text: count.textContent,
		over: count.hasAttribute("data-over"),
		spacedLikeTheField: Math.round(below) === Math.round(gap),
		// A box of its own would size the control to its content, not the field.
		widthOfAPlainField:
			Math.round(control.getBoundingClientRect().width) ===
			Math.round(
				document.querySelector("#plain").getBoundingClientRect().width,
			),
		marginTop: getComputedStyle(count).marginTop,
		valid: control.validity.valid,
		message: control.validationMessage,
	};
};

export async function checkCharacterCount(page, base) {
	const failures = [];
	const expect = (label, actual, wanted) => {
		if (actual !== wanted)
			failures.push(`${label}: ${actual}, wanted ${wanted}`);
	};

	await page.route("**/dist/character-count.js", (route) => route.abort());
	await page.goto(`${base}/field.html`);
	expect(
		"without script, count shown",
		(await page.evaluate(state)).countShown,
		false,
	);
	await page.unroute("**/dist/character-count.js");

	await page.goto(`${base}/field.html`);
	await page.waitForFunction(() =>
		customElements.get("interop-character-count"),
	);
	let now = await page.evaluate(state);
	expect("with script, count shown", now.countShown, true);
	expect("first count", now.text, "You have 10 characters remaining");
	expect("count a field gap below the control", now.spacedLikeTheField, true);
	expect("control as wide as a plain field's", now.widthOfAPlainField, true);
	expect("count margin", now.marginTop, "0px");

	await page.locator("#summary").pressSequentially("Twelve chars");
	now = await page.evaluate(state);
	expect("over the limit, count", now.text, "You have 2 characters too many");
	expect("over the limit, data-over", now.over, true);
	expect("over the limit, valid", now.valid, false);
	expect(
		"over the limit, message",
		now.message,
		"Summary must be 10 characters or fewer",
	);

	await page.locator("#summary").press("Backspace");
	await page.locator("#summary").press("Backspace");
	now = await page.evaluate(state);
	expect(
		"back at the limit, count",
		now.text,
		"You have 0 characters remaining",
	);
	expect("back at the limit, valid", now.valid, true);
	return failures;
}
