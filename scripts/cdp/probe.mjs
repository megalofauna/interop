// Drives a headless Chrome over the DevTools protocol to check a page the way a user meets it.
//
//   Start Chrome once:
//     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
//       --remote-debugging-port=9333 --user-data-dir=/tmp/cdp-profile about:blank &
//
//   node scripts/cdp/probe.mjs <url> [options]
//     --eval <js>        evaluate after load (awaited, with a user gesture), print the result
//     --click <x>,<y>    click there with a real mouse event, after --eval
//     --keys <list>      press real keys, comma-separated: Tab,Shift+Tab,ArrowDown,Enter,Escape,Space,a
//     --after <js>       evaluate after each key and print it beside the key
//     --ax <selector>    print role, name and states of the element and its descendants
//     --shot <file.png>  screenshot at the end
//     --media <json>     emulated media, e.g. '[{"name":"forced-colors","value":"active"}]'
//     --size <w>x<h>     viewport, default 1000x800
//     --port <n>         Chrome's debugging port, default 9333
//
// Programmatic focus does not set :focus-visible. Use --keys to test focus styles.
// The page has no focus until a real key or click reaches it. Before that, focus() moves
// activeElement but fires no focus, blur, focusin or focusout events. Press a key before
// testing focus events.
import { writeFileSync } from "node:fs";

const [url, ...rest] = process.argv.slice(2);
const opt = {};
for (let i = 0; i < rest.length; i += 2)
	opt[rest[i].replace(/^--/, "")] = rest[i + 1];
const port = opt.port ?? "9333";
const [width, height] = (opt.size ?? "1000x800").split("x").map(Number);

const { webSocketDebuggerUrl } = await (
	await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
		method: "PUT",
	})
).json();
const ws = new WebSocket(webSocketDebuggerUrl);
let id = 0;
const pending = new Map();
const warnings = [];
ws.onmessage = ({ data }) => {
	const message = JSON.parse(data);
	if (message.id && pending.has(message.id))
		(pending.get(message.id)(message.result ?? message.error),
			pending.delete(message.id));
	if (
		message.method === "Runtime.consoleAPICalled" &&
		message.params.type === "warning"
	)
		warnings.push(String(message.params.args[0]?.value ?? "").split("\n")[0]);
};
await new Promise((resolve) => (ws.onopen = resolve));
const send = (method, params = {}) =>
	new Promise((resolve) => {
		const i = ++id;
		pending.set(i, resolve);
		ws.send(JSON.stringify({ id: i, method, params }));
	});
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const evaluate = async (expression) =>
	(
		await send("Runtime.evaluate", {
			expression,
			awaitPromise: true,
			returnByValue: true,
			userGesture: true,
		})
	).result?.value;

await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
	width,
	height,
	deviceScaleFactor: 1,
	mobile: false,
});
if (opt.media)
	await send("Emulation.setEmulatedMedia", { features: JSON.parse(opt.media) });
await send("Page.navigate", { url });
await wait(3000);

if (opt.eval) console.log(JSON.stringify(await evaluate(opt.eval), null, 1));

if (opt.click) {
	const [x, y] = opt.click.split(",").map(Number);
	for (const type of ["mousePressed", "mouseReleased"])
		await send("Input.dispatchMouseEvent", {
			type,
			x,
			y,
			button: "left",
			clickCount: 1,
		});
	await wait(200);
	console.log(
		`click ${opt.click}`.padEnd(12),
		opt.after ? JSON.stringify(await evaluate(opt.after)) : "",
	);
}

const CODES = {
	Tab: 9,
	Enter: 13,
	Escape: 27,
	Space: 32,
	PageUp: 33,
	PageDown: 34,
	End: 35,
	Home: 36,
	ArrowLeft: 37,
	ArrowUp: 38,
	ArrowRight: 39,
	ArrowDown: 40,
};
for (const step of opt.keys ? opt.keys.split(",") : []) {
	const parts = step.split("+");
	const name = parts.pop();
	const modifiers =
		(parts.includes("Alt") ? 1 : 0) |
		(parts.includes("Ctrl") ? 2 : 0) |
		(parts.includes("Meta") ? 4 : 0) |
		(parts.includes("Shift") ? 8 : 0);
	const key = name === "Space" ? " " : name;
	const text = name === "Enter" ? "\r" : key.length === 1 ? key : undefined;
	const code = CODES[name] ?? key.toUpperCase().charCodeAt(0);
	await send("Input.dispatchKeyEvent", {
		type: "keyDown",
		key,
		code: name,
		windowsVirtualKeyCode: code,
		modifiers,
		text,
	});
	await send("Input.dispatchKeyEvent", {
		type: "keyUp",
		key,
		code: name,
		windowsVirtualKeyCode: code,
		modifiers,
	});
	await wait(200);
	console.log(
		step.padEnd(12),
		opt.after ? JSON.stringify(await evaluate(opt.after)) : "",
	);
}

if (opt.ax) {
	await send("DOM.enable");
	await send("Accessibility.enable");
	const { root } = await send("DOM.getDocument", { depth: -1 });
	const { nodeId } = await send("DOM.querySelector", {
		nodeId: root.nodeId,
		selector: opt.ax,
	});
	const { nodes } = await send("Accessibility.getPartialAXTree", {
		nodeId,
		fetchRelatives: false,
	});
	const { nodes: all } = await send("Accessibility.getFullAXTree");
	const byId = new Map(all.map((node) => [node.nodeId, node]));
	const print = (node, depth) => {
		if (!node) return;
		if (!node.ignored) {
			const states = (node.properties ?? [])
				.filter(
					(p) =>
						p.value.value !== false &&
						p.value.value !== "" &&
						p.value.value !== undefined,
				)
				.map((p) => `${p.name}=${p.value.value}`);
			console.log(
				`${"  ".repeat(depth)}${node.role?.value} "${node.name?.value ?? ""}" ${states.join(" ")}`,
			);
		}
		for (const child of node.childIds ?? [])
			print(byId.get(child), node.ignored ? depth : depth + 1);
	};
	print(byId.get(nodes[0].nodeId), 0);
}

if (opt.shot)
	writeFileSync(
		opt.shot,
		Buffer.from(
			(await send("Page.captureScreenshot", { format: "png" })).data,
			"base64",
		),
	);
if (warnings.length) console.log("console warnings:", warnings);
ws.close();
process.exit(0);
