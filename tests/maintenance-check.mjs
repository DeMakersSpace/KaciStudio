import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import puppeteer from 'puppeteer';
import { spawn } from 'node:child_process';

// Read-only live checks; never submits a contact enquiry.
const root = path.resolve(import.meta.dirname, '..');
const live = process.argv.includes('--live');
const base = live ? 'https://kacistudio.co' : 'http://127.0.0.1:4175';
const routes = (await readdir(path.join(root, '_site'))).filter(name => name.endsWith('.html') && !name.startsWith('google'));
let server;
let browser;
const failures = [];
try {
  if (!live) {
    server = spawn(process.execPath, ['serve.mjs'], { cwd: root, env: { ...process.env, PORT: '4175', SITE_ROOT: path.join(root, '_site') }, stdio: 'ignore' });
    for (let i = 0; i < 50; i++) {
      try { if ((await fetch(base)).ok) break; } catch {}
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  browser = await puppeteer.launch({ headless: true, ...(process.platform === 'win32' ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe' } : {}), args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', error => failures.push(`JavaScript: ${error.message}`));
  page.on('response', response => { if (response.status() >= 400 && response.url().startsWith(base)) failures.push(`${response.status()} ${response.url()}`); });
  const assets = new Set();
  for (const route of routes) {
    await page.goto(`${base}/${route === 'index.html' ? '' : route.replace('.html', '')}`, { waitUntil: 'networkidle2', timeout: 30000 });
    const references = await page.evaluate(() => [...document.querySelectorAll('[src], [poster], link[href], a[href]')].flatMap(el => ['src', 'poster', 'href'].map(attr => el.getAttribute(attr))).filter(Boolean));
    for (const reference of references) {
      const url = new URL(reference, page.url());
      if (url.origin === new URL(base).origin) { url.hash = ''; assets.add(url.href); }
    }
    console.log(`Loaded ${route}`);
  }
  for (const url of assets) {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(20000) });
    if (!response.ok) failures.push(`${response.status} ${url}`);
  }
  const privatePaths = ['/package.json', '/Website%20Discovery%20Guide.docx', '/tests/site-regressions.test.mjs', '/serve.mjs', '/.impeccable.md', '/colour-reference.html', '/maintenance-2026-09-17.md'];
  for (const route of privatePaths) {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(20000) });
    if (response.status !== 404) failures.push(`Private path ${route}: ${response.status}`);
  }
  if (!live) {
    await mkdir(path.join(root, '.tmp-checks'), { recursive: true });
    for (const width of [1440, 390]) {
      await page.setViewport({ width, height: 900 });
      await page.goto(base, { waitUntil: 'networkidle2' });
      await page.screenshot({ path: path.join(root, `.tmp-checks/home-${width}.png`) });
    }
  }
  const result = { base, pages: routes.length, references: assets.size, privatePaths: privatePaths.length, failures: [...new Set(failures)] };
  console.log(JSON.stringify(result, null, 2));
  if (failures.length) process.exitCode = 1;
} finally {
  await browser?.close();
  server?.kill();
}
