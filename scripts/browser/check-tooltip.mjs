// Checks bindTooltips() with real popovers in Chromium and WebKit: a tooltip is hidden before it
// first opens, opens on hover and on keyboard focus but not on a click, anchors above its trigger,
// opens for a label's control, closes on Escape, and works for a trigger added after binding and
// for a tooltip removed while open and put back. Returns a list of failures; empty means it passed.
// Run through run-checks.mjs.

const isOpen = (page, id) =>
	page.evaluate(
		(id) => document.getElementById(id).matches(":popover-open"),
		id,
	);
const center = async (page, selector) => {
	const box = await page.locator(selector).boundingBox();
	return [box.x + box.width / 2, box.y + box.height / 2];
};
const away = (page) => page.mouse.move(5, 5);
// The default start delay is 0.5s and the end delay 0.25s.
const wait = (page, ms = 700) => page.waitForTimeout(ms);

export async function checkTooltips(page, base) {
	const failures = [];
	const expect = (ok, message) => ok || failures.push(message);
	await page.goto(`${base}/tooltip.html`);
	await page.waitForFunction(() => window.unbindTooltips);

	expect(
		await page.evaluate(
			() =>
				getComputedStyle(document.getElementById("tip-save")).display ===
				"none",
		),
		"a tooltip is laid out before it first opens",
	);

	await page.mouse.move(...(await center(page, "#save")));
	await wait(page);
	expect(
		await isOpen(page, "tip-save"),
		"hovering the trigger does not open its tooltip",
	);
	const above = await page.evaluate(() => {
		const tip = document.getElementById("tip-save").getBoundingClientRect();
		const trigger = document.getElementById("save").getBoundingClientRect();
		return tip.bottom <= trigger.top + 1;
	});
	expect(above, "the tooltip does not sit above its trigger");
	await away(page);
	await wait(page);
	expect(
		!(await isOpen(page, "tip-save")),
		"leaving the trigger does not close its tooltip",
	);

	await page.click("#save");
	await away(page);
	await wait(page);
	expect(
		!(await isOpen(page, "tip-save")),
		"focus from a click opens the tooltip",
	);

	// A click on Save left the focus navigation starting point there, so step back to it from the radio.
	await page.focus('input[name="view"]');
	await page.keyboard.press("Shift+Tab");
	await page.waitForTimeout(50);
	const focused = await page.evaluate(() => document.activeElement?.id);
	expect(
		focused === "save",
		`Tab did not reach the trigger (focus on ${focused})`,
	);
	expect(
		await isOpen(page, "tip-save"),
		"keyboard focus does not open the tooltip",
	);
	await page.keyboard.press("Escape");
	await page.waitForTimeout(50);
	expect(
		!(await isOpen(page, "tip-save")),
		"Escape does not close the tooltip",
	);
	await page.evaluate(() => document.activeElement?.blur());

	await page.mouse.move(...(await center(page, "#grid-label svg")));
	await wait(page);
	expect(
		await isOpen(page, "tip-grid"),
		"hovering a label does not open its control's tooltip",
	);
	await away(page);
	await wait(page);

	// A trigger added after binding, as a framework would render it.
	await page.evaluate(() =>
		document.getElementById("later").insertAdjacentHTML(
			"beforeend",
			`<button type="button" id="new" aria-describedby="tip-new">New</button>
			<span interop-tooltip id="tip-new" popover="hint" role="tooltip">Starts a draft</span>`,
		),
	);
	await page.mouse.move(...(await center(page, "#new")));
	await wait(page);
	expect(
		await isOpen(page, "tip-new"),
		"a trigger added after binding does not open its tooltip",
	);

	// The open tooltip is removed and put back, as a re-render would.
	await page.evaluate(() => {
		const later = document.getElementById("later");
		const html = later.innerHTML;
		later.replaceChildren();
		later.innerHTML = html;
	});
	await away(page);
	await wait(page);
	await page.mouse.move(...(await center(page, "#new")));
	await wait(page);
	expect(
		await isOpen(page, "tip-new"),
		"a re-rendered trigger and tooltip do not open again",
	);

	await page.evaluate(() => window.unbindTooltips());
	await away(page);
	await page.mouse.move(...(await center(page, "#save")));
	await wait(page);
	expect(
		!(await isOpen(page, "tip-save")),
		"a tooltip opens after the last remover ran",
	);

	return failures;
}
