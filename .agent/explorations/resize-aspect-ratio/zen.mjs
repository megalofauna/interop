import puppeteer from "puppeteer-core";
import path from "node:path";

const URL = "file://" + path.resolve("probe.html");
const ZEN = "/Applications/Zen.app/Contents/MacOS/zen";

const CASES = [
  ["#a", "A  resize:horizontal + ratio", 200, 120],
  ["#b", "B  resize:both + ratio (control)", 200, 120],
  ["#c", "C  resize:vertical + ratio", 0, 150],
  ["#d", "D  horizontal + ratio + max-block-size:300", 300, 0],
];

const read = (el) => {
  const r = el.getBoundingClientRect();
  return {
    w: el.style.width || "(unset)",
    h: el.style.height || "(unset)",
    rect: `${r.width.toFixed(2)} x ${r.height.toFixed(2)}`,
    ratio: r.height ? (r.width / r.height).toFixed(4) : "n/a",
  };
};

const browser = await puppeteer.launch({
  browser: "firefox",
  executablePath: ZEN,
  headless: true,
  protocol: "webDriverBiDi",
  timeout: 120000,
  args: ["--width=1400", "--height=1000"],
});

console.log("LAUNCHED:", await browser.version());
const page = await browser.newPage();
await page.setViewport({ width: 1400, height: 1000 });
await page.goto(URL, { waitUntil: "load" });

console.log(`\n${"=".repeat(70)}\n### ZEN (Gecko)   16/9 = 1.7778\n${"=".repeat(70)}`);

for (const [sel, label] of [
  ["#e", "E  min 711.11 vs max 600            "],
  ["#f", "F  ratio + both dims definite       "],
  ["#g", "G  overflow:visible + 240px content "],
  ["#h", "H  overflow:hidden  + 240px content "],
]) {
  const r = await page.$eval(sel, read);
  console.log(`${label}  rect=${r.rect}  ratio=${r.ratio}`);
}

for (const [sel, label, dx, dy] of CASES) {
  await page.goto(URL, { waitUntil: "load" });
  await page.$eval(sel, (el) => el.scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 120));

  const before = await page.$eval(sel, read);
  const box = await page.$eval(sel, (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height };
  });
  const x = box.x + box.w - 3;
  const y = box.y + box.h - 3;

  await page.mouse.move(x, y);
  await new Promise((r) => setTimeout(r, 60));
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 60));
  for (let i = 1; i <= 20; i++) {
    await page.mouse.move(x + (dx * i) / 20, y + (dy * i) / 20);
    await new Promise((r) => setTimeout(r, 10));
  }
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 120));

  const after = await page.$eval(sel, read);
  const took = before.rect !== after.rect;
  console.log(
    `\n${label}   (corner @ ${x.toFixed(0)},${y.toFixed(0)}  drag ${dx},${dy})\n` +
      `   ${before.rect} (${before.ratio})  ->  ${after.rect} (${after.ratio})${took ? "" : "   << NO DRAG"}\n` +
      `   UA inline:  width=${after.w}  height=${after.h}`,
  );
}

await browser.close();
