// Checks <interop-tabs> layout in Chromium and WebKit with panels that have a border, padding and
// background: height, paint, clicks, find-in-page reveal (through a text fragment) and vertical tabs.
// Returns a list of failures; empty means it passed. Run through run-checks.mjs.

const setup = () => {
	const style = document.createElement("style");
	style.textContent =
		"interop-tabs.decorated > [role=tabpanel] { border: 2px solid red; padding: 12px; background: #333; }";
	document.head.append(style);
	document.querySelector("#parsed").classList.add("decorated");
	document.querySelector("#parsed").parentElement.insertAdjacentHTML(
		"beforeend",
		`
		<div id="flex" style="display:flex;flex-direction:column;align-items:flex-start;gap:16px">
			<interop-tabs id="v" class="decorated">
				<div role="tablist" aria-label="Account" aria-orientation="vertical">
					<button type="button" role="tab" aria-controls="p1" aria-selected="true">Profile</button>
					<button type="button" role="tab" aria-controls="p2">Security</button>
				</div>
				<section role="tabpanel" id="p1"><p>Name and photo.</p></section>
				<section role="tabpanel" id="p2" hidden="until-found"><p>Passkeys and sessions.</p></section>
			</interop-tabs>
		</div>`,
	);
};
const measure = () => {
	const h = document.querySelector("#parsed");
	const list = h.querySelector("[role=tablist]").getBoundingClientRect();
	const nav = document.querySelector("#nav").getBoundingClientRect();
	const tab = h.querySelector("[role=tab]").getBoundingClientRect();
	const hidden = [...h.querySelectorAll("[role=tabpanel][hidden]")];
	const v = document.querySelector("#v");
	const p1 = document.querySelector("#p1").getBoundingClientRect();
	const vlist = v.querySelector("[role=tablist]").getBoundingClientRect();
	return {
		heightIsTabsPlusPanel:
			Math.round(h.getBoundingClientRect().height) ===
			Math.round(list.height + nav.height),
		hiddenOpacity: hidden.map((p) => getComputedStyle(p).opacity).join(","),
		clickOnPanelHits: document
			.elementFromPoint(nav.left + 4, nav.top + 4)
			.closest("[role=tabpanel]")?.id,
		clickOnTabHits: document
			.elementFromPoint(tab.left + 4, tab.top + 4)
			.closest("[role=tab]")
			?.textContent.trim(),
		verticalPanelBesideTabs: Math.round(p1.left - vlist.right),
		verticalSameTop: Math.round(p1.top) === Math.round(vlist.top),
	};
};

