// Checks <interop-tabs> layout in Chromium and WebKit with panels that have a border, padding and
// background: height, paint, clicks, find-in-page reveal (through a text fragment) and vertical tabs.
// Serve the spike first, then run this:
//   node spikes/custom-elements/build.mjs
//   node spikes/custom-elements/check-tabs.mjs
import { chromium, webkit } from "playwright";

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

for (const [name, type] of [
	["Chromium", chromium],
	["WebKit", webkit],
]) {
	const browser = await type.launch();
	const page = await browser.newPage({
		viewport: { width: 1000, height: 900 },
	});
	await page.goto("http://localhost:8137/plain.html");
	await page.waitForFunction(() => customElements.get("interop-tabs"));
	await page.evaluate(setup);
	await page.waitForTimeout(200);
	const layout = await page.evaluate(measure);
	await page.mouse.click(
		...(await page.evaluate(() => {
			const r = document
				.querySelectorAll("#parsed [role=tab]")[2]
				.getBoundingClientRect();
			return [r.left + 5, r.top + 5];
		})),
	);
	const clicked = await page.evaluate(
		() =>
			document
				.querySelector("#parsed [aria-selected=true]")
				.textContent.trim() +
			" / life opacity " +
			getComputedStyle(document.querySelector("#life")).opacity,
	);
	await page.goto("http://localhost:8137/plain.html#:~:text=Reactor%20output");
	await page.waitForTimeout(1200);
	const found = await page.evaluate(() => ({
		selected: document
			.querySelector("#parsed [aria-selected=true]")
			.textContent.trim(),
		engHidden: document.querySelector("#eng").getAttribute("hidden"),
	}));
	console.log(
		name,
		JSON.stringify(
			{ ...layout, realClickOnThirdTab: clicked, textFragment: found },
			null,
			1,
		),
	);
	await browser.close();
}
