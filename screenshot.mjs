import puppeteer from "puppeteer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, "temporary screenshots");

if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

const url   = process.argv[2] || "http://localhost:3000";
const label = process.argv[3] ? `-${process.argv[3]}` : "";
const width = parseInt(process.argv[4]) || 1440;    // optional viewport width arg

// Find next available screenshot number
let n = 1;
while (fs.existsSync(path.join(screenshotDir, `screenshot-${n}${label}.png`))) n++;
const outPath = path.join(screenshotDir, `screenshot-${n}${label}.png`);

// Update executablePath if your Chrome version changes
// Run: node -e "const p = require('puppeteer'); p.executablePath().then(console.log)"
const browser = await puppeteer.launch({
  executablePath: "C:/Users/darry/.cache/puppeteer/chrome/win64-146.0.7680.76/chrome-win64/chrome.exe",
  args: ["--no-sandbox", "--disable-setuid-sandbox"],
});

const page = await browser.newPage();
await page.setViewport({ width, height: 900 });
await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
await new Promise(r => setTimeout(r, 800));

// Simulate a real scroll from top to bottom so every IntersectionObserver on
// the page (scroll reveals, lazy-loaded images, the onboarding SVG headline
// draw, parallax, etc.) fires the same way it would for an actual visitor —
// a static capture never scrolls, so none of these would otherwise trigger.
// NOTE: deliberately NOT resizing the viewport to the full page height to
// force this instead — that makes vh-based CSS (e.g. hero min-height: 56vh)
// compute against the full page height rather than a real viewport, which
// breaks layout fidelity for the design-QA these screenshots are used for.
await page.evaluate(async () => {
  const step = window.innerHeight * 0.8;
  let last = -1;
  while (document.scrollingElement.scrollTop !== last) {
    last = document.scrollingElement.scrollTop;
    window.scrollBy(0, step);
    await new Promise(r => setTimeout(r, 150));
  }
  window.scrollTo(0, 0);
});
await new Promise(r => setTimeout(r, 300));

// Force all scroll-reveal elements visible before full-page capture
// (belt-and-suspenders in case the scroll pass above missed a threshold)
await page.evaluate(() => {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
});

// Force-render any content-visibility:auto sections (perf optimization that
// skips rendering off-screen content — Puppeteer never scrolls past them
// during a normal page load, so they'd stay blank in a fullPage capture)
await page.evaluate(() => {
  document.querySelectorAll('*').forEach(el => {
    if (getComputedStyle(el).contentVisibility === 'auto') {
      el.style.contentVisibility = 'visible';
    }
  });
});

await new Promise(r => setTimeout(r, 2500));

await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`Screenshot saved: ${outPath}`);
