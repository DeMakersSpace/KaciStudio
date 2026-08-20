import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test, { after, before } from 'node:test';
import puppeteer from 'puppeteer';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PORT = 4173;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'mobile-320', width: 320, height: 568 },
];

const SITE_ROUTES = [
  '/',
  '/about',
  '/services',
  '/work',
  '/contact',
  '/privacy-policy',
  '/404',
  '/case-brixx-derma',
  '/case-coffeeman-nyp',
  '/case-fino',
  '/case-flyco',
  '/case-happy-rei',
  '/case-luminance-learning',
  '/case-melissa-shoes',
  '/case-resurrack-littlemissmarket',
];

let server;
let browser;

async function waitForServer() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${BASE_URL}/`);
      if (response.ok) return;
    } catch {
      // The server may still be starting.
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Timed out waiting for the local site server');
}

async function makePage(viewport = VIEWPORTS[0]) {
  const page = await browser.newPage();
  await page.setViewport({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setRequestInterception(true);
  page.on('request', request => {
    const url = new URL(request.url());
    const isLocal = url.hostname === '127.0.0.1';
    const isHeavyAsset = ['image', 'media', 'font'].includes(request.resourceType());
    if (!isLocal || isHeavyAsset) request.abort();
    else request.continue();
  });
  return page;
}

async function open(page, route) {
  await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
}

async function duplicateIds(page) {
  return page.$$eval('[id]', elements => {
    const counts = new Map();
    elements.forEach(element => counts.set(element.id, (counts.get(element.id) || 0) + 1));
    return Array.from(counts.entries()).filter(([, count]) => count > 1);
  });
}

before(async () => {
  server = spawn(process.execPath, ['serve.mjs'], {
    cwd: ROOT,
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
  browser = await puppeteer.launch({
    headless: true,
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
});

after(async () => {
  if (browser) await browser.close();
  if (server && !server.killed) server.kill();
});

test('every server-rendered mobile menu starts hidden and inert', async () => {
  for (const route of SITE_ROUTES) {
    const filename = route === '/' ? 'index.html' : `${route.slice(1)}.html`;
    const source = await readFile(path.join(ROOT, filename), 'utf8');
    const menuTag = source.match(/<div class="kaci-mobile-menu"[^>]*>/)?.[0] || '';
    assert.match(menuTag, /\shidden(?:\s|>)/, `${filename} menu is not initially hidden`);
    assert.match(menuTag, /\sinert(?:\s|>)/, `${filename} menu is not initially inert`);
    assert.match(menuTag, /aria-hidden="true"/, `${filename} menu is exposed to assistive technology`);
  }
});

test('every rendered page starts with unique IDs', async () => {
  const page = await makePage();
  try {
    for (const route of SITE_ROUTES) {
      await open(page, route);
      assert.deepEqual(await duplicateIds(page), [], `${route} contains duplicate IDs`);
    }
  } finally {
    await page.close();
  }
});

test('testimonial clones are inaccessible, ID-free, and labels reflect expansion', async () => {
  const page = await makePage();
  try {
    await open(page, '/');
    await page.$eval('.love-marquee', element => element.scrollIntoView({ block: 'center' }));
    await page.waitForFunction(() => document.querySelectorAll('#loveTrack .love-card').length === 14);

    assert.deepEqual(await duplicateIds(page), []);
    const cloneProblems = await page.$$eval('[data-carousel-clone]', clones => clones.flatMap(clone => {
      const problems = [];
      if (clone.getAttribute('aria-hidden') !== 'true') problems.push('clone is exposed');
      if (clone.querySelector('[id]')) problems.push('clone contains an ID');
      clone.querySelectorAll('a, button, input, select, textarea').forEach(control => {
        if (control.getAttribute('tabindex') !== '-1' || control.getAttribute('aria-hidden') !== 'true') {
          problems.push('clone contains an exposed control');
        }
        if (control.hasAttribute('aria-controls')) problems.push('clone control references a panel');
      });
      return problems;
    }));
    assert.deepEqual(cloneProblems, []);

    await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.click());
    assert.equal(
      await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.textContent.trim()),
      'Read less ↑',
    );
    await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.click());
    assert.equal(
      await page.$eval('#loveTrack > .love-card:not([data-carousel-clone]) .love-expand-btn', button => button.textContent.trim()),
      'Read full letter ↓',
    );
  } finally {
    await page.close();
  }
});

for (const viewport of VIEWPORTS.filter(item => item.width < 768)) {
  test(`mobile menu traps and restores focus at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      await open(page, '/contact');
      const closedState = await page.$eval('#kaci-mobile-menu', menu => ({
        hidden: menu.hidden,
        inert: menu.hasAttribute('inert'),
        ariaHidden: menu.getAttribute('aria-hidden'),
      }));
      assert.deepEqual(closedState, { hidden: true, inert: true, ariaHidden: 'true' });

      await page.click('.kaci-nav-hamburger');
      await page.waitForFunction(() => document.activeElement?.classList.contains('kaci-mobile-close'));
      assert.equal(await page.$eval('.kaci-nav-hamburger', button => button.getAttribute('aria-expanded')), 'true');

      await page.keyboard.down('Shift');
      await page.keyboard.press('Tab');
      await page.keyboard.up('Shift');
      assert.equal(await page.evaluate(() => document.activeElement?.textContent.trim()), 'Contact');

      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('kaci-mobile-close')), true);

      await page.keyboard.press('Escape');
      assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('kaci-nav-hamburger')), true);
      assert.equal(await page.$eval('#kaci-mobile-menu', menu => menu.hidden && menu.hasAttribute('inert')), true);
    } finally {
      await page.close();
    }
  });
}

