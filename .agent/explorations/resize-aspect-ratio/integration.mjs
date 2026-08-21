import { chromium, webkit } from "playwright";
import path from "node:path";
const URL = "file://" + path.resolve("/tmp/resize-probe/integration.html");

async function run(name, launcher) {
  const b = await launcher.launch();
  const page = await b.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(URL);
  console.log(`\n### ${name}`);
  for (const id of ["#projected", "#naive"]) {
    const box = await page.locator(id).boundingBox();
    const x = box.x + box.width - 3, y = box.y + box.height - 3;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 15; i++) await page.mouse.move(x + (400 * i) / 15, y);
    await page.mouse.up();
    await page.waitForTimeout(60);
    const r = await page.locator(id).evaluate((el) => {
      const b = el.getBoundingClientRect();
      return { w: b.width, h: b.height, ratio: b.width / b.height,
               inlineH: el.style.height || "(unset)" };
    });
    const ok = Math.abs(r.ratio - 16 / 9) < 0.01;
    console.log(
      `  ${id.padEnd(11)} ${r.w.toFixed(2)} x ${r.h.toFixed(2)}  ` +
      `ratio ${r.ratio.toFixed(4)}  ${ok ? "HOLDS 16/9" : "BROKEN"}  inline height=${r.inlineH}`);
  }
  await b.close();
}
await run("CHROMIUM", chromium);
await run("WEBKIT", webkit);