/** @param {import("playwright").Page} page @param {string} base */
export async function checkTabs(page, base) {
	const failures = [];

	// Decorated panels take the same height before the element upgrades as after: no layout shift.
	const decorate = () => {
		const style = document.createElement("style");
		style.textContent =
			"#parsed > [role=tabpanel] { border: 2px solid red; padding: 12px; margin-block: 8px; }";
		document.head.append(style);
	};
	const height = () =>
		Math.round(
			document.querySelector("#parsed").getBoundingClientRect().height,
		);
	await page.route("**/dist/tabs.js", (route) => route.abort());
	await page.goto(`${base}/plain.html`);
	await page.evaluate(decorate);
	const before = await page.evaluate(height);
	await page.unroute("**/dist/tabs.js");
	await page.goto(`${base}/plain.html`);
	await page.waitForFunction(() => customElements.get("interop-tabs"));
	await page.evaluate(decorate);
	const after = await page.evaluate(height);
	if (before !== after)
		failures.push(
			`decorated panels: ${before}px before the upgrade, ${after}px after`,
		);

	await page.goto(`${base}/plain.html`);
	await page.waitForFunction(() => customElements.get("interop-tabs"));
	await page.evaluate(setup);
	await page.waitForTimeout(200);
	const layout = await page.evaluate(measure);
	const expected = {
		heightIsTabsPlusPanel: true,
		hiddenOpacity: "0,0",
		clickOnPanelHits: "nav",
		clickOnTabHits: "Navigation",
		verticalPanelBesideTabs: 24,
		verticalSameTop: true,
	};
	for (const [key, value] of Object.entries(expected)) {
		if (layout[key] !== value)
			failures.push(`${key}: ${layout[key]}, expected ${value}`);
	}

	const third = await page.evaluate(() => {
		const r = document
			.querySelectorAll("#parsed [role=tab]")[2]
			.getBoundingClientRect();
		return [r.left + 5, r.top + 5];
	});
	await page.mouse.click(...third);
	const clicked = await page.evaluate(
		() =>
			`${document.querySelector("#parsed [aria-selected=true]").textContent.trim()} ${getComputedStyle(document.querySelector("#life")).opacity}`,
	);
	if (clicked !== "Life support 1")
		failures.push(`click on the third tab: ${clicked}`);

	await page.goto(`${base}/plain.html#:~:text=Reactor%20output`);
	await page.waitForTimeout(1200);
	const found = await page.evaluate(
		() =>
			`${document.querySelector("#parsed [aria-selected=true]").textContent.trim()} ${document.querySelector("#eng").getAttribute("hidden")}`,
	);
	if (found !== "Engineering null")
		failures.push(`text fragment into a hidden panel: ${found}`);

	// Panels the author made tab stops: Tab from the selected tab reaches the shown panel, then leaves.
	// An animation on panels does not bring a hidden one back.
	await page.evaluate(() => {
		const style = document.createElement("style");
		style.textContent =
			"@keyframes fade { from { opacity: 0.2 } to { opacity: 1 } } #stops > [role=tabpanel] { animation: fade 1s both; background: #333; }";
		document.head.append(style);
		document.body.insertAdjacentHTML(
			"beforeend",
			`<interop-tabs id="stops"><div role="tablist" aria-label="Stops"><button type="button" role="tab" aria-controls="t0" aria-selected="true">Zero</button><button type="button" role="tab" aria-controls="t1">One</button><button type="button" role="tab" aria-controls="t2">Two</button></div><section role="tabpanel" id="t0" tabindex="0">Zero</section><section role="tabpanel" id="t1" tabindex="0" hidden="until-found">One</section><section role="tabpanel" id="t2" tabindex="0" hidden="until-found">Two</section></interop-tabs><button type="button" id="after-stops">After</button>`,
		);
	});
	await page.waitForFunction(
		() => document.querySelector("#stops [role=tab]")?.id,
	);
	await page.focus("#stops [aria-selected=true]");
	const order = [];
	for (let i = 0; i < 2; i++) {
		await page.keyboard.press("Tab");
		order.push(await page.evaluate(() => document.activeElement.id));
	}
	if (order.join(" ") !== "t0 after-stops")
		failures.push(`Tab order with panel tab stops: ${order.join(" ")}`);
	const animated = await page.evaluate(
		() => getComputedStyle(document.querySelector("#t1")).opacity,
	);
	if (animated !== "0")
		failures.push(`a hidden panel under an animation has opacity ${animated}`);

	// In print, every panel of the decorated tabs shows, stacked in order.
	await page.emulateMedia({ media: "print" });
	const printed = await page.evaluate(() => {
		const panels = [...document.querySelectorAll("#parsed > [role=tabpanel]")];
		const boxes = panels.map((panel) => panel.getBoundingClientRect());
		return {
			visible: panels.every(
				(panel, i) =>
					getComputedStyle(panel).opacity === "1" && boxes[i].height > 30,
			),
			stacked: boxes.every(
				(box, i) => i === 0 || box.top >= boxes[i - 1].bottom - 1,
			),
		};
	});
	await page.emulateMedia({ media: "screen" });
	if (!printed.visible || !printed.stacked)
		failures.push(`print: ${JSON.stringify(printed)}`);

	// An opacity transition on panels does not show a hidden panel while it runs.
	await page.evaluate(() => {
		const style = document.createElement("style");
		style.textContent = "#parsed > [role=tabpanel] { transition: opacity 3s; }";
		document.head.append(style);
		document.querySelector("#parsed [aria-controls=nav]").click();
		document.querySelector("#parsed [aria-controls=eng]").click();
	});
	await page.waitForTimeout(200);
	const fading = await page.evaluate(
		() => getComputedStyle(document.querySelector("#nav")).opacity,
	);
	if (fading !== "0")
		failures.push(
			`a hidden panel under an opacity transition has opacity ${fading}`,
		);

	// A [hidden] { display: none !important } reset does not take hidden panels away from print.
	await page.evaluate(() => {
		const style = document.createElement("style");
		style.textContent = "[hidden] { display: none !important; }";
		document.head.append(style);
	});
	const resetDisplay = await page.evaluate(
		() => getComputedStyle(document.querySelector("#nav")).display,
	);
	if (resetDisplay === "none")
		failures.push("a [hidden] reset turns hidden panels into display: none");

	// Inside a shadow root, panels are found in the shadow root, not the document.
	const shadow = await page.evaluate(() => {
		const host = document.createElement("div");
		document.body.append(host);
		const root = host.attachShadow({ mode: "open" });
		root.innerHTML = `<interop-tabs><div role="tablist" aria-label="Shadow"><button type="button" role="tab" aria-controls="s1">One</button><button type="button" role="tab" aria-controls="s2">Two</button></div><section role="tabpanel" id="s1">One</section><section role="tabpanel" id="s2">Two</section></interop-tabs>`;
		return [...root.querySelectorAll("[role=tabpanel]")]
			.map((panel) => panel.getAttribute("hidden"))
			.join(",");
	});
	if (shadow !== ",until-found")
		failures.push(`inside a shadow root, panels hidden: ${shadow}`);

	return failures;
}