test('Services controls expose state and support keyboard operation', async () => {
  const page = await makePage(VIEWPORTS[1]);
  try {
    await open(page, '/services');

    const relationshipProblems = await page.evaluate(() => {
      const problems = [];
      document.querySelectorAll('[aria-controls]').forEach(control => {
        const panelId = control.getAttribute('aria-controls');
        if (!panelId || !document.getElementById(panelId)) problems.push(`Missing panel: ${panelId}`);
      });
      return problems;
    });
    assert.deepEqual(relationshipProblems, []);

    await page.focus('#service-tab-smm');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'service-tab-content');
    assert.equal(await page.$eval('#service-tab-content', button => button.getAttribute('aria-selected')), 'true');
    assert.equal(await page.$eval('#service-panel-content', panel => panel.hidden), false);
    assert.equal(await page.$eval('#service-panel-smm', panel => panel.hidden), true);

    await page.focus('#onboardChips .onboard-chip');
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.$eval('#onboardChips .onboard-chip:nth-child(2)', button => button.getAttribute('aria-pressed')), 'true');
    assert.equal(await page.$eval('#onboard-step-2', panel => panel.getAttribute('aria-hidden')), 'false');
    assert.equal(await page.$eval('#onboard-step-1', panel => panel.hasAttribute('inert')), true);

    await page.focus('#faq-question-deliverables');
    await page.keyboard.press('Enter');
    assert.equal(await page.$eval('#faq-question-deliverables', button => button.getAttribute('aria-expanded')), 'true');
    assert.equal(await page.$eval('#faq-answer-deliverables', panel => panel.hidden), false);
    await page.keyboard.press('Space');
    assert.equal(await page.$eval('#faq-question-deliverables', button => button.getAttribute('aria-expanded')), 'false');
    assert.equal(await page.$eval('#faq-answer-deliverables', panel => panel.hidden), true);
  } finally {
    await page.close();
  }
});

test('contact honeypot stays submitted but is inert and hidden from assistive technology', async () => {
  const page = await makePage();
  try {
    await open(page, '/contact');
    const state = await page.$eval('.spam-field', field => ({
      ariaHidden: field.getAttribute('aria-hidden'),
      inert: field.hasAttribute('inert'),
      inFormData: new FormData(field.closest('form')).has(field.querySelector('input').name),
      tabIndex: field.querySelector('input').tabIndex,
    }));
    assert.deepEqual(state, { ariaHidden: 'true', inert: true, inFormData: true, tabIndex: -1 });
  } finally {
    await page.close();
  }
});

for (const viewport of VIEWPORTS) {
  test(`key pages have no horizontal overflow at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      for (const route of ['/', '/services', '/contact']) {
        await open(page, route);
        const overflow = await page.evaluate(() => ({
          viewport: document.documentElement.clientWidth,
          content: document.documentElement.scrollWidth,
        }));
        assert.ok(
          overflow.content <= overflow.viewport + 1,
          `${route} overflows by ${overflow.content - overflow.viewport}px`,
        );
      }
    } finally {
      await page.close();
    }
  });
}

for (const viewport of VIEWPORTS.filter(item => item.width < 768)) {
  test(`fixed navigation clears the mobile form at ${viewport.width}x${viewport.height}`, async () => {
    const page = await makePage(viewport);
    try {
      await open(page, '/contact');
      const positions = await page.evaluate(async () => {
        const submit = document.querySelector('.form-submit');
        const nav = document.querySelector('.kaci-nav');
        submit.scrollIntoView({ block: 'end' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const submitRect = submit.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        return { submitBottom: submitRect.bottom, navTop: navRect.top };
      });
      assert.ok(
        positions.submitBottom <= positions.navTop,
        `form ends at ${positions.submitBottom}px while navigation starts at ${positions.navTop}px`,
      );
    } finally {
      await page.close();
    }
  });
}
