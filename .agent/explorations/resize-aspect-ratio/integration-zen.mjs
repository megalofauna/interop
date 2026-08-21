import puppeteer from "puppeteer-core";
const URL = "file:///tmp/resize-probe/integration.html";
const b = await puppeteer.launch({ browser: "firefox",
  executablePath: "/Applications/Zen.app/Contents/MacOS/zen",
  headless: true, protocol: "webDriverBiDi", timeout: 120000 });
const page = await b.newPage();
await page.setViewport({ width: 1400, height: 1000 });
await page.goto(URL, { waitUntil: "load" });
console.log("\n### ZEN (Gecko)");
for (const id of ["#projected", "#naive"]) {
  const box = await page.$eval(id, (el) => { const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const x = box.x + box.w - 3, y = box.y + box.h - 3;
  await page.mouse.move(x, y); await page.mouse.down();
  for (let i = 1; i <= 15; i++) await page.mouse.move(x + (400 * i) / 15, y);
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 100));
  const r = await page.$eval(id, (el) => { const b = el.getBoundingClientRect();
    return { w: b.width, h: b.height, ratio: b.width / b.height }; });
  const ok = Math.abs(r.ratio - 16 / 9) < 0.01;
  console.log(`  ${id.padEnd(11)} ${r.w.toFixed(2)} x ${r.h.toFixed(2)}  ratio ${r.ratio.toFixed(4)}  ${ok ? "HOLDS 16/9" : "BROKEN"}`);
}
await b.close();
