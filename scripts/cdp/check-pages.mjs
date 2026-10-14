// Checks every demo page in headless Chrome for what jsdom cannot see:
//
//   axe      axe-core in a real browser, color contrast included, on the page as rendered, light and dark
//   reflow   at 320px wide the page does not scroll sideways (WCAG 1.4.10)
//   ring     Tab through the page: every element that takes focus shows a ring, also in forced colors
//
//   node scripts/cdp/check-pages.mjs                     serves dist/demo/browser (run `npx ng build demo` first)
//   node scripts/cdp/check-pages.mjs --url http://localhost:1337    checks a running server instead
//   node scripts/cdp/check-pages.mjs --only components/field        one page
//
// Chrome comes from CHROME_BIN, or the macOS install. A failure listed in known-failures.json, with its
// reason, is reported but does not fail the run; one not listed does. A listed failure that no longer
// happens is reported too, so the list shrinks.
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const args = process.argv.slice(2);
const option = (name) =>
	args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined;
const REPO = new URL("../..", import.meta.url).pathname;
const known = JSON.parse(
	readFileSync(join(REPO, "scripts/cdp/known-failures.json"), "utf8"),
);
const routes = [
	...readFileSync(
		join(REPO, "projects/demo/src/app/app.routes.ts"),
		"utf8",
	).matchAll(/path: "([^"]*)"/g),
]
	.map(([, path]) => path)
	.filter((path) => !option("only") || path === option("only"));
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Serves the built demo, falling back to index.html for routes. */
function serve(root) {
	const types = {
		".html": "text/html",
		".js": "text/javascript",
		".css": "text/css",
		".svg": "image/svg+xml",
		".json": "application/json",
	};
	const server = createServer((request, response) => {
		const path = join(
			root,
			decodeURIComponent(new URL(request.url, "http://x").pathname),
		);
		const file =
			existsSync(path) && extname(path) ? path : join(root, "index.html");
		response.writeHead(200, {
			"content-type": types[extname(file)] ?? "application/octet-stream",
		});
		response.end(readFileSync(file));
	});
	return new Promise((resolve) =>
		server.listen(0, () =>
			resolve({
				url: `http://localhost:${server.address().port}`,
				close: () => server.close(),
			}),
		),
	);
}

/** Starts headless Chrome and resolves with its debugging port. */
function chrome() {
	const bin =
		process.env.CHROME_BIN ??
		"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
	// CI runners run Chrome without the sandbox, which needs privileges they do not have.
	const flags = [
		"--headless=new",
		"--remote-debugging-port=0",
		`--user-data-dir=${mkdtempSync(join(tmpdir(), "cdp-"))}`,
		"--no-first-run",
		...(process.env.CI ? ["--no-sandbox"] : []),
	];
	const child = spawn(bin, [...flags, "about:blank"]);
	return new Promise((resolve, reject) => {
		child.stderr.on("data", (data) => {
			const match = /DevTools listening on ws:\/\/[^:]+:(\d+)/.exec(
				String(data),
			);
			if (match) resolve({ port: match[1], close: () => child.kill() });
		});
		child.on("error", reject);
	});
}

/** A page with a small DevTools protocol client. */
async function page(port) {
	const { webSocketDebuggerUrl } = await (
		await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {
			method: "PUT",
		})
	).json();
	const ws = new WebSocket(webSocketDebuggerUrl);
	let id = 0;
	const pending = new Map();
	ws.onmessage = ({ data }) => {
		const message = JSON.parse(data);
		if (message.id && pending.has(message.id))
			(pending.get(message.id)(message.result ?? message.error),
				pending.delete(message.id));
	};
	await new Promise((resolve) => (ws.onopen = resolve));
	// A call that gets no answer in 10 seconds resolves empty, so one stuck page cannot hang the run.
	const send = (method, params = {}) =>
		new Promise((resolve) => {
			const i = ++id;
			const timer = setTimeout(
				() => (pending.delete(i), resolve({ timedOut: method })),
				10000,
			);
			pending.set(i, (result) => (clearTimeout(timer), resolve(result)));
			ws.send(JSON.stringify({ id: i, method, params }));
		});
	const evaluate = async (expression) => {
		const response = await send("Runtime.evaluate", {
			expression,
			awaitPromise: true,
			returnByValue: true,
		});
		if (response.timedOut)
			throw new Error("the page did not answer in 10 seconds");
		if (response.exceptionDetails)
			throw new Error(
				response.exceptionDetails.exception?.description ??
					response.exceptionDetails.text,
			);
		return response.result?.value;
	};
	const open = async (url, { width = 1280, height = 900, media = [] } = {}) => {
		await send("Emulation.setDeviceMetricsOverride", {
			width,
			height,
			deviceScaleFactor: 1,
			mobile: false,
		});
		await send("Emulation.setEmulatedMedia", { features: media });
		await send("Page.navigate", { url });
		await wait(1500);
	};
	const tab = async () => {
		for (const type of ["keyDown", "keyUp"])
			await send("Input.dispatchKeyEvent", {
				type,
				key: "Tab",
				code: "Tab",
				windowsVirtualKeyCode: 9,
			});
		await wait(30);
	};
	return { send, evaluate, open, tab, close: () => ws.close() };
}

const AXE = readFileSync(
	join(REPO, "node_modules/axe-core/axe.min.js"),
	"utf8",
);

