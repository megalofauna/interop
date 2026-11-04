// Checks numbered lists (ol[interop-list="outlined"|"filled"]) in Chromium and WebKit: in Chromium,
// whose list-item counter ignores reversed and <li value>, the drawn numbers, read from the
// accessibility tree; in both, the shapes: a circle for one digit, a pill for two, the number
// centered on the item's first line, the same place in every list, and on the right in RTL. Returns a list
// of failures; empty means it passed. Run through run-checks.mjs.

const expected = {
	outlined: "1 2 3",
	start: "3 4 5",
	reversed: "3 2 1",
	"reversed-start": "10 9 8",
	value: "1 10 11",
	"reversed-value": "3 7 6",
	ten: "1 2 3 4 5 6 7 8 9 10",
};

/** The first text of each item of each list, from Chromium's accessibility tree: the drawn number. */
async function numbers(page) {
	const cdp = await page.context().newCDPSession(page);
	const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
	const { nodes } = await cdp.send("Accessibility.getFullAXTree");
	const byId = new Map(nodes.map((node) => [node.nodeId, node]));
	const firstText = (node) => {
		for (const id of node.childIds ?? []) {
			const child = byId.get(id);
			if (child?.role?.value === "StaticText") return child.name?.value ?? "";
			const found = child && firstText(child);
			if (found) return found;
		}
		return "";
	};
	const result = {};
	for (const id of Object.keys(expected)) {
		const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
			nodeId: root.nodeId,
			selector: `#${id} > li`,
		});
		const items = [];
		for (const nodeId of nodeIds) {
			const { node } = await cdp.send("DOM.describeNode", { nodeId });
			const ax = nodes.find(
				(candidate) => candidate.backendDOMNodeId === node.backendNodeId,
			);
			items.push(ax ? firstText(ax) : "?");
		}
		result[id] = items.join(" ");
	}
	return result;
}

const shapes = () => {
	/** The number's box, relative to its item: positioned, so left and top resolve to pixels. */
	const marker = (li) => {
		const style = getComputedStyle(li, "::before");
		return {
			left: parseFloat(style.left),
			top: parseFloat(style.top),
			inline: parseFloat(style.width),
			block: parseFloat(style.height),
			border: parseFloat(style.borderTopWidth),
		};
	};
	const first = document.querySelector("#outlined > li");
	const ten = document.querySelector("#ten");
	const tenItem = ten.lastElementChild;
	const rtl = document.querySelector("#rtl > li");
	const lists = document.querySelectorAll(
		'.cols > ol:is([interop-list~="outlined"], [interop-list~="filled"]), #ten',
	);
	const firstStyle = getComputedStyle(first);
	return {
		circle: marker(first),
		pill: marker(tenItem),
		filled: marker(document.querySelector("#filled > li")),
		// The first line's box: the item's padding (when the line is shorter than the number) and one line.
		lineBlock:
			parseFloat(firstStyle.paddingTop) * 2 +
			parseFloat(firstStyle.lineHeight || "0"),
		lineHeight: parseFloat(firstStyle.lineHeight),
		// Every drawn list puts its text, and its numbers' end, in the same place.
		textStarts: new Set(
			[...lists].map((ol) =>
				Math.round(
					ol.firstElementChild.getBoundingClientRect().left -
						ol.getBoundingClientRect().left,
				),
			),
		).size,
		markerEnds: new Set(
			[...lists].flatMap((ol) =>
				[...ol.children].map((li) => {
					const style = getComputedStyle(li, "::before");
					return Math.round(parseFloat(style.left) + parseFloat(style.width));
				}),
			),
		).size,
		rtlHangs: marker(rtl).left >= rtl.getBoundingClientRect().width,
		bareStyle: getComputedStyle(document.querySelector("#bare")).listStyleType,
	};
};

export async function checkList(page, base) {
	const failures = [];
	const expect = (label, actual, wanted) => {
		if (actual !== wanted)
			failures.push(`${label}: ${actual}, wanted ${wanted}`);
	};

	await page.goto(`${base}/list.html`);
	if (page.context().browser().browserType().name() === "chromium") {
		const found = await numbers(page);
		for (const [id, wanted] of Object.entries(expected))
			expect(`${id} numbers`, found[id], wanted);
	}

	const shape = await page.evaluate(shapes);
	expect("one digit is a circle", shape.circle.inline, shape.circle.block);
	expect("two digits are a pill", shape.pill.inline > shape.pill.block, true);
	expect("outlined ring", shape.circle.border > 0, true);
	expect("filled disc keeps its edge", shape.filled.border > 0, true);
	// Centered on the first line: as far above the line's middle as below it.
	const middle = Number.isNaN(shape.lineHeight)
		? null
		: Math.max(shape.lineHeight, shape.circle.block) / 2;
	if (middle !== null)
		expect(
			"number centered on the first line",
			Math.round(shape.circle.top + shape.circle.block / 2),
			Math.round(middle),
		);
	expect("text starts at one place in every list", shape.textStarts, 1);
	expect("numbers end at one place in every list", shape.markerEnds, 1);
	expect("number on the right in RTL", shape.rtlHangs, true);
	expect("bare list keeps the browser's numbers", shape.bareStyle, "decimal");
	return failures;
}
