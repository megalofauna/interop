import { chromium, firefox, webkit } from "playwright";
import path from "node:path";

const URL = "file://" + path.resolve("probe.html");

async function report(page, sel) {
  return page.locator(sel).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      w: el.style.width || "(unset)",
      h: el.style.height || "(unset)",
      rect: `${r.width.toFixed(2)} x ${r.height.toFixed(2)}`,
      ratio: r.height ? (r.width / r.height).toFixed(4) : "n/a",
    };
  });
}

const CASES = [
  ["#a", "A  resize:horizontal + ratio", 200, 120],
  ["#b", "B  resize:both + ratio (control)", 200, 120],
  ["#c", "C  resize:vertical + ratio", 0, 150],
  ["#d", "D  horizontal + ratio + max-block-size:300", 300, 0],
];

async function run(name, launcher) {
  let browser;
  try {
    browser = await launcher.launch({ timeout: 300000 });
  } catch (e) {
    console.log(`\n### ${name}: UNAVAILABLE — ${e.message.split("\n")[0]}`);
    return;
  }
  console.log(`\n${"=".repeat(70)}\n### ${name}  (16/9 = 1.7778)\n${"=".repeat(70)}`);
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  await page.goto(URL);
  for (const [sel, label] of [
    ["#e", "E  min 711.11 vs max 600            "],
    ["#f", "F  ratio + both dims definite       "],
    ["#g", "G  overflow:visible + 240px content "],
    ["#h", "H  overflow:hidden  + 240px content "],
  ]) {
    const r = await report(page, sel);
    console.log(`${label}  rect=${r.rect}  ratio=${r.ratio}`);
  }

  for (const [sel, label, dx, dy] of CASES) {
    // Fresh load per case so earlier drags can't push this one off-viewport.
    await page.goto(URL);
    await page.locator(sel).evaluate((el) => el.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(80);

    const before = await report(page, sel);
    const box = await page.locator(sel).boundingBox();
    const x = box.x + box.width - 3;
    const y = box.y + box.height - 3;

    await page.mouse.move(x, y);
    await page.waitForTimeout(50);
    await page.mouse.down();
    await page.waitForTimeout(50);
    for (let i = 1; i <= 20; i++) {
      await page.mouse.move(x + (dx * i) / 20, y + (dy * i) / 20);
      await page.waitForTimeout(8);
    }
    await page.mouse.up();
    await page.waitForTimeout(80);

    const after = await report(page, sel);
    const took = before.rect !== after.rect;
    console.log(
      `\n${label}   (corner @ ${x.toFixed(0)},${y.toFixed(0)}  drag ${dx},${dy})\n` +
        `   ${before.rect} (${before.ratio})  ->  ${after.rect} (${after.ratio})${took ? "" : "   << NO DRAG"}\n` +
        `   UA inline:  width=${after.w}  height=${after.h}`,
    );
  }
  await browser.close();
}

const which = process.argv[2];
if (!which || which === "cr") await run("CHROMIUM", chromium);
if (!which || which === "wk") await run("WEBKIT", webkit);
if (!which || which === "ff") await run("FIREFOX", firefox);