/** A short, stable description of an element, for reports and the known-failures list. */
const DESCRIBE = `(el) => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (/^(A|BUTTON|SUMMARY)$/.test(el.tagName) ? '"' + el.textContent.trim().replace(/\\s+/g, ' ').slice(0, 24) + '"' : '') +
	[...el.attributes].filter((a) => /^(interop-|role$|type$|name$|aria-label$)/.test(a.name)).map((a) => '[' + a.name + (a.value ? '="' + a.value.slice(0, 30) + '"' : '') + ']').join('')`;

async function axeCheck(p, url, scheme) {
	await p.open(url, {
		media: [{ name: "prefers-color-scheme", value: scheme }],
	});
	await p.evaluate(AXE);
	const found = await p.evaluate(
		`axe.run(document, { resultTypes: ['violations'] }).then((r) => r.violations.flatMap((v) => v.nodes.map((n) => v.id + ' ' + n.target.join(' '))))`,
	);
	return found ?? [];
}

async function reflowCheck(p, url) {
	await p.open(url, { width: 320, height: 640 });
	return (
		(await p.evaluate(`(() => {
			const describe = ${DESCRIBE};
			const width = document.documentElement.clientWidth;
			if (document.documentElement.scrollWidth <= width + 1) return [];
			// The outermost elements past the edge that do not scroll their own content.
			const scrolls = (el) => /(auto|scroll)/.test(getComputedStyle(el).overflowX);
			return [...document.querySelectorAll('main *')]
				.filter((el) => el.getBoundingClientRect().right > width + 1 && !el.closest('[popover]'))
				.filter((el) => !el.parentElement || el.parentElement.getBoundingClientRect().right <= width + 1)
				.filter((el) => { for (let a = el.parentElement; a; a = a.parentElement) if (scrolls(a)) return false; return true; })
				.map(describe);
		})()`)) ?? []
	);
}

async function ringCheck(p, url, forced) {
	await p.open(url, {
		media: forced ? [{ name: "forced-colors", value: "active" }] : [],
	});
	const missing = new Set();
	let count = 0;
	// Each element is marked when focus reaches it; reaching a marked one means the walk has wrapped.
	for (let i = 0; i < 200; i++) {
		await p.tab();
		const result = await p.evaluate(`(() => {
			const el = document.activeElement;
			if (!el || el === document.body) return null;
			if (el.hasAttribute('data-itx-tab-stop')) return { wrapped: true };
			el.setAttribute('data-itx-tab-stop', '');
			// A card draws the ring on the label around its input, so the label's ring counts too.
			const drawn = (node) => {
				const cs = node && getComputedStyle(node);
				return !!cs && (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 || cs.boxShadow !== 'none');
			};
			return { key: (${DESCRIBE})(el), ring: drawn(el) || drawn(el.closest('label')) };
		})()`);
		if (!result || result.wrapped) break;
		count++;
		if (!result.ring) missing.add(result.key);
	}
	stops[forced ? "forced" : "normal"] = count;
	return [...missing];
}

const server = option("url")
	? { url: option("url"), close: () => {} }
	: await serve(join(REPO, "dist/demo/browser"));
const browser = await chrome();
const p = await page(browser.port);
/** How many Tab stops the last ring check reached, so a check that reached none is visible. */
const stops = {};
const failures = [];
const expected = [];
const seenKnown = new Set();

for (const route of routes) {
	const url = `${server.url}/${route}`;
	const results = {};
	for (const [check, run] of Object.entries({
		"axe, light": () => axeCheck(p, url, "light"),
		"axe, dark": () => axeCheck(p, url, "dark"),
		reflow: () => reflowCheck(p, url),
		ring: () => ringCheck(p, url, false),
		"ring in forced colors": () => ringCheck(p, url, true),
	})) {
		results[check] = await run().catch((error) => [
			`could not check: ${error.message.split("\n")[0]}`,
		]);
	}
	for (const [check, items] of Object.entries(results)) {
		for (const item of items) {
			const key = `${route || "/"} · ${check} · ${item}`;
			if (known[key]) {
				expected.push(`${key}\n    known: ${known[key]}`);
				seenKnown.add(key);
			} else failures.push(key);
		}
	}
	console.log(
		`${(route || "/").padEnd(32)} ${Object.entries(results)
			.map(([check, items]) => `${check} ${items.length}`)
			.join("  ")}  (Tab stops ${stops.normal}, ${stops.forced} forced)`,
	);
	if (!stops.normal)
		failures.push(
			`${route || "/"} · ring · no element took focus, so nothing was checked`,
		);
}

const fixed = Object.keys(known).filter(
	(key) =>
		!seenKnown.has(key) &&
		routes.includes(key.split(" · ")[0] === "/" ? "" : key.split(" · ")[0]),
);
if (expected.length)
	console.log(
		`\nKnown failures (${expected.length}):\n  ${expected.join("\n  ")}`,
	);
if (fixed.length)
	console.log(
		`\nListed as known but no longer failing; remove them from known-failures.json:\n  ${fixed.join("\n  ")}`,
	);
if (failures.length)
	console.log(`\nFailures (${failures.length}):\n  ${failures.join("\n  ")}`);
else console.log("\nNo new failures.");

p.close();
browser.close();
server.close();
process.exit(failures.length ? 1 : 0);
