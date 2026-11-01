// Builds and serves the spike, runs every browser check in Chromium and WebKit, and exits non-zero
// on any failure: npm run test:browser
import { chromium, webkit } from "playwright";
import { checkHydration } from "./check-hydration.mjs";
import { checkPassword } from "./check-password.mjs";
import { checkReact } from "./check-react.mjs";
import { checkTabs } from "./check-tabs.mjs";
import { serve } from "./serve.mjs";

const checks = {
	tabs: checkTabs,
	password: checkPassword,
	hydration: checkHydration,
	react: checkReact,
};
const { url, stop } = await serve();
let failed = 0;
try {
	for (const [engine, type] of [
		["Chromium", chromium],
		["WebKit", webkit],
	]) {
		const browser = await type.launch();
		try {
			for (const [name, check] of Object.entries(checks)) {
				const page = await browser.newPage({
					viewport: { width: 1000, height: 900 },
				});
				const failures = await check(page, url);
				await page.close();
				failed += failures.length;
				console.log(`${failures.length ? "✗" : "✓"} ${engine} ${name}`);
				for (const failure of failures) console.log(`    ${failure}`);
			}
		} finally {
			await browser.close();
		}
	}
} finally {
	await stop();
}
process.exit(failed ? 1 : 0);
